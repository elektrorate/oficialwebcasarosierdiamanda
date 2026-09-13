"use client";

import type { ClassOfferingDetails, Offering } from "@/lib/cms/types";
import { buildPreviewItem } from "../utils";

export function useClassEditPreviewItem({
  offeringType,
  title,
  slug,
  subtitle,
  description,
  seoTitle,
  seoDescription,
  details,
}: {
  offeringType: Offering["type"];
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  details: ClassOfferingDetails;
}) {
  return buildPreviewItem({
    offeringType,
    title,
    slug,
    subtitle,
    description,
    seoTitle,
    seoDescription,
    details,
  });
}
