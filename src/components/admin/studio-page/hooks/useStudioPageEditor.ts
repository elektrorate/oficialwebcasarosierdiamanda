"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { buildSocialGalleryProps } from "@/components/admin/page-editor/utils/socialGalleryProps";
import { saveStudioPageSettingsAction } from "@/lib/admin/studio-page-actions";
import { getSelectedFaqBlock, listPublishedFaqGroups } from "@/lib/cms/faq-selection";
import { normalizeHeroSettings } from "@/lib/cms/hero-settings";
import {
  DEFAULT_DESCRIPTION_TYPOGRAPHY,
  normalizeRichTextTypography,
  type RichTextTypography,
} from "@/lib/cms/rich-text-typography";
import type {
  CmsHeroSettings,
  Faq,
  FaqGroup,
  SocialGallery as CmsSocialGallery,
  StudioPageSettings,
  Teacher,
} from "@/lib/cms/types";
import {
  STUDIO_HERO_SUBTITLE_FALLBACK,
  STUDIO_HERO_TITLE_FALLBACK,
  type StudioPageEditorTabKey,
} from "../constants";
import {
  applyTeacherActionResult as applyTeacherToList,
  listPublishedTeachers,
  sortAdminVisibleTeachers,
} from "../utils/teachers";

export type StudioPageEditorModal = {
  type: "success" | "error";
  title: string;
  message?: string;
} | null;

export type StudioPageEditorProps = {
  page: StudioPageSettings;
  teachers: Teacher[];
  socialGallery: CmsSocialGallery | null;
  faqs: Faq[];
  faqGroups: FaqGroup[];
};

export function useStudioPageEditor({
  page,
  teachers,
  socialGallery,
  faqs,
  faqGroups,
}: StudioPageEditorProps) {
  const [tab, setTab] = useState<StudioPageEditorTabKey>("hero");
  const [status, setStatus] = useState(page.status);
  const [hero, setHero] = useState<CmsHeroSettings>(() =>
    normalizeHeroSettings(page.hero, {
      heroTitle: STUDIO_HERO_TITLE_FALLBACK,
      heroSubtitle: STUDIO_HERO_SUBTITLE_FALLBACK,
    }),
  );
  const [introHeading, setIntroHeading] = useState(page.introHeading);
  const [introContent, setIntroContent] = useState(page.introContent);
  const [introContentTypography, setIntroContentTypography] = useState<RichTextTypography>(() =>
    normalizeRichTextTypography(page.introContentTypography ?? DEFAULT_DESCRIPTION_TYPOGRAPHY),
  );
  const [showIdeaPromptSection, setShowIdeaPromptSection] = useState(page.showIdeaPromptSection);
  const [showFaqSection, setShowFaqSection] = useState(page.showFaqSection);
  const [faqGroupId, setFaqGroupId] = useState(page.faqGroupId);
  const [seoTitle] = useState(page.seo_title);
  const [seoDescription] = useState(page.seo_description);
  const [seoImage] = useState(page.seo_image);
  const [localTeachers, setLocalTeachers] = useState(() => sortAdminVisibleTeachers(teachers));
  const [isSaving, setIsSaving] = useState(false);
  const [modal, setModal] = useState<StudioPageEditorModal>(null);
  const saveInFlight = useRef(false);

  const savePayload = useMemo(
    () => ({
      status,
      hero,
      introHeading,
      introContent,
      introContentTypography,
      showIdeaPromptSection,
      showFaqSection,
      faqGroupId,
      seo_title: seoTitle,
      seo_description: seoDescription,
      seo_image: seoImage,
    }),
    [
      faqGroupId,
      hero,
      introHeading,
      introContent,
      introContentTypography,
      seoDescription,
      seoImage,
      seoTitle,
      showFaqSection,
      showIdeaPromptSection,
      status,
    ],
  );

  const visibleTeachers = localTeachers;
  const publishedTeachers = useMemo(
    () => listPublishedTeachers(visibleTeachers),
    [visibleTeachers],
  );

  const publishedFaqGroups = useMemo(() => listPublishedFaqGroups(faqGroups), [faqGroups]);
  const selectedFaqBlock = useMemo(
    () => getSelectedFaqBlock(faqs, faqGroups, faqGroupId),
    [faqs, faqGroupId, faqGroups],
  );
  const socialGalleryProps = useMemo(
    () => buildSocialGalleryProps(socialGallery, "studio"),
    [socialGallery],
  );

  const summaryMeta = useMemo(
    () => ({
      publishedCount: publishedTeachers.length,
      ideaLabel: showIdeaPromptSection ? "Idea activa" : "Idea oculta",
      faqLabel: showFaqSection ? "FAQ activo" : "FAQ oculto",
    }),
    [publishedTeachers.length, showFaqSection, showIdeaPromptSection],
  );

  const patchHero = useCallback((next: Partial<CmsHeroSettings>) => {
    setHero((current) => ({ ...current, ...next }));
  }, []);

  const applyTeacherActionResult = useCallback(
    (id: string, resultTeacher: unknown, fallbackPatch?: Partial<Teacher>) => {
      setLocalTeachers((current) => applyTeacherToList(current, id, resultTeacher, fallbackPatch));
    },
    [],
  );

  const removeLocalTeacher = useCallback((id: string) => {
    setLocalTeachers((current) => current.filter((item) => item.id !== id));
  }, []);

  const closeModal = useCallback(() => setModal(null), []);

  const save = useCallback(
    async (nextStatus = status) => {
      if (saveInFlight.current) return;
      saveInFlight.current = true;
      setIsSaving(true);
      setModal(null);

      try {
        const result = await saveStudioPageSettingsAction({
          ...savePayload,
          status: nextStatus,
        });

        if (!result.ok) {
          setModal({ type: "error", title: "No se pudo guardar", message: result.error });
          return;
        }

        setStatus(nextStatus);
        setHero(result.page.hero);
        setIntroHeading(result.page.introHeading);
        setIntroContent(result.page.introContent);
        setIntroContentTypography(
          normalizeRichTextTypography(result.page.introContentTypography ?? DEFAULT_DESCRIPTION_TYPOGRAPHY),
        );
        setShowIdeaPromptSection(result.page.showIdeaPromptSection);
        setShowFaqSection(result.page.showFaqSection);
        setFaqGroupId(result.page.faqGroupId);
        setModal({
          type: "success",
          title: nextStatus === "published" ? "Página publicada" : "Borrador guardado",
          message: "Los cambios de El Estudio se guardaron correctamente.",
        });
      } finally {
        saveInFlight.current = false;
        setIsSaving(false);
      }
    },
    [savePayload, status],
  );

  const saveDraft = useCallback(() => {
    void save("draft");
  }, [save]);

  const savePublished = useCallback(() => {
    void save("published");
  }, [save]);

  const openPreviewTab = useCallback(() => setTab("preview"), []);

  return {
    tab,
    setTab,
    status,
    hero,
    patchHero,
    introHeading,
    setIntroHeading,
    introContent,
    setIntroContent,
    introContentTypography,
    setIntroContentTypography,
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
    visibleTeachers,
    publishedTeachers,
    publishedFaqGroups,
    selectedFaqBlock,
    socialGalleryProps,
    summaryMeta,
    applyTeacherActionResult,
    removeLocalTeacher,
  };
}

export type StudioPageEditorState = ReturnType<typeof useStudioPageEditor>;
