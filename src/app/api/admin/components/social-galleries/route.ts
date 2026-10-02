import { requireAdminApi } from "@/lib/auth/supabase-auth";
import { invalidatePublicContentCache } from "@/lib/cms/public-content";
import { createSocialGallery, getSocialGalleries } from "@/lib/cms/social-galleries";
import { socialGalleryModalContentError } from "@/lib/cms/modal-content";
import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

function refreshSocialGalleryViews() {
  invalidatePublicContentCache();
  revalidatePath("/", "layout");
  revalidatePath("/admin/components/social-galleries");
}

export async function GET() {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await getSocialGalleries();
  return NextResponse.json({ socialGalleries: items });
}

export async function POST(request: NextRequest) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const modalContentError = socialGalleryModalContentError(body);
  if (modalContentError) return NextResponse.json({ error: modalContentError }, { status: 400 });
  try { const item = await createSocialGallery(body); refreshSocialGalleryViews(); return NextResponse.json({ socialGallery: item }); }
  catch (err) { return NextResponse.json({ error: err instanceof Error ? err.message : "No se pudo guardar la galería social." }, { status: 400 }); }
}
