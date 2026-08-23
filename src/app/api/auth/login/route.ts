import { after, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  createLocalSessionCookie,
  createLocalSessionToken,
  validateLocalCredentials,
} from "@/lib/auth/local-auth";
import { getProfile, isAdminRole } from "@/lib/auth/supabase-auth";
import { logAction } from "@/lib/cms/history-logs";
import { apiErrorResponse, enforceRateLimit, readJsonObject, resetRateLimit } from "@/lib/security/api-protection";

function hasSupabaseAuthEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function scheduleLoginLog(input: {
  entity_id: string;
  entity_title: string;
  user_id: string;
  user_email: string;
}) {
  after(() => {
    void logAction({
      action: "login",
      entity_type: "auth",
      ...input,
    }).catch(() => undefined);
  });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    await enforceRateLimit(request, { route: "auth/login", limit: 5, windowSeconds: 15 * 60 });
    body = await readJsonObject(request, 8 * 1024);
  } catch (error) {
    return apiErrorResponse(error);
  }

  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password || email.length > 254 || password.length > 1024) {
    return NextResponse.json({ error: "Email y contraseña requeridos" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!(await validateLocalCredentials(email, password))) {
    if (!hasSupabaseAuthEnv()) {
      return NextResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      },
    );

    const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    if (error || !data.user) {
      return NextResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 });
    }

    const profile = await getProfile(data.user.id, supabase);
    if (!profile || !isAdminRole(profile.role)) {
      return NextResponse.json({ error: "Usuario sin permisos de administracion" }, { status: 403 });
    }

    scheduleLoginLog({
      entity_id: data.user.id,
      entity_title: data.user.email ?? normalizedEmail,
      user_id: data.user.id,
      user_email: data.user.email ?? normalizedEmail,
    });

    await resetRateLimit(request, "auth/login").catch(() => undefined);

    return response;
  }

  const token = await createLocalSessionToken(normalizedEmail);
  const sessionCookie = createLocalSessionCookie(token);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.options);

  scheduleLoginLog({
    entity_id: "bootstrap-admin",
    entity_title: normalizedEmail,
    user_id: "bootstrap-admin",
    user_email: normalizedEmail,
  });

  await resetRateLimit(request, "auth/login").catch(() => undefined);

  return response;
}
