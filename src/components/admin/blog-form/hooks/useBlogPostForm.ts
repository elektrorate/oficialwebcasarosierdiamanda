"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { BITACORA_LIST_ADMIN_PATH, saveBlogPostAction } from "@/lib/admin/bitacora-actions";
import { normalizeHeroSettings } from "@/lib/cms/hero-settings";
import {
  DEFAULT_RICH_TEXT_TYPOGRAPHY,
  normalizeRichTextTypography,
  type RichTextTypography,
} from "@/lib/cms/rich-text-typography";
import type { BlogPost, BlogPostBlock, BlogPostStatus, CmsHeroSettings } from "@/lib/cms/types";
import { BLOG_HERO_FALLBACK_IMAGE, BLOG_POST_CATEGORY_OPTIONS } from "../constants";
import {
  buildBlogPostSavePayload,
  estimateBlogReadingMinutes,
  resolveBlogPostCategory,
  resolveBlogPostPreviewHero,
} from "../utils/blogPostPayload";
import { slugifyBlogPost } from "../utils/slugify";
import type { BlogFormTabKey } from "../constants";
import { useBlogPostAutosave } from "./useBlogPostAutosave";

export type BlogPostFormModal = {
  type: "success" | "error";
  title: string;
  message?: string;
  redirectToList?: boolean;
} | null;

export type UseBlogPostFormProps = {
  mode: "create" | "edit";
  item?: BlogPost;
};

export function useBlogPostForm({ mode, item }: UseBlogPostFormProps) {
  const router = useRouter();
  const saveInFlight = useRef(false);

  const itemCategory = item?.category ?? "Procesos";
  const hasKnownCategory = BLOG_POST_CATEGORY_OPTIONS.includes(itemCategory as (typeof BLOG_POST_CATEGORY_OPTIONS)[number]);

  const [tab, setTab] = useState<BlogFormTabKey>("hero");
  const [title, setTitle] = useState(item?.title ?? "");
  const [slug, setSlug] = useState(item?.slug ?? "");
  const [status, setStatus] = useState<BlogPostStatus>(item?.status ?? "draft");
  const [excerpt, setExcerpt] = useState(item?.excerpt ?? "");
  const [listingExcerpt, setListingExcerpt] = useState(item?.listing_excerpt ?? "");
  const [featuredImageId, setFeaturedImageId] = useState(item?.featured_image_id ?? "");
  const [titleImageId, setTitleImageId] = useState(item?.title_image_id ?? "");
  const [categoryMode, setCategoryMode] = useState(hasKnownCategory ? itemCategory : "custom");
  const [customCategory, setCustomCategory] = useState(hasKnownCategory ? "" : itemCategory);
  const [isFeatured] = useState(item?.is_featured ?? false);
  const [featuredOrder] = useState(item?.featured_order ?? 0);
  const [featuredExcerpt] = useState(item?.featured_excerpt ?? "");
  const [visibleInListing, setVisibleInListing] = useState(item?.visible_in_listing ?? true);
  const [sortOrder, setSortOrder] = useState(item?.sort_order ?? 0);
  const [tagsInput, setTagsInput] = useState(item?.tags?.join(", ") ?? "");
  const [seoTitle, setSeoTitle] = useState(item?.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(item?.seo_description ?? "");
  const [seoImage, setSeoImage] = useState(item?.seo_image ?? "");
  const [excerptTypography, setExcerptTypography] = useState<RichTextTypography>(() =>
    normalizeRichTextTypography(DEFAULT_RICH_TEXT_TYPOGRAPHY),
  );
  const [hero, setHero] = useState<CmsHeroSettings>(() =>
    normalizeHeroSettings(item?.hero, {
      heroTitle: item?.title ?? "",
      heroSubtitle: item?.category ?? "Bitácora",
      heroImage: item?.featured_image_id ?? item?.seo_image ?? BLOG_HERO_FALLBACK_IMAGE,
    }),
  );
  const [blocks, setBlocks] = useState<BlogPostBlock[]>(item?.blocks ?? []);
  const [modal, setModal] = useState<BlogPostFormModal>(null);
  const [isSaving, setIsSaving] = useState(false);

  const formFields = useMemo(
    () => ({
      title,
      slug,
      status,
      excerpt,
      listingExcerpt,
      featuredImageId,
      titleImageId,
      categoryMode,
      customCategory,
      isFeatured,
      featuredOrder,
      featuredExcerpt,
      visibleInListing,
      sortOrder,
      tagsInput,
      seoTitle,
      seoDescription,
      seoImage,
      hero,
      blocks,
    }),
    [
      blocks,
      categoryMode,
      customCategory,
      excerpt,
      featuredExcerpt,
      featuredImageId,
      featuredOrder,
      hero,
      isFeatured,
      listingExcerpt,
      seoDescription,
      seoImage,
      seoTitle,
      slug,
      sortOrder,
      status,
      tagsInput,
      title,
      titleImageId,
      visibleInListing,
    ],
  );

  const previewHero = useMemo(() => resolveBlogPostPreviewHero(formFields), [formFields]);

  const {
    syncStatus,
    syncError,
    prepareForManualSave,
    completeManualSave,
  } = useBlogPostAutosave(mode, item?.id, formFields, status, !isSaving);

  const readingTime = useMemo(() => estimateBlogReadingMinutes(blocks), [blocks]);
  const visibleBlockCount = useMemo(() => blocks.filter((block) => block.is_visible).length, [blocks]);
  const currentCategory = useMemo(
    () => resolveBlogPostCategory(categoryMode, customCategory) || "Procesos",
    [categoryMode, customCategory],
  );
  const editorTitle = title.trim() || (mode === "create" ? "Nuevo artículo" : item?.title || "Bitácora");
  const previewPublishedAt = item?.published_at || item?.updated_at || item?.created_at || new Date().toISOString();
  const categorySubtitle = categoryMode === "custom" ? customCategory : categoryMode;

  const patchHero = useCallback((next: Partial<CmsHeroSettings>) => {
    setHero((current) => ({ ...current, ...next }));
  }, []);

  const handleTitleBlur = useCallback(() => {
    if (!slug.trim() && title.trim()) {
      setSlug(slugifyBlogPost(title));
    }
  }, [slug, title]);

  const closeModal = useCallback(() => {
    const shouldRedirect = modal?.redirectToList === true;
    setModal(null);
    if (shouldRedirect) {
      router.push(BITACORA_LIST_ADMIN_PATH);
    }
  }, [modal, router]);

  const save = useCallback(
    async (nextStatus = status) => {
      if (saveInFlight.current) return;

      if (!title.trim()) {
        setModal({
          type: "error",
          title: "Falta el título",
          message: "El título es obligatorio para guardar la bitácora.",
        });
        setTab("structure");
        return;
      }

      saveInFlight.current = true;
      setIsSaving(true);
      setModal(null);

      const payload = buildBlogPostSavePayload(formFields, nextStatus);
      await prepareForManualSave();
      const result = await saveBlogPostAction(mode, item?.id, payload);

      if (!result.ok) {
        completeManualSave();
        setModal({ type: "error", title: "No se pudo guardar", message: result.error });
        setIsSaving(false);
        saveInFlight.current = false;
        return;
      }

      setStatus(result.post.status);
      setBlocks(result.post.blocks);
      setHero(result.post.hero);
      completeManualSave(payload);
      setModal({
        type: "success",
        title: nextStatus === "published" ? "Bitácora publicada" : "Bitácora guardada",
        message:
          nextStatus === "published"
            ? "El artículo se sincronizó y ya está publicado."
            : "El borrador se guardó correctamente en la base de datos.",
        redirectToList: true,
      });
      setIsSaving(false);
      saveInFlight.current = false;
      router.refresh();
    },
    [completeManualSave, formFields, item?.id, mode, prepareForManualSave, router, status, title],
  );

  const saveDraft = useCallback(() => save("draft"), [save]);
  const savePublished = useCallback(() => save("published"), [save]);
  const openPreviewTab = useCallback(() => setTab("preview"), []);

  return {
    mode,
    tab,
    setTab,
    title,
    setTitle,
    slug,
    setSlug,
    status,
    setStatus,
    excerpt,
    setExcerpt,
    excerptTypography,
    setExcerptTypography,
    listingExcerpt,
    setListingExcerpt,
    featuredImageId,
    setFeaturedImageId,
    titleImageId,
    setTitleImageId,
    categoryMode,
    setCategoryMode,
    customCategory,
    setCustomCategory,
    visibleInListing,
    setVisibleInListing,
    sortOrder,
    setSortOrder,
    tagsInput,
    setTagsInput,
    seoTitle,
    setSeoTitle,
    seoDescription,
    setSeoDescription,
    seoImage,
    setSeoImage,
    hero,
    previewHero,
    patchHero,
    blocks,
    isFeatured,
    featuredOrder,
    featuredExcerpt,
    modal,
    closeModal,
    isSaving,
    saveDraft,
    savePublished,
    openPreviewTab,
    handleTitleBlur,
    editorTitle,
    readingTime,
    visibleBlockCount,
    currentCategory,
    categorySubtitle,
    previewPublishedAt,
    syncStatus,
    syncError,
  };
}

export type BlogPostFormState = ReturnType<typeof useBlogPostForm>;
