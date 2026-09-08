import type { BlogPost as PublicBlogPost } from "@/data/types";
import type { BlogPost } from "@/lib/cms/types";

export function cmsPostToPublic(post: BlogPost): PublicBlogPost {
  const publishedAt = post.published_at || post.updated_at || post.created_at;
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    listingExcerpt: post.listing_excerpt || "",
    coverImage: post.featured_image_id || post.seo_image || "/img/social-2.jpg",
    category: post.category || "Procesos",
    tags: post.tags ?? [],
    author: post.author_id || "Casa Rosier",
    authorInitial: "C",
    status: post.status === "published" ? "published" : "draft",
    isFeatured: Boolean(post.is_featured),
    featuredOrder: post.featured_order,
    featuredImage: post.featured_image_id || undefined,
    featuredExcerpt: post.featured_excerpt || post.excerpt,
    featuredOnHome: false,
    visibleInListing: post.visible_in_listing !== false,
    manualOrder: post.sort_order ?? 0,
    publishedAt,
    seoTitle: post.seo_title || post.title,
    seoDescription: post.seo_description || post.excerpt,
    hero: post.hero,
    contentBlocks: [],
  };
}
