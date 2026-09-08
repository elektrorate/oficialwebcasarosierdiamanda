import { cache } from "react";
import type { BlogContentBlock, BlogPost as PublicBlogPost } from "@/data/types";
import { getBlogPosts } from "./blog";
import type { BlogPost as CmsBlogPost, BlogPostBlock } from "./types";

const normalizeDate = (value: string) => new Date(value || 0).getTime();

function visibleBlocks(post: CmsBlogPost) {
  return [...(post.blocks ?? [])]
    .filter((block) => block.is_visible !== false)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

function paragraphsFromText(text: string): BlogContentBlock[] {
  return text
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((content) => ({ type: "paragraph", content }));
}

function imageBlockToContent(block: BlogPostBlock): BlogContentBlock | null {
  if (!block.image_id) return null;
  return {
    type: "image",
    src: block.image_id,
    alt: block.title || undefined,
    caption: block.text || undefined,
  };
}

function galleryBlockToContent(block: BlogPostBlock): BlogContentBlock | null {
  const parsed = (() => {
    try {
      return JSON.parse(block.custom_html || "[]") as Array<{ src?: string; alt?: string }>;
    } catch {
      return [];
    }
  })();
  const images = parsed
    .map((image) => ({ src: image.src ?? "", alt: image.alt }))
    .filter((image) => image.src);

  if (block.image_id) images.unshift({ src: block.image_id, alt: block.title || undefined });
  return images.length ? { type: "gallery", images } : null;
}

function blocksToPublicContent(blocks: BlogPostBlock[], contentFallback: string): BlogContentBlock[] {
  const content: BlogContentBlock[] = [];
  let pendingImages: Array<{ src: string; alt?: string }> = [];

  const flushImages = () => {
    if (pendingImages.length === 1) {
      content.push({ type: "image", src: pendingImages[0].src, alt: pendingImages[0].alt });
    } else if (pendingImages.length > 1) {
      content.push({ type: "gallery", images: pendingImages });
    }
    pendingImages = [];
  };

  for (const block of blocks) {
    if (block.type === "image") {
      if (block.image_id) pendingImages.push({ src: block.image_id, alt: block.title || undefined });
      continue;
    }

    flushImages();

    if (block.type === "heading") {
      content.push({
        type: "heading",
        level: block.custom_html === "2" ? 2 : 3,
        content: block.title || block.text,
      });
    } else if (block.type === "quote") {
      content.push({ type: "quote", content: block.text || block.title });
    } else if (block.type === "text") {
      content.push(...paragraphsFromText(block.text || block.title));
    } else if (block.type === "list") {
      const items = block.text.split("\n").map((item) => item.replace(/^[-*\d.]+\s*/, "").trim()).filter(Boolean);
      if (items.length) content.push({ type: "list", items });
    } else if (block.type === "gallery") {
      const gallery = galleryBlockToContent(block);
      if (gallery) content.push(gallery);
    } else if (block.type === "cta" && block.title && block.source_url) {
      content.push({ type: "cta", text: block.title, href: block.source_url });
    } else {
      const image = imageBlockToContent(block);
      if (image) content.push(image);
      else if (block.text) content.push(...paragraphsFromText(block.text));
    }
  }

  flushImages();
  return content.length ? content : paragraphsFromText(contentFallback);
}

function cmsToPublicPost(post: CmsBlogPost): PublicBlogPost {
  const publishedAt = post.published_at || post.updated_at || post.created_at;
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    listingExcerpt: post.listing_excerpt || "",
    coverImage: post.featured_image_id || post.seo_image || "img/social-2.jpg",
    titleImage: post.title_image_id || undefined,
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
    contentBlocks: blocksToPublicContent(visibleBlocks(post), post.content),
  };
}

export const getPublicBlogPosts = cache(async () => {
  const cmsPosts = await getBlogPosts();
  return cmsPosts
    .map(cmsToPublicPost)
    .filter((post) => post.status === "published")
    .sort((a, b) => normalizeDate(b.publishedAt) - normalizeDate(a.publishedAt) || a.manualOrder - b.manualOrder);
});

export const getPublicBlogData = cache(async () => {
  const posts = await getPublicBlogPosts();
  const published = posts.filter((post) => post.visibleInListing !== false);
  const featured = posts
    .filter((post) => post.isFeatured)
    .sort((a, b) => (a.featuredOrder ?? 999) - (b.featuredOrder ?? 999) || normalizeDate(b.publishedAt) - normalizeDate(a.publishedAt));

  return {
    published,
    featured,
    categories: Array.from(new Set(published.map((post) => post.category))),
  };
});

export async function getPublicBlogPostBySlug(slug: string) {
  const posts = await getPublicBlogPosts();
  return posts.find((post) => post.slug === slug) ?? null;
}

export function getRelatedBlogPosts(posts: PublicBlogPost[], post: PublicBlogPost, limit = 3) {
  return posts.filter((item) => item.slug !== post.slug && item.category === post.category).slice(0, limit);
}

export function getBlogNeighbors(posts: PublicBlogPost[], post: PublicBlogPost) {
  const index = posts.findIndex((item) => item.slug === post.slug);
  return {
    previous: index > 0 ? posts[index - 1] : null,
    next: index >= 0 && index < posts.length - 1 ? posts[index + 1] : null,
  };
}
