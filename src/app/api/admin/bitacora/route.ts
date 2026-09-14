import { requireAdminApi } from "@/lib/auth/supabase-auth";
import { createBlogPost, getBlogPosts } from "@/lib/cms/blog";
import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { revalidatePublicSitemap } from "@/lib/seo/revalidation";
import { publicSlugError } from "@/lib/seo/public-slug";

function refreshBlogViews() {
  revalidatePath("/blog");
  revalidatePath("/blog/[slug]", "page");
  revalidatePath("/admin/bitacora");
  revalidatePublicSitemap();
}

export async function GET(request: NextRequest) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const status = request.nextUrl.searchParams.get("status") || undefined;
  const category = request.nextUrl.searchParams.get("category") || undefined;
  let items = await getBlogPosts();
  if (status) items = items.filter((x) => x.status === status);
  if (category) items = items.filter((x) => x.category === category);
  return NextResponse.json({ posts: items });
}

export async function POST(request: NextRequest) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  if (!body?.title) return NextResponse.json({ error: "El título es obligatorio." }, { status: 400 });
  if (body.slug) {
    const slugError = publicSlugError(body.slug);
    if (slugError) return NextResponse.json({ error: slugError }, { status: 400 });
  }
  try { const item = await createBlogPost(body); refreshBlogViews(); return NextResponse.json({ post: item }); }
  catch (err) { return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 }); }
}
