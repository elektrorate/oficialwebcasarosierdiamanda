"use client";

import { useCallback, useMemo } from "react";
import { SEO_RECOMMENDED_DESCRIPTION_LENGTH, SEO_RECOMMENDED_TITLE_LENGTH } from "@/lib/seo/content";
import { buildClassEditSerpPreview } from "../utils";
import type { ClassEditFormState } from "./useClassEditForm";

export function useSeoTabHandlers(form: ClassEditFormState) {
  const {
    title,
    slug,
    seoTitle,
    seoDescription,
    details,
    setSeoTitle,
    setSeoDescription,
    markDirty,
    setPickerTarget,
  } = form;

  const handleSeoTitleChange = useCallback(
    (value: string) => {
      setSeoTitle(value);
      markDirty();
    },
    [markDirty, setSeoTitle],
  );

  const handleSeoDescriptionChange = useCallback(
    (value: string) => {
      setSeoDescription(value);
      markDirty();
    },
    [markDirty, setSeoDescription],
  );

  const openSeoImagePicker = useCallback(() => setPickerTarget("seo"), [setPickerTarget]);

  const serpPreview = useMemo(
    () => buildClassEditSerpPreview({ seoTitle, seoDescription, title, slug, description: details.highlightDescription }),
    [details.highlightDescription, seoDescription, seoTitle, slug, title],
  );

  const seoTitleHelp = `Caracteres: ${seoTitle.length}. Recomendado: hasta ${SEO_RECOMMENDED_TITLE_LENGTH}.`;
  const seoDescriptionHelp = `Caracteres: ${seoDescription.length}. Recomendado: hasta ${SEO_RECOMMENDED_DESCRIPTION_LENGTH}.`;

  return useMemo(
    () => ({
      seoTitle,
      seoDescription,
      seoImage: details.seoImage,
      seoTitleHelp,
      seoDescriptionHelp,
      handleSeoTitleChange,
      handleSeoDescriptionChange,
      openSeoImagePicker,
      serpPreview,
    }),
    [
      details.seoImage,
      handleSeoDescriptionChange,
      handleSeoTitleChange,
      openSeoImagePicker,
      seoDescription,
      seoDescriptionHelp,
      seoTitle,
      seoTitleHelp,
      serpPreview,
    ],
  );
}
