import { requireAdminApi } from "@/lib/auth/supabase-auth";
import { createProduct, getProducts } from "@/lib/cms/products";
import { type NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { publicSlugError } from "@/lib/seo/public-slug";
import { revalidatePublicSitemap } from "@/lib/seo/revalidation";

function refreshProductViews(slug?: string) {
  revalidatePath("/shop");
  if (slug) revalidatePath(`/shop/${slug}`);
  revalidatePublicSitemap();
}

export async function GET(request: NextRequest) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const status = request.nextUrl.searchParams.get("status") || undefined;
  const categoryId = request.nextUrl.searchParams.get("category_id") || undefined;
  let items = await getProducts();
  if (status) items = items.filter((x) => x.status === status);
  if (categoryId) items = items.filter((x) => x.category_id === categoryId);
  return NextResponse.json({ products: items });
}

export async function POST(request: NextRequest) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  if (!body?.name) return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
  if (body.slug) {
    const slugError = publicSlugError(body.slug);
    if (slugError) return NextResponse.json({ error: slugError }, { status: 400 });
  }
  try { const item = await createProduct(body); refreshProductViews(item.slug); return NextResponse.json({ product: item }); }
  catch (err) { return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 }); }
}
