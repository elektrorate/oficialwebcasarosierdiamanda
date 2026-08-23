import { type NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/supabase-auth";
import { deleteCmsAdminUser, isCmsUserManagementConfigured, updateCmsAdminUserPassword, updateCmsUserRole } from "@/lib/admin/users";
import { internalApiError } from "@/lib/security/api-response";
import { canManageUsers, isUserRole } from "@/lib/auth/roles";

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageUsers(session.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!isCmsUserManagementConfigured()) {
    return NextResponse.json({ error: "La gestión de usuarios requiere SUPABASE_SERVICE_ROLE_KEY en el servidor." }, { status: 503 });
  }

  try {
    const { id } = await ctx.params;
    const body = (await request.json().catch(() => ({}))) as { password?: string; role?: unknown };
    if (body.role !== undefined) {
      if (!isUserRole(body.role)) return NextResponse.json({ error: "Selecciona un rol válido." }, { status: 400 });
      await updateCmsUserRole({
        id,
        role: body.role,
        actorId: session.userId,
        actorEmail: session.userEmail,
      });
    } else {
      await updateCmsAdminUserPassword(id, body.password ?? "", session.userEmail);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return internalApiError(error, "No se pudo actualizar la contraseña.", 400);
  }
}

export async function DELETE(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageUsers(session.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!isCmsUserManagementConfigured()) {
    return NextResponse.json({ error: "La gestión de usuarios requiere SUPABASE_SERVICE_ROLE_KEY en el servidor." }, { status: 503 });
  }

  try {
    const { id } = await ctx.params;
    await deleteCmsAdminUser(id, session.userId, session.userEmail);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return internalApiError(error, "No se pudo eliminar el usuario.", 400);
  }
}
