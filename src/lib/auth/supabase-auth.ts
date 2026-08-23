import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { cache } from "react";
import { getCurrentLocalSession, LOCAL_ADMIN_EMAIL } from "./local-auth";
import { isAdminRole, type AdminRole } from "./roles";
export { ADMIN_ROLES, isAdminRole } from "./roles";

export interface AdminProfile {
  id: string;
  full_name: string | null;
  email: string;
  role: AdminRole;
  avatar_url: string | null;
}


function isLocalAuthBypassEnabled() {
  return process.env.NODE_ENV !== "production" && process.env.LOCAL_AUTH_BYPASS === "true";
}

function hasSupabaseAuthEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

async function createSupabaseAuthClient() {
  if (!hasSupabaseAuthEnv()) return null;

  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Read-only Server Component contexts cannot mutate cookies.
          }
        },
      },
    },
  );
}

export async function getCurrentUser() {
  try {
    const supabase = await createSupabaseAuthClient();
    if (!supabase) return null;
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) return null;
    return data.user;
  } catch {
    return null;
  }
}

export async function getProfile(userId: string, authenticatedClient?: SupabaseClient): Promise<AdminProfile | null> {
  try {
    const client = authenticatedClient ?? await createSupabaseAuthClient();
    if (!client) return null;
    const { data } = await client
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    return data as AdminProfile | null;
  } catch {
    return null;
  }
}




async function requireAdminProfileUncached(): Promise<{ user: { id: string; email?: string | null }; profile: AdminProfile } | null> {
  if (isLocalAuthBypassEnabled()) {
    return {
      user: { id: "local-bypass-admin", email: LOCAL_ADMIN_EMAIL },
      profile: {
        id: "local-bypass-admin",
        full_name: "Local Admin",
        email: LOCAL_ADMIN_EMAIL,
        role: "admin",
        avatar_url: null,
      },
    };
  }
  const localSession = await getCurrentLocalSession();
  if (localSession) {
    return {
      user: { id: "bootstrap-admin", email: localSession.email },
      profile: {
        id: "bootstrap-admin",
        full_name: "Admin User",
        email: localSession.email,
        role: "admin",
        avatar_url: null,
      },
    };
  }

  const user = await getCurrentUser();
  if (!user) return null;

  const profile = await getProfile(user.id);
  if (!profile) return null;
  if (!isAdminRole(profile.role)) return null;

  return { user, profile };
}

export const requireAdminProfile = cache(requireAdminProfileUncached);

export interface AdminSession {
  userId: string;
  userEmail: string;
  role: AdminRole;
}

export async function requireAdminApi(): Promise<AdminSession | null> {
  if (isLocalAuthBypassEnabled()) {
    return { userId: "local-bypass-admin", userEmail: LOCAL_ADMIN_EMAIL, role: "admin" };
  }
  const localSession = await getCurrentLocalSession();
  if (localSession) {
    return { userId: "bootstrap-admin", userEmail: localSession.email, role: "admin" };
  }

  try {
    const supabase = await createSupabaseAuthClient();
    const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
    if (!user?.email) return null;

    const profile = await getProfile(user.id);
    if (!profile || !isAdminRole(profile.role)) return null;

    return { userId: user.id, userEmail: user.email, role: profile.role };
  } catch {
    return null;
  }
}
