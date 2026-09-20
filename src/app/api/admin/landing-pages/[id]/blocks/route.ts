import { requireAdminApi } from "@/lib/auth/supabase-auth";
import { addLandingPageBlock, reorderLandingPageBlocks, removeLandingPageBlock, updateLandingPageBlock } from "@/lib/cms/landing-pages";

import { randomUUID } from "crypto";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const block = await addLandingPageBlock((await ctx.params).id, {
    id: randomUUID(), type: body.type || "text", title: body.title || "", text: body.text || "", image_id: body.image_id || "",
    cta_text: body.cta_text || "", cta_url: body.cta_url || "", is_visible: body.is_visible !== undefined ? body.is_visible : true,
    sort_order: body.sort_order ?? 999, custom_html: body.custom_html || "", created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  });
  if (!block) return NextResponse.json({ error: "Landing no encontrada" }, { status: 404 }); return NextResponse.json({ block });
}
export async function PUT(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  if (body.action === "reorder" && Array.isArray(body.orderedIds)) {
    const blocks = await reorderLandingPageBlocks((await ctx.params).id, body.orderedIds);
    if (!blocks) return NextResponse.json({ error: "No encontrada" }, { status: 404 }); return NextResponse.json({ blocks });
  }
  if (!body.blockId) return NextResponse.json({ error: "blockId requerido" }, { status: 400 });
  const updated = await updateLandingPageBlock((await ctx.params).id, body.blockId, body);
  if (!updated) return NextResponse.json({ error: "Block no encontrado" }, { status: 404 }); return NextResponse.json({ block: updated });
}
export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blockId = request.nextUrl.searchParams.get("blockId"); if (!blockId) return NextResponse.json({ error: "blockId requerido" }, { status: 400 });
  const ok = await removeLandingPageBlock((await ctx.params).id, blockId); if (!ok) return NextResponse.json({ error: "Block no encontrado" }, { status: 404 }); return NextResponse.json({ ok: true });
}
