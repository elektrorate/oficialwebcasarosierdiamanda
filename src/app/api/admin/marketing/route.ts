import { requireAdminApi } from "@/lib/auth/supabase-auth";
import { getMarketingSettings, updateMarketingSettings } from "@/lib/cms/marketing";
import { type NextRequest, NextResponse } from "next/server";
import { getSeoWarnings, validateSeoInput } from "@/lib/seo/content";

export async function GET() {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const settings = await getMarketingSettings();
  const masked = { ...settings, meta_access_token: settings.meta_access_token ? "••••••" + settings.meta_access_token.slice(-4) : "" };
  return NextResponse.json(masked);
}

export async function PUT(request: NextRequest) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  try {
    validateSeoInput({ seo_title: body.seo_global_title, seo_description: body.seo_global_description });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Campos SEO no validos." }, { status: 400 });
  }
  const updated = await updateMarketingSettings(body);
  return NextResponse.json({ ...updated, warnings: getSeoWarnings({
    title: updated.seo_global_title, description: updated.seo_global_description,
  }) });
}
