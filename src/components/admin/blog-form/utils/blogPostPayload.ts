import { buildHeroPreviewHero } from "@/components/admin/shared-hero-editor/utils";
import type { BlogContentBlock } from "@/data/types";
import type { BlogPostBlock, BlogPostStatus, CmsHeroSettings } from "@/lib/cms/types";
import { normalizeHeroSettings } from "@/lib/cms/hero-settings";
import { BLOG_HERO_FALLBACK_IMAGE } from "../constants";
import { clampListingExcerpt, parseTagsInput, slugifyBlogPost } from "./slugify";

function paragraphsFromText(text: string): BlogContentBlock[] {
  return text
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((content) => ({ type: "paragraph", content }));
}

export function blocksToPreviewContent(blocks: BlogPostBlock[]): BlogContentBlock[] {
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

  for (const block of blocks.filter((item) => item.is_visible !== false)) {
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
    } else if (block.type === "list") {
      const items = block.text
        .split("\n")
        .map((item) => item.replace(/^[-*\d.]+\s*/, "").trim())
        .filter(Boolean);
      if (items.length) content.push({ type: "list", items });
    } else if (block.type === "cta" && block.title && block.source_url) {
      content.push({ type: "cta", text: block.title, href: block.source_url });
    } else {
      content.push(...paragraphsFromText(block.text || block.title));
    }
  }

  flushImages();
  return content;
}

export function estimateBlogReadingMinutes(blocks: BlogPostBlock[]) {
  const words = blocks
    .map((block) => [block.title, block.text].join(" "))
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export type BlogPostFormFields = {
  title: string;
  slug: string;
  status: BlogPostStatus;
  excerpt: string;
  listingExcerpt: string;
  featuredImageId: string;
  titleImageId: string;
  categoryMode: string;
  customCategory: string;
  isFeatured: boolean;
  featuredOrder: number;
  featuredExcerpt: string;
  visibleInListing: boolean;
  sortOrder: number;
  tagsInput: string;
  seoTitle: string;
  seoDescription: string;
  seoImage: string;
  hero: CmsHeroSettings;
  blocks: BlogPostBlock[];
};

export function resolveBlogPostCategory(categoryMode: string, customCategory: string) {
  return categoryMode === "custom" ? customCategory.trim() : categoryMode;
}

function blogPostHeroContext(fields: BlogPostFormFields) {
  const category = resolveBlogPostCategory(fields.categoryMode, fields.customCategory) || "Bitácora";
  const title = fields.title.trim();
  const coverImage = fields.featuredImageId || fields.seoImage || BLOG_HERO_FALLBACK_IMAGE;
  return { category, title, coverImage };
}

/** Same merge rules as `rowToBlogPost` / `normalizePost` in `lib/cms/blog.ts` (persisted shape). */
export function resolveBlogPostPersistedHero(fields: BlogPostFormFields): CmsHeroSettings {
  const { category, title, coverImage } = blogPostHeroContext(fields);
  return normalizeHeroSettings(fields.hero, {
    heroTitle: title,
    heroSubtitle: category,
    heroImage: coverImage,
  });
}

/** Live admin preview: hero tab + structure fields, aligned with public `HeaderInterno` image fallback. */
export function resolveBlogPostPreviewHero(fields: BlogPostFormFields): CmsHeroSettings {
  const { category, title, coverImage } = blogPostHeroContext(fields);
  const titleFallback = title || "Título de la bitácora";
  const merged = buildHeroPreviewHero(fields.hero, titleFallback, category);
  return {
    ...merged,
    heroImage: fields.hero.heroImage || coverImage,
  };
}

export function buildBlogPostSavePayload(fields: BlogPostFormFields, nextStatus: BlogPostStatus) {
  const category = resolveBlogPostCategory(fields.categoryMode, fields.customCategory) || "Procesos";
  const title = fields.title.trim();
  const slug = fields.slug.trim() || slugifyBlogPost(title);

  return {
    title,
    slug,
    status: nextStatus,
    excerpt: fields.excerpt,
    listing_excerpt: clampListingExcerpt(fields.listingExcerpt),
    content: "",
    featured_image_id: fields.featuredImageId,
    title_image_id: fields.titleImageId,
    author_id: "Casa Rosier",
    category,
    tags: parseTagsInput(fields.tagsInput),
    is_featured: fields.isFeatured,
    featured_order: fields.featuredOrder,
    featured_excerpt: fields.featuredExcerpt,
    visible_in_listing: fields.visibleInListing,
    sort_order: fields.sortOrder,
    seo_title: fields.seoTitle,
    seo_description: fields.seoDescription,
    seo_image: fields.seoImage,
    hero: resolveBlogPostPersistedHero(fields),
    blocks: fields.blocks.map((block, index) => ({ ...block, sort_order: index })),
  };
}
