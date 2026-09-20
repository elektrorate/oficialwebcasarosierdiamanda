import { requireAdminApi } from "@/lib/auth/supabase-auth";
import { createShippingMethod, getShippingMethods, updateShippingMethod } from "@/lib/cms/shipping";
import { type NextRequest, NextResponse } from "next/server";

export async function GET() {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await getShippingMethods();
  return NextResponse.json({ shippingMethods: items });
}

export async function POST(request: NextRequest) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  if (!body?.name) return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
  try {
    if (body.id) { const item = await updateShippingMethod(body.id, body); if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 }); return NextResponse.json({ shippingMethod: item }); }
    const item = await createShippingMethod(body); return NextResponse.json({ shippingMethod: item });
  } catch (err) { return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 }); }
}

export async function PUT(request: NextRequest) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  if (body.action === "reorder" && Array.isArray(body.orderedIds)) {
    for (const [i, id] of body.orderedIds.entries()) await updateShippingMethod(id, { sort_order: i });
    const updated = await getShippingMethods();
    return NextResponse.json({ shippingMethods: updated });
  }
  return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
}
