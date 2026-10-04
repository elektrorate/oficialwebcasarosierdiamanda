import { requireAdminApi } from "@/lib/auth/supabase-auth";
import { getPublishedSeoPeers } from "@/lib/cms/seo-review";
import { getSettings } from "@/lib/cms/settings";
import { NextResponse } from "next/server";

export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
  }
  try {
    const [peers, settings] = await Promise.all([getPublishedSeoPeers(), getSettings()]);
    return NextResponse.json({ peers, site: {
      siteName: settings.site.site_name, defaultSeoDescription: settings.seo.default_seo_description,
    } }, { headers });
  } catch {
    return NextResponse.json(
      { error: "No se pudo verificar el SEO del contenido publicado. Revisa el acceso a Supabase y vuelve a intentar la revision." },
      { status: 503, headers },
    );
  }
}
