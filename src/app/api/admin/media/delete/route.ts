import { NextResponse, type NextRequest } from "next/server";
import { deleteMediaAsset, getMediaAssetById, isMediaImage, moveMediaToTrash, restoreMediaAsset } from "@/lib/cms/media";
import { requireAdminApi } from "@/lib/auth/supabase-auth";

export async function POST(request: NextRequest) {
  const session = await requireAdminApi();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { id?: string; ids?: string[]; action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON no válido." }, { status: 400 });
  }

  const ids = body.ids?.length
    ? body.ids
    : body.id
      ? [body.id]
      : [];

  if (!ids.length) {
    return NextResponse.json({ error: "Falta el id del asset." }, { status: 400 });
  }

  const { action } = body;

  if (action === "permanent" && ids.length > 1) {
    const deletedIds: string[] = [];
    const failedIds: string[] = [];

    for (const assetId of ids) {
      const asset = await getMediaAssetById(assetId);
      if (!asset) {
        failedIds.push(assetId);
        continue;
      }
      if (!isMediaImage(asset)) {
        failedIds.push(assetId);
        continue;
      }

      const deleted = await deleteMediaAsset(assetId);
      if (deleted) {
        deletedIds.push(assetId);
      } else {
        failedIds.push(assetId);
      }
    }

    const allDeleted = failedIds.length === 0;
    return NextResponse.json({
      ok: allDeleted,
      deletedIds,
      failedIds,
      error: allDeleted ? undefined : `No se pudieron eliminar ${failedIds.length} de ${ids.length} fotos.`,
    });
  }

  const id = ids[0];

  if (action === "trash") {
    const asset = await moveMediaToTrash(id, session.userEmail);
    if (!asset) {
      return NextResponse.json({ error: "Asset no encontrado." }, { status: 404 });
    }
    return NextResponse.json({ asset });
  }

  if (action === "restore") {
    const asset = await restoreMediaAsset(id);
    if (!asset) {
      return NextResponse.json({ error: "Asset no encontrado." }, { status: 404 });
    }
    return NextResponse.json({ asset });
  }

  if (action === "permanent") {
    const asset = await getMediaAssetById(id);
    if (!asset) {
      return NextResponse.json({ error: "Asset no encontrado." }, { status: 404 });
    }
    if (!isMediaImage(asset)) {
      return NextResponse.json({ error: "Solo las fotos se pueden eliminar desde Multimedia." }, { status: 400 });
    }

    const deleted = await deleteMediaAsset(id);
    if (!deleted) {
      return NextResponse.json({ error: "No se pudo eliminar la foto en Supabase." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Acción no válida. Usa trash, restore o permanent." }, { status: 400 });
}
