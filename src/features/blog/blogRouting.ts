import type { Metadata } from "next";
import { getPublicBlogData, getPublicBlogPostBySlug } from "@/lib/cms/blog-public";
import { assetPath } from "@/lib/assets";

export async function generateBlogStaticParams() {
  const { published } = await getPublicBlogData();
  return published.map((post) => ({ slug: post.slug }));
}

export async function generateBlogPostMetadata(
  params: Promise<{ slug: string }>
): Promise<Metadata> {
  const post = await getPublicBlogPostBySlug((await params).slug);
  const image = post?.coverImage ? assetPath(post.coverImage) : undefined;
  return post
      ? {
        title: { absolute: post.seoTitle },
        description: post.seoDescription,
        alternates: { canonical: `/blog/${post.slug}` },
        openGraph: {
          type: "article",
          title: post.seoTitle,
          description: post.seoDescription,
          ...(image ? { images: [image] } : {}),
        },
        twitter: {
          card: image ? "summary_large_image" : "summary",
          title: post.seoTitle,
          description: post.seoDescription,
          ...(image ? { images: [image] } : {}),
        },
      }
    : {};
}

export async function getBlogPostRouteItem(params: Promise<{ slug: string }>) {
  return getPublicBlogPostBySlug((await params).slug);
}
