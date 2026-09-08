import { requireAdminApi } from "@/lib/auth/supabase-auth";
import { deleteBlogPostPermanently, duplicateBlogPost, getBlogPostById, moveBlogPostToTrash, restoreBlogPost, updateBlogPost } from "@/lib/cms/blog";
import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

function refreshBlogViews() {
  revalidatePath("/blog");
  revalidatePath("/blog/[slug]", "page");
  revalidatePath("/admin/bitacora");
}

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const item = await getBlogPostById((await ctx.params).id); if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 }); return NextResponse.json({ post: item });
}
export async function PUT(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const item = await updateBlogPost((await ctx.params).id, await request.json());
    if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    if (request.headers.get("x-cms-autosave") !== "1") refreshBlogViews();
    return NextResponse.json({ post: item });
  }
  catch (err) { return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 }); }
}
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params; const body = await request.json().catch(() => ({}));
  if (body.action === "duplicate") { const item = await duplicateBlogPost(id); if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 }); refreshBlogViews(); return NextResponse.json({ post: item }); }
  if (body.action === "trash") { const item = await moveBlogPostToTrash(id); if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 }); refreshBlogViews(); return NextResponse.json({ post: item }); }
  if (body.action === "restore") { const item = await restoreBlogPost(id); if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 }); refreshBlogViews(); return NextResponse.json({ post: item }); }
  const item = await getBlogPostById(id); if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (body.action === "publish") { const updated = await updateBlogPost(id, { status: "published", published_at: item.published_at || new Date().toISOString() }); refreshBlogViews(); return NextResponse.json({ post: updated }); }
  if (body.action === "draft") { const updated = await updateBlogPost(id, { status: "draft" }); refreshBlogViews(); return NextResponse.json({ post: updated }); }
  if (body.action === "archive") { const updated = await updateBlogPost(id, { status: "archived" }); refreshBlogViews(); return NextResponse.json({ post: updated }); }
  if (body.action === "feature") { const updated = await updateBlogPost(id, { is_featured: true, featured_order: Number(body.featured_order ?? (item.featured_order || 99)) }); refreshBlogViews(); return NextResponse.json({ post: updated }); }
  if (body.action === "unfeature") { const updated = await updateBlogPost(id, { is_featured: false }); refreshBlogViews(); return NextResponse.json({ post: updated }); }
  if (body.action === "set_enabled") {
    const enabled = body.enabled !== false;
    const updated = enabled
      ? await updateBlogPost(id, {
          status: "published",
          published_at: item.published_at || new Date().toISOString(),
          visible_in_listing: true,
        })
      : await updateBlogPost(id, {
          status: "draft",
          visible_in_listing: false,
        });
    refreshBlogViews();
    return NextResponse.json({ post: updated });
  }
  return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
}
export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ok = await deleteBlogPostPermanently((await ctx.params).id); if (!ok) return NextResponse.json({ error: "No encontrado" }, { status: 404 }); refreshBlogViews(); return NextResponse.json({ ok: true });
}
