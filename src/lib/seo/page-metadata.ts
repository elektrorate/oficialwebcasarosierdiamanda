import type { Metadata } from "next";
import { assetPath } from "../assets";
import { siteOpenGraphLocale } from "./site-language";

export const DEFAULT_SOCIAL_IMAGE = "/img/hero-bg.jpg";

export function pageMetadata(input: {
  title: string;
  description: string;
  canonical: string;
  image?: string | null;
  defaultImage?: string | null;
  siteName: string;
  language: string;
}): Metadata {
  const image = assetPath(input.image?.trim() || input.defaultImage?.trim() || DEFAULT_SOCIAL_IMAGE);
  return {
    title: { absolute: input.title },
    description: input.description,
    alternates: { canonical: input.canonical },
    openGraph: {
      type: "website",
      url: input.canonical,
      siteName: input.siteName,
      locale: siteOpenGraphLocale(input.language),
      title: input.title,
      description: input.description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [image],
    },
  };
}
