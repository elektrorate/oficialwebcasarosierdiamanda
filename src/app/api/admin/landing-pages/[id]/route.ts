import { requireAdminApi } from "@/lib/auth/supabase-auth";
import { deleteLandingPagePermanently, duplicateLandingPage, getLandingPageById, moveLandingPageToTrash, restoreLandingPage, updateLandingPage } from "@/lib/cms/landing-pages";
import { type NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const item = await getLandingPageById((await ctx.params).id); if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 }); return NextResponse.json({ landingPage: item });
}
export async function PUT(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { const item = await updateLandingPage((await ctx.params).id, await request.json()); if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 }); revalidatePath(`/landing/${item.slug}`); return NextResponse.json({ landingPage: item }); }
  catch (err) { return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 }); }
}
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params; const body = await request.json().catch(() => ({}));
  if (body.action === "duplicate") { const item = await duplicateLandingPage(id); if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 }); return NextResponse.json({ landingPage: item }); }
  if (body.action === "trash") { const item = await moveLandingPageToTrash(id); if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 }); return NextResponse.json({ landingPage: item }); }
  if (body.action === "restore") { const item = await restoreLandingPage(id); if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 }); return NextResponse.json({ landingPage: item }); }
  const item = await getLandingPageById(id); if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const ns = body.action === "publish" ? "published" : body.action === "archive" ? "archived" : body.action === "draft" ? "draft" : null;
  if (!ns) return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  const updated = await updateLandingPage(id, { ...item, status: ns }); revalidatePath(`/landing/${item.slug}`); return NextResponse.json({ landingPage: updated });
}
export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ok = await deleteLandingPagePermanently((await ctx.params).id); if (!ok) return NextResponse.json({ error: "No encontrado" }, { status: 404 }); return NextResponse.json({ ok: true });
}
