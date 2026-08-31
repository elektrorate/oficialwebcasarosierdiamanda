"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { MarkdownContent } from "@/components/ui/MarkdownContent";
import type { ExperienceItem } from "@/data/types";
import { assetPath } from "@/lib/assets";
import {
  DEFAULT_DESCRIPTION_TYPOGRAPHY,
  DEFAULT_RICH_TEXT_TYPOGRAPHY,
  normalizeRichTextTypography,
  type RichTextTypography,
} from "@/lib/cms/rich-text-typography";
import { experienceHref } from "@/lib/routes";
import { Carousel } from "@/components/ui/Carousel";

const DEFAULT_GIFT_EYEBROW_TYPOGRAPHY: RichTextTypography = {
  ...DEFAULT_RICH_TEXT_TYPOGRAPHY,
  fontSize: 14,
};

const DEFAULT_GIFT_TITLE_TYPOGRAPHY: RichTextTypography = {
  ...DEFAULT_RICH_TEXT_TYPOGRAPHY,
  fontSize: 26,
};

const DEFAULT_GIFT_TAGLINE_TYPOGRAPHY: RichTextTypography = {
  ...DEFAULT_RICH_TEXT_TYPOGRAPHY,
  fontSize: 21,
};

function typographyVars(prefix: string, value: RichTextTypography | undefined, fallback: RichTextTypography): CSSProperties {
  const typography = normalizeRichTextTypography(value ?? fallback);
  return {
    [`--${prefix}-font-size`]: `${typography.fontSize}px`,
    [`--${prefix}-font-weight`]: String(typography.weight),
    [`--${prefix}-font-stretch`]: `${typography.width}%`,
    [`--${prefix}-font-width`]: String(typography.width),
    [`--${prefix}-font-style`]: typography.italic ? "italic" : "normal",
  } as CSSProperties;
}

function stripMarkdown(value: string) {
  return value
    .replace(/[#*_~`>\[\]()]/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

interface GiftCarouselProps {
  items: readonly ExperienceItem[];
}

function giftHomeContent(item: ExperienceItem) {
  const eyebrow = (item.homeEyebrow || item.category || "").trim();
  const tagline = (item.homeTagline || item.subtitle || "").trim();
  return {
    image: item.homeImage || item.coverImage,
    imageAlt: item.homeImageAlt || item.homeTitle || item.title,
    eyebrow,
    title: item.homeTitle || item.title,
    tagline,
    excerpt: item.homeExcerpt || item.excerpt,
  };
}

function GiftCard({ item }: { item: ExperienceItem }) {
  const content = giftHomeContent(item);
  const href = experienceHref(item.kind, item.slug);
  const style = {
    ...typographyVars("gift-eyebrow", item.homeEyebrowTypography, DEFAULT_GIFT_EYEBROW_TYPOGRAPHY),
    ...typographyVars("gift-title", item.homeTitleTypography, DEFAULT_GIFT_TITLE_TYPOGRAPHY),
    ...typographyVars("gift-tagline", item.homeTaglineTypography ?? item.subtitleTypography, DEFAULT_GIFT_TAGLINE_TYPOGRAPHY),
    ...typographyVars("gift-excerpt", item.homeExcerptTypography, DEFAULT_DESCRIPTION_TYPOGRAPHY),
  };

  return (
    <Link
      href={href}
      aria-label={`Ver ${stripMarkdown(content.title) || item.title}`}
      style={style}
      className="group grid items-center gap-[clamp(28px,4.5vw,52px)] text-left text-inherit no-underline grid-cols-[minmax(min(100%,240px),clamp(240px,28vw,320px))_minmax(0,1fr)] focus-visible:outline-2 focus-visible:outline-[currentColor] focus-visible:outline-offset-[6px] max-[720px]:grid-cols-1 max-[720px]:gap-[clamp(20px,5vw,28px)]"
    >
      <span className="block aspect-square w-full overflow-hidden bg-[#1a1a1a] max-[720px]:mx-auto max-[720px]:w-[min(100%,320px)]">
        <img
          src={assetPath(content.image)}
          alt={content.imageAlt}
          loading="lazy"
          decoding="async"
          className="block h-full w-full object-cover"
        />
      </span>
      <div className="flex min-w-0 flex-col items-start max-[720px]:items-center max-[720px]:text-center">
        {content.eyebrow ? (
          <MarkdownContent
            className="gift-carousel__eyebrow max-[720px]:w-full max-[720px]:text-center"
            source={content.eyebrow}
          />
        ) : null}
        <div className="block mb-[clamp(14px,1.75vw,18px)] max-[720px]:w-full max-[720px]:text-center">
          <MarkdownContent className="gift-carousel__title" source={content.title} />
          {content.tagline ? (
            <MarkdownContent className="gift-carousel__tagline" source={content.tagline} />
          ) : null}
        </div>
        <MarkdownContent
          className="gift-carousel__text max-[720px]:text-center"
          source={content.excerpt}
        />
        <span
          aria-hidden="true"
          className="mt-[clamp(14px,1.75vw,18px)] inline-flex items-center justify-center border border-[#c4c4c4] bg-transparent px-6.5 py-2.5 font-medium text-[14px]/[1] leading-none lowercase text-[#707070] [font-family:var(--font-primary)] transition-[border-color,color,background-color] duration-180 ease-in-out group-hover:border-[#707070] group-hover:text-black group-focus-visible:border-[#707070] group-focus-visible:text-black max-[720px]:mx-auto"
        >
          ver más
        </span>
      </div>
    </Link>
  );
}

export function GiftCarousel({ items }: GiftCarouselProps) {
  if (items.length === 0) return null;
  const singleItem = items[0];

  if (items.length === 1 && singleItem) {
    return (
      <article className="block w-full max-w-none text-left">
        <GiftCard item={singleItem} />
      </article>
    );
  }

  return (
    <Carousel
      items={items}
      ariaLabel="Experiencias en ceramica"
      className="relative grid items-center gap-4.5 grid-cols-[44px_minmax(0,1fr)_44px]"
      viewportClassName="overflow-hidden"
      trackClassName="transition-transform duration-[420ms] ease-in-out"
      slideClassName="block text-left flex-[0_0_100%]"
      arrowClassName="w-[40px] h-[40px] inline-flex items-center justify-center border-0 bg-transparent cursor-pointer font-light text-[28px] [font-family:var(--font-menu)] text-[#98918b] transition-[color,transform] duration-[180ms] ease hover:text-[#4f4943] hover:-translate-y-px self-center"
      previousLabel="Experiencia anterior"
      nextLabel="Experiencia siguiente"
      showArrows
      renderItem={(item) => <GiftCard item={item} />}
    />
  );
}