import type { User } from "@supabase/supabase-js";
import { LOCAL_ADMIN_EMAIL } from "@/lib/auth/local-auth";
import { isUserRole, type AdminRole } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAction } from "@/lib/cms/history-logs";

export interface CmsAdminUser {
  id: string;
  email: string;
  full_name: string;
  role: AdminRole;
  created_at: string;
  last_sign_in_at: string | null;
}

type AdminProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isSuperAdminEmail(email: string | null | undefined) {
  return normalizeEmail(email ?? "") === normalizeEmail(LOCAL_ADMIN_EMAIL);
}

function displayNameFromEmail(email: string) {
  return email.split("@")[0].replace(/[._-]+/g, " ");
}

async function getAuthUsers() {
  const supabase = createAdminClient();
  const users: User[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    users.push(...(data.users ?? []));
    if (!data.users || data.users.length < perPage) break;
    page += 1;
  }

  return users;
}

export async function getCmsAdminUsers(): Promise<CmsAdminUser[]> {
  let authUsersResult: User[] = [];
  let profiles: AdminProfileRow[] = [];

  try {
    const supabase = createAdminClient();
    const [authUsers, profilesResult] = await Promise.all([
      getAuthUsers(),
      supabase.from("profiles").select("id,email,full_name,role,created_at"),
    ]);
    if (profilesResult.error) throw profilesResult.error;
    authUsersResult = authUsers;
    profiles = (profilesResult.data ?? []) as AdminProfileRow[];
  } catch {
    return [];
  }

  const profilesById = new Map(
    profiles.map((profile) => [profile.id, profile]),
  );

  return authUsersResult
    .filter((user) => !isSuperAdminEmail(user.email))
    .map((user): CmsAdminUser | null => {
      const profile = profilesById.get(user.id);
      if (!profile || !isUserRole(profile.role) || isSuperAdminEmail(profile.email)) return null;
      const email = normalizeEmail(user.email ?? profile?.email ?? "");
      return {
        id: user.id,
        email,
        full_name: profile?.full_name || displayNameFromEmail(email),
        role: profile.role,
        created_at: profile?.created_at ?? user.created_at,
        last_sign_in_at: user.last_sign_in_at ?? null,
      };
    })
    .filter((user): user is CmsAdminUser => Boolean(user?.email))
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}

export async function createCmsAdminUser(input: {
  email: string;
  password: string;
  full_name?: string;
  role: AdminRole;
  actorEmail: string;
}) {
  const email = normalizeEmail(input.email);
  const fullName = (input.full_name || displayNameFromEmail(email)).trim();

  if (!email || !input.password) throw new Error("Email y contraseña son obligatorios.");
  if (isSuperAdminEmail(email)) throw new Error("El super admin no se gestiona desde esta sección.");
  if (input.password.length < 8) throw new Error("La contraseña debe tener al menos 8 caracteres.");
  if (!isUserRole(input.role)) throw new Error("El rol seleccionado no es válido.");

  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error) throw error;
  if (!data.user) throw new Error("No se pudo crear el usuario.");

  const profile = {
    id: data.user.id,
    email,
    full_name: fullName,
    role: input.role,
    avatar_url: null,
  };

  const { error: profileError } = await supabase.from("profiles").upsert(profile, { onConflict: "id" });
  if (profileError) throw profileError;

  await logAction({
    action: "create",
    entity_type: "admin_user",
    entity_id: data.user.id,
    entity_title: email,
    new_data: { email, full_name: fullName, role: input.role },
    user_email: input.actorEmail,
  });

  return data.user;
}

export function isCmsUserManagementConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function getProfileForManagement(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data || !isUserRole(data.role)) throw new Error("Usuario no encontrado.");
  return data as AdminProfileRow & { role: AdminRole };
}

async function assertAdminCanBeRemoved(profile: AdminProfileRow & { role: AdminRole }) {
  if (profile.role !== "admin") return;
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");
  if (error) throw error;
  if ((count ?? 0) <= 1) throw new Error("Debe permanecer al menos un administrador.");
}

export async function updateCmsUserRole(input: {
  id: string;
  role: AdminRole;
  actorId: string;
  actorEmail: string;
}) {
  if (!isUserRole(input.role)) throw new Error("El rol seleccionado no es válido.");
  if (input.id === input.actorId) throw new Error("No puedes cambiar tu propio rol.");

  const profile = await getProfileForManagement(input.id);
  if (isSuperAdminEmail(profile.email)) throw new Error("El super admin no se gestiona desde esta sección.");
  if (profile.role === input.role) return profile;
  if (profile.role === "admin" && input.role !== "admin") await assertAdminCanBeRemoved(profile);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ role: input.role })
    .eq("id", input.id)
    .select("id,email,full_name,role,created_at")
    .single();
  if (error) throw error;

  await logAction({
    action: "update",
    entity_type: "admin_user",
    entity_id: input.id,
    entity_title: profile.email,
    old_data: { role: profile.role },
    new_data: { role: input.role },
    user_email: input.actorEmail,
  });

  return data;
}

export async function updateCmsAdminUserPassword(id: string, password: string, actorEmail: string) {
  if (!password || password.length < 8) throw new Error("La contraseña debe tener al menos 8 caracteres.");

  const supabase = createAdminClient();
  const { data: userData, error: getError } = await supabase.auth.admin.getUserById(id);
  if (getError) throw getError;
  if (!userData.user || isSuperAdminEmail(userData.user.email)) {
    throw new Error("Este usuario no se puede editar desde esta sección.");
  }

  const { error } = await supabase.auth.admin.updateUserById(id, { password });
  if (error) throw error;

  await logAction({
    action: "update",
    entity_type: "admin_user",
    entity_id: id,
    entity_title: userData.user.email ?? id,
    new_data: { password_updated: true },
    user_email: actorEmail,
  });
}

export async function deleteCmsAdminUser(id: string, actorId: string, actorEmail: string) {
  if (id === actorId) throw new Error("No puedes eliminar tu propio usuario.");
  const supabase = createAdminClient();
  const { data: userData, error: getError } = await supabase.auth.admin.getUserById(id);
  if (getError) throw getError;
  if (!userData.user || isSuperAdminEmail(userData.user.email)) {
    throw new Error("Este usuario no se puede eliminar desde esta sección.");
  }

  const profile = await getProfileForManagement(id);
  await assertAdminCanBeRemoved(profile);

  const email = userData.user.email ?? id;
  const { error: profileError } = await supabase.from("profiles").delete().eq("id", id);
  if (profileError) throw profileError;

  const { error } = await supabase.auth.admin.deleteUser(id);
  if (error) throw error;

  await logAction({
    action: "delete_permanently",
    entity_type: "admin_user",
    entity_id: id,
    entity_title: email,
    old_data: { email },
    user_email: actorEmail,
  });
}
