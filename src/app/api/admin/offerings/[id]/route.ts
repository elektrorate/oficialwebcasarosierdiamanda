import { NextResponse, type NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/auth/supabase-auth";
import {
  deleteOfferingPermanently,
  duplicateOffering,
  getOfferingById,
  moveOfferingToTrash,
  restoreOffering,
  updateOffering,
} from "@/lib/cms/offerings";
import { refreshOfferingPaths } from "@/lib/cms/offering-routes";
import { expirationSaveError } from "@/lib/cms/offering-expiration";
import { internalApiError } from "@/lib/security/api-response";

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await requireAdminApi();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json();

  const expirationError = expirationSaveError({
    expirationEnabled: body.expiration_enabled === true,
    expiresAt: body.expires_at,
    status: body.status,
  });
  if (expirationError) {
    return NextResponse.json({ error: expirationError }, { status: 400 });
  }

  try {
    const previous = await getOfferingById(id);
    const offering = await updateOffering(id, body);

    if (!offering) {
      return NextResponse.json({ error: "Offering no encontrado" }, { status: 404 });
    }

    refreshOfferingPaths(previous, offering);
    return NextResponse.json({ offering });
  } catch (error) {
    return internalApiError(error, "No se pudo actualizar el offering.", 400);
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await requireAdminApi();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { action?: string };

  if (body.action === "duplicate") {
    const offering = await duplicateOffering(id);
    if (!offering) {
      return NextResponse.json({ error: "Offering no encontrado" }, { status: 404 });
    }
    refreshOfferingPaths(offering);
    return NextResponse.json({ offering });
  }

  if (body.action === "trash") {
    const previous = await getOfferingById(id);
    const offering = await moveOfferingToTrash(id, session.userEmail);
    if (!offering) {
      return NextResponse.json({ error: "Offering no encontrado" }, { status: 404 });
    }
    refreshOfferingPaths(previous, offering);
    return NextResponse.json({ offering });
  }

  if (body.action === "restore") {
    const offering = await restoreOffering(id);
    if (!offering) {
      return NextResponse.json({ error: "Offering no encontrado" }, { status: 404 });
    }
    refreshOfferingPaths(offering);
    return NextResponse.json({ offering });
  }

  const offering = await getOfferingById(id);
  if (!offering) {
    return NextResponse.json({ error: "Offering no encontrado" }, { status: 404 });
  }

  const nextStatus = body.action === "publish" ? "published" : body.action === "archive" ? "archived" : body.action === "draft" ? "draft" : null;
  if (!nextStatus) {
    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  }

  const expirationError = expirationSaveError({
    expirationEnabled: offering.expiration_enabled,
    expiresAt: offering.expires_at,
    status: nextStatus,
  });
  if (expirationError) {
    return NextResponse.json({ error: expirationError }, { status: 400 });
  }

  const updated = await updateOffering(id, { ...offering, status: nextStatus });
  refreshOfferingPaths(offering, updated);
  return NextResponse.json({ offering: updated });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await requireAdminApi();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const previous = await getOfferingById(id);
  const deleted = await deleteOfferingPermanently(id);
  if (!deleted) {
    return NextResponse.json({ error: "Offering no encontrado" }, { status: 404 });
  }

  refreshOfferingPaths(previous);
  return NextResponse.json({ ok: true });
}
