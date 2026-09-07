import { NextResponse, type NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/auth/supabase-auth";
import { getOfferingById, updateOffering } from "@/lib/cms/offerings";
import { refreshOfferingPaths } from "@/lib/cms/offering-routes";
import type { OfferingStatus } from "@/lib/cms/types";

function resolveStatus(enabled: boolean): OfferingStatus {
  return enabled ? "published" : "draft";
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await requireAdminApi();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { enabled?: boolean };

  if (typeof body.enabled !== "boolean") {
    return NextResponse.json({ error: "El campo enabled es obligatorio." }, { status: 400 });
  }

  const offering = await getOfferingById(id);
  if (!offering) {
    return NextResponse.json({ error: "Offering no encontrado" }, { status: 404 });
  }

  if (offering.status === "deleted" || offering.status === "archived") {
    return NextResponse.json({ error: "No se puede cambiar el estado de un contenido archivado o eliminado." }, { status: 400 });
  }

  const nextStatus = resolveStatus(body.enabled);

  if (nextStatus === "published") {
    if (offering.expiration_enabled && !offering.expires_at) {
      return NextResponse.json({ error: "La caducidad está activa, pero falta la fecha de finalización." }, { status: 400 });
    }
    if (offering.expiration_enabled && new Date(offering.expires_at as string).getTime() <= Date.now()) {
      return NextResponse.json({ error: "No se puede publicar con una fecha de caducidad vencida. Elige una nueva fecha futura o desactiva la caducidad." }, { status: 400 });
    }
  }

  if (offering.status === nextStatus) {
    return NextResponse.json({ offering });
  }

  const updated = await updateOffering(id, { ...offering, status: nextStatus });
  if (!updated) {
    return NextResponse.json({ error: "No se pudo actualizar el estado." }, { status: 500 });
  }

  refreshOfferingPaths(offering, updated);
  return NextResponse.json({ offering: updated, enabled: nextStatus === "published" });
}
