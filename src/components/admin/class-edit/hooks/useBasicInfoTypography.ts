"use client";

import {
  DEFAULT_DESCRIPTION_TYPOGRAPHY,
  DEFAULT_RICH_TEXT_TYPOGRAPHY,
  normalizeRichTextTypography,
  richTextTypographyRevision,
  type RichTextTypography,
} from "@/lib/cms/rich-text-typography";
import type { ClassOfferingDetails } from "@/lib/cms/types";

export type BasicInfoTypography = {
  subtitle: RichTextTypography;
  detailQuestion: RichTextTypography;
  highlight: RichTextTypography;
  description: RichTextTypography;
};

export function resolveBasicInfoTypography(details: ClassOfferingDetails): BasicInfoTypography {
  return {
    subtitle: normalizeRichTextTypography(details.subtitleTypography ?? DEFAULT_RICH_TEXT_TYPOGRAPHY),
    detailQuestion: normalizeRichTextTypography(details.detailQuestionTypography ?? DEFAULT_RICH_TEXT_TYPOGRAPHY),
    highlight: normalizeRichTextTypography(details.highlightDescriptionTypography ?? DEFAULT_RICH_TEXT_TYPOGRAPHY),
    description: normalizeRichTextTypography(details.descriptionTypography ?? DEFAULT_DESCRIPTION_TYPOGRAPHY),
  };
}

export function basicInfoTypographyRevision(details: ClassOfferingDetails): string {
  return [
    richTextTypographyRevision(details.subtitleTypography),
    richTextTypographyRevision(details.detailQuestionTypography),
    richTextTypographyRevision(details.highlightDescriptionTypography),
    richTextTypographyRevision(details.descriptionTypography),
  ].join("\u001f");
}

/** Revision key for preview rebuild when any rich-text typography changes (basic, home, hero, media, content). */
export function classEditPreviewTypographyRevision(details: ClassOfferingDetails): string {
  const modulesRevision = (details.content?.modules ?? [])
    .map((mod) => richTextTypographyRevision(mod.descriptionTypography))
    .join("|");
  return [
    basicInfoTypographyRevision(details),
    richTextTypographyRevision(details.homeCard?.eyebrowTypography),
    richTextTypographyRevision(details.homeCard?.titleTypography),
    richTextTypographyRevision(details.homeCard?.taglineTypography),
    richTextTypographyRevision(details.homeCard?.excerptTypography),
    richTextTypographyRevision(details.heroPresentationTextTypography),
    richTextTypographyRevision(details.heroPresentationSubtitleTypography),
    richTextTypographyRevision(details.includedItemsTypography),
    richTextTypographyRevision(details.content?.learningContentTypography),
    richTextTypographyRevision(details.content?.participationContentTypography),
    richTextTypographyRevision(details.content?.extraInfoTypography),
    modulesRevision,
  ].join("\u001f");
}

export function useBasicInfoTypography(details: ClassOfferingDetails): BasicInfoTypography {
  return resolveBasicInfoTypography(details);
}
