"use client";

import { memo, useMemo } from "react";
import { BlogDetail } from "@/components/blog/BlogDetail";
import { SocialGallery } from "@/components/home/SocialGallery";
import CmsPublicHeroPreview from "@/components/admin/CmsPublicHeroPreview";
import type { BlogPost as PublicBlogPost, NavigationItem } from "@/data/types";
import type { SiteSettings } from "@/lib/cms/settings";
import type { BlogPostFormState } from "../hooks/useBlogPostForm";
import { blocksToPreviewContent } from "../utils/blogPostPayload";

type Props = Pick<
  BlogPostFormState,
  | "title"
  | "excerpt"
  | "featuredImageId"
  | "titleImageId"
  | "previewHero"
  | "currentCategory"
  | "slug"
  | "status"
  | "isFeatured"
  | "featuredOrder"
  | "featuredExcerpt"
  | "visibleInListing"
  | "sortOrder"
  | "seoTitle"
  | "seoDescription"
  | "previewPublishedAt"
  | "blocks"
  | "syncStatus"
> & {
  navigationItems: NavigationItem[];
  menuSettings: SiteSettings["menu"];
};

function BlogPostFormPreviewComponent({
  title,
  excerpt,
  featuredImageId,
  titleImageId,
  blocks,
  previewHero,
  currentCategory,
  slug,
  status,
  isFeatured,
  featuredOrder,
  featuredExcerpt,
  visibleInListing,
  sortOrder,
  seoTitle,
  seoDescription,
  previewPublishedAt,
  navigationItems,
  menuSettings,
  syncStatus,
}: Props) {
  const previewPost: PublicBlogPost = useMemo(
    () => ({
      id: "preview",
      title: title || "Título de la bitácora",
      slug: slug || "vista-previa",
      excerpt: excerpt || "Texto introductorio de la bitácora.",
      listingExcerpt: "",
      coverImage: featuredImageId || previewHero.heroImage || "/img/social-2.jpg",
      titleImage: titleImageId || undefined,
      category: currentCategory,
      tags: [],
      author: "Casa Rosier",
      authorInitial: "C",
      status: status === "published" ? "published" : "draft",
      isFeatured,
      featuredOrder,
      featuredImage: featuredImageId || undefined,
      featuredExcerpt: featuredExcerpt || excerpt,
      featuredOnHome: false,
      visibleInListing,
      manualOrder: sortOrder,
      publishedAt: previewPublishedAt,
      seoTitle: seoTitle || title,
      seoDescription: seoDescription || excerpt,
      hero: previewHero,
      contentBlocks: blocksToPreviewContent(blocks),
    }),
    [
      blocks,
      currentCategory,
      excerpt,
      featuredExcerpt,
      featuredImageId,
      featuredOrder,
      previewHero,
      isFeatured,
      previewPublishedAt,
      seoDescription,
      seoTitle,
      slug,
      sortOrder,
      status,
      title,
      titleImageId,
      visibleInListing,
    ],
  );

  const syncLabel =
    syncStatus === "saving" || syncStatus === "pending"
      ? "Sincronizando…"
      : syncStatus === "error"
        ? "Error de sync"
        : `Vista previa · ${status === "published" ? "Publicado" : "Borrador"}`;

  return (
    <div className="cms-preview-frame">
      <div className="cms-public-preview__toolbar">{syncLabel}</div>
      <div className="cms-public-preview blog-post-page">
        <div className="cms-public-preview__scale">
          <CmsPublicHeroPreview
            hero={previewHero}
            navigationItems={navigationItems}
            menuSettings={menuSettings}
            height="small"
            className="blog-hero"
            titleFallback={title || "Título de la bitácora"}
            subtitleFallback={currentCategory || "Bitácora"}
          />

          <div className="cms-public-preview__body">
            <BlogDetail post={previewPost} adjacent={{ previous: null, next: null }} relatedPosts={[]} />
            <SocialGallery />
          </div>
        </div>
      </div>
    </div>
  );
}

export const BlogPostFormPreview = memo(BlogPostFormPreviewComponent);
