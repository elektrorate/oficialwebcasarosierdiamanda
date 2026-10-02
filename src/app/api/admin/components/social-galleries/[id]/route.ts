import { requireAdminApi } from "@/lib/auth/supabase-auth";
import { invalidatePublicContentCache } from "@/lib/cms/public-content";
import { getSocialGalleryById, updateSocialGallery } from "@/lib/cms/social-galleries";
import { socialGalleryModalContentError } from "@/lib/cms/modal-content";
import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

function refreshSocialGalleryViews() {
  invalidatePublicContentCache();
  revalidatePath("/", "layout");
  revalidatePath("/admin/components/social-galleries");
}

export async function GET(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  void _request;
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const item = await getSocialGalleryById((await ctx.params).id); if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json({ socialGallery: item });
}
export async function PUT(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const modalContentError = socialGalleryModalContentError(body);
  if (modalContentError) return NextResponse.json({ error: modalContentError }, { status: 400 });
  try { const item = await updateSocialGallery((await ctx.params).id, body); if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 }); refreshSocialGalleryViews(); return NextResponse.json({ socialGallery: item }); }
  catch (err) { return NextResponse.json({ error: err instanceof Error ? err.message : "No se pudo guardar la galería social." }, { status: 400 }); }
}
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params; const body = await request.json().catch(() => ({}));
  if (body.action === "duplicate" || body.action === "trash" || body.action === "restore") return NextResponse.json({ error: "La galería social es única y no se puede duplicar ni enviar a papelera." }, { status: 400 });
  const item = await getSocialGalleryById(id); if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (body.action === "publish") {
    const updated = await updateSocialGallery(id, { ...item, status: "published" });
    refreshSocialGalleryViews();
    return NextResponse.json({ socialGallery: updated });
  }
  return NextResponse.json({ error: "La galería social siempre está publicada." }, { status: 400 });
}
export async function DELETE(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  void _request;
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ctx.params;
  return NextResponse.json({ error: "La galería social es única y no se puede eliminar." }, { status: 400 });
}
