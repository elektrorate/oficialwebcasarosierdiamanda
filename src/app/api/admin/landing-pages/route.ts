import { requireAdminApi } from "@/lib/auth/supabase-auth";
import { createLandingPage, getLandingPages } from "@/lib/cms/landing-pages";
import { type NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function GET(request: NextRequest) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const status = request.nextUrl.searchParams.get("status") || undefined;
  const campaign = request.nextUrl.searchParams.get("campaign_type") || undefined;
  let items = await getLandingPages();
  if (status) items = items.filter((x) => x.status === status);
  if (campaign) items = items.filter((x) => x.campaign_type === campaign);
  return NextResponse.json({ landingPages: items });
}

export async function POST(request: NextRequest) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  if (!body?.title) return NextResponse.json({ error: "El título es obligatorio." }, { status: 400 });
  try { const item = await createLandingPage(body); revalidatePath(`/landing/${item.slug}`); return NextResponse.json({ landingPage: item }); }
  catch (err) { return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 }); }
}
