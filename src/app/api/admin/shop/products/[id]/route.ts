import { requireAdminApi } from "@/lib/auth/supabase-auth";
import { deleteProductPermanently, duplicateProduct, getProductById, moveProductToTrash, restoreProduct, updateProduct } from "@/lib/cms/products";
import { type NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { publicSlugError } from "@/lib/seo/public-slug";
import { revalidatePublicSitemap } from "@/lib/seo/revalidation";

function refreshProductViews(...slugs: Array<string | null | undefined>) {
  revalidatePath("/shop");
  for (const slug of slugs) if (slug) revalidatePath(`/shop/${slug}`);
  revalidatePublicSitemap();
}

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const item = await getProductById((await ctx.params).id); if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 }); return NextResponse.json({ product: item });
}
export async function PUT(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await ctx.params;
    const body = await request.json();
    if (body.slug) {
      const slugError = publicSlugError(body.slug);
      if (slugError) return NextResponse.json({ error: slugError }, { status: 400 });
    }
    const previous = await getProductById(id);
    const item = await updateProduct(id, body);
    if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    refreshProductViews(previous?.slug, item.slug);
    return NextResponse.json({ product: item });
  }
  catch (err) { return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 }); }
}
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params; const body = await request.json().catch(() => ({}));
  if (body.action === "duplicate") { const item = await duplicateProduct(id); if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 }); refreshProductViews(item.slug); return NextResponse.json({ product: item }); }
  if (body.action === "trash") { const item = await moveProductToTrash(id); if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 }); refreshProductViews(item.slug); return NextResponse.json({ product: item }); }
  if (body.action === "restore") { const item = await restoreProduct(id); if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 }); refreshProductViews(item.slug); return NextResponse.json({ product: item }); }
  const item = await getProductById(id); if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (body.action === "publish") { const u = await updateProduct(id, { status: "published" }); refreshProductViews(u?.slug); return NextResponse.json({ product: u }); }
  if (body.action === "draft") { const u = await updateProduct(id, { status: "draft" }); refreshProductViews(u?.slug); return NextResponse.json({ product: u }); }
  if (body.action === "archive") { const u = await updateProduct(id, { status: "archived" }); refreshProductViews(u?.slug); return NextResponse.json({ product: u }); }
  return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
}
export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const previous = await getProductById(id);
  const ok = await deleteProductPermanently(id); if (!ok) return NextResponse.json({ error: "No encontrado" }, { status: 404 }); refreshProductViews(previous?.slug); return NextResponse.json({ ok: true });
}
