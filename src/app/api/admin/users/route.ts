import { type NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/supabase-auth";
import { createCmsAdminUser, getCmsAdminUsers, isCmsUserManagementConfigured } from "@/lib/admin/users";
import { internalApiError } from "@/lib/security/api-response";
import { canManageUsers, isUserRole } from "@/lib/auth/roles";

export async function GET() {
  const session = await requireAdminApi();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canManageUsers(session.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!isCmsUserManagementConfigured()) {
    return NextResponse.json({ error: "La gestión de usuarios requiere SUPABASE_SERVICE_ROLE_KEY en el servidor." }, { status: 503 });
  }

  try {
    const users = await getCmsAdminUsers();
    return NextResponse.json({ users });
  } catch (error) {
    return internalApiError(error, "No se pudieron cargar los usuarios.");
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageUsers(session.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!isCmsUserManagementConfigured()) {
    return NextResponse.json({ error: "La gestión de usuarios requiere SUPABASE_SERVICE_ROLE_KEY en el servidor." }, { status: 503 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      email?: string;
      password?: string;
      full_name?: string;
      role?: unknown;
    };

    if (!isUserRole(body.role)) {
      return NextResponse.json({ error: "Selecciona un rol válido." }, { status: 400 });
    }

    await createCmsAdminUser({
      email: body.email ?? "",
      password: body.password ?? "",
      full_name: body.full_name,
      role: body.role,
      actorEmail: session.userEmail,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return internalApiError(error, "No se pudo crear el usuario.", 400);
  }
}
