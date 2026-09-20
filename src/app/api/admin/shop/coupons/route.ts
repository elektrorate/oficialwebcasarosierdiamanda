import { requireAdminApi } from "@/lib/auth/supabase-auth";
import { createCoupon, getCoupons } from "@/lib/cms/coupons";
import { type NextRequest, NextResponse } from "next/server";

export async function GET() {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await getCoupons();
  return NextResponse.json({ coupons: items });
}

export async function POST(request: NextRequest) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  if (!body?.code) return NextResponse.json({ error: "El código es obligatorio." }, { status: 400 });
  try { const item = await createCoupon(body); return NextResponse.json({ coupon: item }); }
  catch (err) { return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 }); }
}
