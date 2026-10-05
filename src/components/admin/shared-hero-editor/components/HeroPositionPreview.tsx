"use client";

import { memo } from "react";
import Image from "next/image";
import { PublicHeroContent, PublicHeroTitle } from "@/components/hero/PublicHeroContent";
import { richTextTypographyRevision } from "@/lib/cms/rich-text-typography";
import type { CmsHeroSettings } from "@/lib/cms/types";
import { PREVIEW_MENU_ITEMS } from "../constants";
import type { SharedHeroEditorState } from "../types";
import { heroScale, heroText } from "../utils";

function HeroPositionPreviewComponent({
  details,
  previewHero,
  editor,
}: {
  details: CmsHeroSettings;
  previewHero: CmsHeroSettings;
  editor: SharedHeroEditorState;
}) {
  const { device, keys, isHydrated, isImageHero, isPresentationHero, isTextHero, frameStyle, menuStyle, logoMask, previewVideoEmbedUrl, previewVideoUrl, previewVideoFrameStyle, previewBackgroundStyle } = editor;
  const frameClassName = [
    "cms-hero-position-preview__frame",
    "relative mx-auto overflow-hidden rounded-xl border border-outline-variant shadow-sm",
    isHydrated && isPresentationHero ? "header-interno--presentation-hero" : "",
    isHydrated && isImageHero ? "header-interno--image-hero" : "",
    isHydrated && isTextHero ? "header-interno--text-hero" : "",
  ].filter(Boolean).join(" ");

  return (
    <div className="cms-hero-position-preview" aria-label="Vista de referencia del hero">
      <div
        className={frameClassName}
        style={frameStyle}
        data-preview-device={device}
      >
        <div className="absolute inset-0 z-0" style={previewBackgroundStyle} aria-hidden="true" />
        {previewVideoEmbedUrl ? (
          <iframe
            className="absolute z-0 border-0"
            style={previewVideoFrameStyle}
            src={previewVideoEmbedUrl}
            title="Video de fondo del hero"
            allow="autoplay; fullscreen; picture-in-picture"
            tabIndex={-1}
            aria-hidden="true"
          />
        ) : /\.(mp4|webm|ogg)([?#]|$)/i.test(previewVideoUrl) ? (
          <video
            className="absolute z-0 object-cover"
            style={previewVideoFrameStyle}
            src={previewVideoUrl}
            poster={details.heroVideoPoster || details.heroImage}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
          />
        ) : null}

        {device === "desktop" ? (
          <>
            <span
              className="absolute z-20 -translate-x-1/2"
              style={{
                ...logoMask,
                left: heroText(details, keys.logoX) || "50%",
                top: heroText(details, keys.logoY) || "46px",
                width: heroText(details, keys.logoWidth) || "118px",
                aspectRatio: "2.2 / 1",
              }}
            />
            <nav className="absolute left-1/2 z-20 flex whitespace-nowrap text-[12px] font-bold" style={menuStyle} aria-label="Vista previa menú">
              <ul className="flex list-none items-center gap-4 p-0">
                {PREVIEW_MENU_ITEMS.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </nav>
          </>
        ) : (
          <div className="absolute inset-0 z-20" style={{ color: editor.navColor }}>
            <span
              className="absolute block -translate-x-1/2"
              style={{
                ...logoMask,
                left: heroText(details, keys.logoX) || "50%",
                top: heroText(details, keys.logoY) || (device === "tablet" ? "42px" : "34px"),
                width: heroText(details, keys.logoWidth) || (device === "tablet" ? "106px" : "92px"),
                aspectRatio: "2.2 / 1",
              }}
            />
            <span
              className="absolute right-6 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-current/30"
              style={{ top: heroText(details, keys.menuY) || (device === "tablet" ? "118px" : "96px") }}
            >
              <span className="material-symbols-outlined text-[22px]">menu</span>
            </span>
          </div>
        )}

        <div className="absolute inset-0 z-10">
          {isPresentationHero ? (
            <PublicHeroContent
              key={[
                "presentation",
                previewHero.heroPresentationText,
                previewHero.heroPresentationSubtitle,
                previewHero.heroPresentationTextColor,
                previewHero.heroPresentationImage,
                previewHero.heroPresentationCtaEnabled,
                previewHero.heroPresentationCtaLabel,
                richTextTypographyRevision(previewHero.heroPresentationTextTypography),
                richTextTypographyRevision(previewHero.heroPresentationSubtitleTypography),
              ].join("\u001f")}
              hero={previewHero}
            />
          ) : null}

          {isImageHero ? (
            <div className="absolute inset-0">
              {details.titleImage ? (
                <div
                  className="absolute"
                  style={{
                    left: heroText(details, keys.titlePosX) || "50%",
                    top: heroText(details, keys.titlePosY) || "50%",
                    transform: `translate(-50%, -50%) scale(${heroScale(details, keys.titleScale)})`,
                    transformOrigin: "center center",
                    width: "50%",
                    height: "30%",
                  }}
                >
                  <Image src={details.titleImage} alt="" fill sizes="700px" className="object-contain opacity-80" unoptimized />
                </div>
              ) : null}
              {details.titleImageSecondary ? (
                <div
                  className="absolute"
                  style={{
                    left: heroText(details, keys.titleSecondaryPosX) || "50%",
                    top: heroText(details, keys.titleSecondaryPosY) || "50%",
                    transform: `translate(-50%, -50%) scale(${heroScale(details, keys.titleSecondaryScale)})`,
                    transformOrigin: "center center",
                    width: "50%",
                    height: "30%",
                  }}
                >
                  <Image src={details.titleImageSecondary} alt="" fill sizes="700px" className="object-contain" unoptimized />
                </div>
              ) : null}
            </div>
          ) : null}

          {isTextHero ? (
            <PublicHeroTitle
              hero={previewHero}
              title={previewHero.heroTitle}
              subtitle={previewHero.heroSubtitle}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

export const HeroPositionPreview = memo(HeroPositionPreviewComponent);
