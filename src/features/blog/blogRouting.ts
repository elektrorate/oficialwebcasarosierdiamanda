import type { Metadata } from "next";
import { getPublicBlogData, getPublicBlogPostBySlug } from "@/lib/cms/blog-public";

export async function generateBlogStaticParams() {
  const { published } = await getPublicBlogData();
  return published.map((post) => ({ slug: post.slug }));
}

export async function generateBlogPostMetadata(
  params: Promise<{ slug: string }>
): Promise<Metadata> {
  const post = await getPublicBlogPostBySlug((await params).slug);
  return post
      ? {
        title: { absolute: post.seoTitle },
        description: post.seoDescription,
        alternates: { canonical: `/blog/${post.slug}` },
      }
    : {};
}

export async function getBlogPostRouteItem(params: Promise<{ slug: string }>) {
  return getPublicBlogPostBySlug((await params).slug);
}
