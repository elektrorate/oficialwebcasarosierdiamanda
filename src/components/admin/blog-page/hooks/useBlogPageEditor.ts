"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { buildSocialGalleryProps } from "@/components/admin/page-editor/utils/socialGalleryProps";
import { saveBlogPageSettingsAction } from "@/lib/admin/blog-page-actions";
import { getSelectedFaqBlock, listPublishedFaqGroups } from "@/lib/cms/faq-selection";
import { normalizeHeroSettings } from "@/lib/cms/hero-settings";
import type { BlogPageSettings, BlogPost, CmsHeroSettings, Faq, FaqGroup, SocialGallery as CmsSocialGallery } from "@/lib/cms/types";
import {
  BLOG_HERO_SUBTITLE_FALLBACK,
  BLOG_HERO_TITLE_FALLBACK,
  type BlogPageEditorTabKey,
} from "../constants";
import { isBlogPost, sortAdminVisiblePosts } from "../utils/previewPosts";
import { useBlogPageAutosave } from "./useBlogPageAutosave";

export type BlogPageEditorModal = {
  type: "success" | "error";
  title: string;
  message?: string;
} | null;

export type BlogPageEditorProps = {
  page: BlogPageSettings;
  posts: BlogPost[];
  socialGallery: CmsSocialGallery | null;
  faqs: Faq[];
  faqGroups: FaqGroup[];
};

export function useBlogPageEditor({ page, posts, socialGallery, faqs, faqGroups }: BlogPageEditorProps) {
  const saveInFlightRef = useRef(false);
  const [tab, setTab] = useState<BlogPageEditorTabKey>("hero");
  const [status, setStatus] = useState(page.status);
  const [hero, setHero] = useState<CmsHeroSettings>(() =>
    normalizeHeroSettings(page.hero, {
      heroTitle: BLOG_HERO_TITLE_FALLBACK,
      heroSubtitle: BLOG_HERO_SUBTITLE_FALLBACK,
    }),
  );
  const [showIdeaPromptSection, setShowIdeaPromptSection] = useState(page.showIdeaPromptSection);
  const [showFaqSection, setShowFaqSection] = useState(page.showFaqSection);
  const [faqGroupId, setFaqGroupId] = useState(page.faqGroupId);
  const [seoTitle] = useState(page.seo_title);
  const [seoDescription] = useState(page.seo_description);
  const [seoImage] = useState(page.seo_image);
  const [previousPosts, setPreviousPosts] = useState(posts);
  const [localPosts, setLocalPosts] = useState(() => sortAdminVisiblePosts(posts));
  const [isSaving, setIsSaving] = useState(false);
  const [modal, setModal] = useState<BlogPageEditorModal>(null);

  if (posts !== previousPosts) {
    setPreviousPosts(posts);
    setLocalPosts(sortAdminVisiblePosts(posts));
  }

  const savePayload = useMemo(
    () => ({
      status,
      hero,
      showIdeaPromptSection,
      showFaqSection,
      faqGroupId,
      seo_title: seoTitle,
      seo_description: seoDescription,
      seo_image: seoImage,
    }),
    [faqGroupId, hero, seoDescription, seoImage, seoTitle, showFaqSection, showIdeaPromptSection, status],
  );

  const {
    syncStatus,
    syncError,
    prepareForManualSave,
    completeManualSave,
  } = useBlogPageAutosave(savePayload, !isSaving);

  const visiblePosts = localPosts;
  const publishedPosts = useMemo(
    () => visiblePosts.filter((post) => post.status === "published"),
    [visiblePosts],
  );
  const featuredPosts = useMemo(
    () => publishedPosts.filter((post) => post.is_featured),
    [publishedPosts],
  );

  const publishedFaqGroups = useMemo(() => listPublishedFaqGroups(faqGroups), [faqGroups]);
  const selectedFaqBlock = useMemo(
    () => getSelectedFaqBlock(faqs, faqGroups, faqGroupId),
    [faqs, faqGroupId, faqGroups],
  );
  const socialGalleryProps = useMemo(
    () => buildSocialGalleryProps(socialGallery, "blog"),
    [socialGallery],
  );

  const summaryMeta = useMemo(
    () => ({
      publishedCount: publishedPosts.length,
      featuredCount: featuredPosts.length,
      ideaLabel: showIdeaPromptSection ? "Galería activa" : "Galería oculta",
      faqLabel: showFaqSection ? "FAQ activo" : "FAQ oculto",
      syncStatus,
      syncError,
    }),
    [
      featuredPosts.length,
      publishedPosts.length,
      showFaqSection,
      showIdeaPromptSection,
      syncError,
      syncStatus,
    ],
  );

  const patchHero = useCallback((next: Partial<CmsHeroSettings>) => {
    setHero((current) => ({ ...current, ...next }));
  }, []);

  const upsertLocalPost = useCallback((post: BlogPost) => {
    setLocalPosts((current) => {
      const without = current.filter((item) => item.id !== post.id);
      if (post.status === "deleted") return sortAdminVisiblePosts(without);
      return sortAdminVisiblePosts([post, ...without]);
    });
  }, []);

  const removeLocalPost = useCallback((id: string) => {
    setLocalPosts((current) => current.filter((item) => item.id !== id));
  }, []);

  const applyPostActionResult = useCallback(
    (id: string, resultPost: unknown, fallbackPatch?: Partial<BlogPost>) => {
      if (isBlogPost(resultPost)) {
        upsertLocalPost(resultPost);
        return;
      }
      if (fallbackPatch) {
        setLocalPosts((current) =>
          sortAdminVisiblePosts(
            current.map((item) => (item.id === id ? { ...item, ...fallbackPatch, updated_at: new Date().toISOString() } : item)),
          ),
        );
      }
    },
    [upsertLocalPost],
  );

  const closeModal = useCallback(() => setModal(null), []);

  const save = useCallback(
    async (nextStatus = status) => {
      if (saveInFlightRef.current) return;
      saveInFlightRef.current = true;
      setIsSaving(true);
      setModal(null);

      const manualPayload = {
        ...savePayload,
        status: nextStatus,
      };
      await prepareForManualSave();
      const result = await saveBlogPageSettingsAction(manualPayload);

      if (!result.ok) {
        completeManualSave();
        setModal({ type: "error", title: "No se pudo guardar", message: result.error });
        setIsSaving(false);
        saveInFlightRef.current = false;
        return;
      }

      setStatus(nextStatus);
      setHero(result.page.hero);
      setShowIdeaPromptSection(result.page.showIdeaPromptSection);
      setShowFaqSection(result.page.showFaqSection);
      setFaqGroupId(result.page.faqGroupId);
      completeManualSave(manualPayload);
      setModal({
        type: "success",
        title: nextStatus === "published" ? "Página publicada" : "Borrador guardado",
        message: "Los cambios de la página de Bitácora se sincronizaron con la base de datos.",
      });
      setIsSaving(false);
      saveInFlightRef.current = false;
    },
    [completeManualSave, prepareForManualSave, savePayload, status],
  );

  const saveDraft = useCallback(() => save("draft"), [save]);
  const savePublished = useCallback(() => save("published"), [save]);
  const openPreviewTab = useCallback(() => setTab("preview"), []);

  return {
    tab,
    setTab,
    status,
    hero,
    patchHero,
    showIdeaPromptSection,
    setShowIdeaPromptSection,
    showFaqSection,
    setShowFaqSection,
    faqGroupId,
    setFaqGroupId,
    isSaving,
    modal,
    closeModal,
    saveDraft,
    savePublished,
    openPreviewTab,
    visiblePosts,
    publishedPosts,
    featuredPosts,
    publishedFaqGroups,
    selectedFaqBlock,
    socialGalleryProps,
    summaryMeta,
    applyPostActionResult,
    removeLocalPost,
    syncStatus,
  };
}

export type BlogPageEditorState = ReturnType<typeof useBlogPageEditor>;
