"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { MarkdownContent } from "@/components/ui/MarkdownContent";
import {
  DEFAULT_RICH_TEXT_TYPOGRAPHY,
  normalizeRichTextTypography,
  richTextTypographyStyle,
} from "@/lib/cms/rich-text-typography";
import type { CmsHeroSettings } from "@/lib/cms/types";

export function PublicHeroContent({ hero }: { hero: CmsHeroSettings }) {
  if (hero.heroVariant === "image") {
    return (
      <div className="public-hero-content" style={{ position: "absolute", inset: 0, zIndex: 5, pointerEvents: "none" }}>
        {hero.titleImage ? (
          <div
            className="public-hero-title"
            data-hero-overlay="primary"
            style={{
              position: "absolute",
              left: "var(--title-image-position-x, 50%)",
              top: "var(--title-image-position-y, 50%)",
              transform: "translate(-50%, -50%) scale(var(--title-image-scale, 1))",
              transformOrigin: "center center",
              width: "min(82%, 700px)",
              aspectRatio: "3.35 / 1",
              zIndex: 1,
            } as CSSProperties}
          >
            <Image src={hero.titleImage} alt="" fill sizes="(max-width: 640px) 72vw, (max-width: 1024px) 70vw, 700px" className="object-contain" style={{ opacity: 0.8 }} unoptimized />
          </div>
        ) : null}
        {hero.titleImageSecondary ? (
          <div
            className="public-hero-title"
            data-hero-overlay="secondary"
            style={{
              position: "absolute",
              left: "var(--title-image-secondary-position-x, 50%)",
              top: "var(--title-image-secondary-position-y, 50%)",
              transform: "translate(-50%, -50%) scale(var(--title-image-secondary-scale, 1))",
              transformOrigin: "center center",
              width: "min(82%, 700px)",
              aspectRatio: "3.35 / 1",
              zIndex: 2,
            } as CSSProperties}
          >
            <Image src={hero.titleImageSecondary} alt="" fill sizes="(max-width: 640px) 72vw, (max-width: 1024px) 70vw, 700px" className="object-contain" unoptimized />
          </div>
        ) : null}
      </div>
    );
  }

  if (hero.heroVariant === "presentation") {
    const copyTypography = normalizeRichTextTypography(hero.heroPresentationTextTypography ?? DEFAULT_RICH_TEXT_TYPOGRAPHY);
    const subtitleTypography = normalizeRichTextTypography(
      hero.heroPresentationSubtitleTypography ?? { ...DEFAULT_RICH_TEXT_TYPOGRAPHY, fontSize: 22 },
    );

    return (
      <div className="public-hero-content public-hero-content--presentation" style={{ position: "absolute", inset: 0, zIndex: 5, pointerEvents: "none" }}>
        <div className="page-hero__presentation-stage">
          <div className="page-hero__presentation-text" style={{ color: hero.heroPresentationTextColor || "#FFFFFF" }}>
            <MarkdownContent
              source={hero.heroPresentationText || hero.heroTitle}
              className="page-hero__presentation-copy"
              style={richTextTypographyStyle(copyTypography)}
              h1Level={2}
            />
            {hero.heroPresentationSubtitle ? (
              <MarkdownContent
                source={hero.heroPresentationSubtitle}
                className="page-hero__presentation-subtitle"
                style={richTextTypographyStyle(subtitleTypography)}
              />
            ) : null}
            {hero.heroPresentationCtaEnabled && hero.heroPresentationCtaHref ? (
              <a
                className="page-hero__presentation-cta"
                href={hero.heroPresentationCtaHref}
                target={hero.heroPresentationCtaNewTab ? "_blank" : undefined}
                rel={hero.heroPresentationCtaNewTab ? "noopener noreferrer" : undefined}
                style={{ backgroundColor: hero.heroPresentationCtaBackgroundColor, color: hero.heroPresentationCtaTextColor }}
              >
                {hero.heroPresentationCtaLabel || "Descubrir"}
              </a>
            ) : null}
          </div>
          {hero.heroPresentationImage ? (
            <div className="page-hero__presentation-image">
              <Image src={hero.heroPresentationImage} alt={hero.heroTitle} fill sizes="420px" className="object-contain" unoptimized />
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return null;
}

export function PublicHeroTitle({ title, subtitle }: { hero: CmsHeroSettings; title: string; subtitle?: string }) {
  return (
    <div className="public-hero-title" style={{
      position: "absolute",
      left: "var(--hero-title-position-x, 50%)",
      top: "var(--hero-title-position-y, 50%)",
      transform: "translateX(-50%) scale(var(--hero-title-scale, 1))",
      transformOrigin: "top center",
      textAlign: "center",
      zIndex: 5,
      pointerEvents: "none",
      maxWidth: "90%",
    } as CSSProperties}>
      <h1 className="page-hero__title" style={{
        position: "static",
        transform: "none",
        top: "auto",
        margin: 0,
        maxWidth: "none",
        textAlign: "center",
      } as CSSProperties}>{title}</h1>
      {subtitle ? <p className="page-hero__eyebrow" style={{
        marginTop: "16px",
        marginBottom: 0,
        textAlign: "center",
      }}>{subtitle}</p> : null}
    </div>
  );
}
