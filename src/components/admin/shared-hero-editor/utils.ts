import type { CSSProperties } from "react";
import { vimeoEmbedUrl } from "@/lib/vimeo";
import { richTextTypographyRevision } from "@/lib/cms/rich-text-typography";
import type { CmsHeroSettings } from "@/lib/cms/types";
import type { DeviceFieldKeys, DeviceKey } from "./types";

function responsivePreviewValue<T>(device: DeviceKey, desktop: T, tablet: T, phone: T) {
  if (device === "phone") return phone;
  if (device === "tablet") return tablet;
  return desktop;
}

export function heroVideoEmbedUrl(rawUrl: string) {
  if (!rawUrl) return "";
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "player.vimeo.com" || host === "vimeo.com") {
      return vimeoEmbedUrl(rawUrl, { background: "1", autoplay: "1", muted: "1", loop: "1", autopause: "0", controls: "0" });
    }

    if (host === "youtu.be" || host === "youtube.com" || host === "m.youtube.com") {
      const id = host === "youtu.be"
        ? url.pathname.split("/").filter(Boolean)[0]
        : url.searchParams.get("v") || url.pathname.split("/").filter(Boolean).pop();
      return id ? `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&playsinline=1&loop=1&playlist=${id}&modestbranding=1&rel=0` : "";
    }
  } catch {
    return "";
  }
  return "";
}

export function deviceKeys(device: DeviceKey): DeviceFieldKeys {
  if (device === "phone") {
    return {
      logoX: "heroLogoMobilePositionX",
      logoY: "heroLogoMobilePositionY",
      logoWidth: "heroLogoMobileWidth",
      menuY: "heroMenuMobilePositionY",
      mediaX: "heroMediaMobilePositionX",
      mediaY: "heroMediaMobilePositionY",
      mediaScale: "heroMediaMobileScale",
      titleScale: "titleImageScaleMobile",
      titlePosX: "titleImagePositionXMobile",
      titlePosY: "titleImagePositionYMobile",
      titleSecondaryScale: "titleImageSecondaryScaleMobile",
      titleSecondaryPosX: "titleImageSecondaryPositionXMobile",
      titleSecondaryPosY: "titleImageSecondaryPositionYMobile",
      heroTitleX: "heroTitlePositionXMobile",
      heroTitleY: "heroTitlePositionYMobile",
      heroTitleScale: "heroTitleScaleMobile",
      presentationTextX: "presentationTextPositionXMobile",
      presentationTextY: "presentationTextPositionYMobile",
      presentationTextScale: "presentationTextScaleMobile",
      presentationImageX: "presentationImagePositionXMobile",
      presentationImageY: "presentationImagePositionYMobile",
      presentationImageScale: "presentationImageScaleMobile",
    };
  }

  if (device === "tablet") {
    return {
      logoX: "heroLogoTabletPositionX",
      logoY: "heroLogoTabletPositionY",
      logoWidth: "heroLogoTabletWidth",
      menuY: "heroMenuTabletPositionY",
      mediaX: "heroMediaTabletPositionX",
      mediaY: "heroMediaTabletPositionY",
      mediaScale: "heroMediaTabletScale",
      titleScale: "titleImageScaleTablet",
      titlePosX: "titleImagePositionXTablet",
      titlePosY: "titleImagePositionYTablet",
      titleSecondaryScale: "titleImageSecondaryScaleTablet",
      titleSecondaryPosX: "titleImageSecondaryPositionXTablet",
      titleSecondaryPosY: "titleImageSecondaryPositionYTablet",
      heroTitleX: "heroTitlePositionXTablet",
      heroTitleY: "heroTitlePositionYTablet",
      heroTitleScale: "heroTitleScaleTablet",
      presentationTextX: "presentationTextPositionXTablet",
      presentationTextY: "presentationTextPositionYTablet",
      presentationTextScale: "presentationTextScaleTablet",
      presentationImageX: "presentationImagePositionXTablet",
      presentationImageY: "presentationImagePositionYTablet",
      presentationImageScale: "presentationImageScaleTablet",
    };
  }

  return {
    logoX: "heroLogoPositionX",
    logoY: "heroLogoPositionY",
    logoWidth: "heroLogoWidth",
    menuY: "heroMenuPositionY",
    mediaX: "heroMediaPositionX",
    mediaY: "heroMediaPositionY",
    mediaScale: "heroMediaScale",
    titleScale: "titleImageScale",
    titlePosX: "titleImagePositionX",
    titlePosY: "titleImagePositionY",
    titleSecondaryScale: "titleImageSecondaryScale",
    titleSecondaryPosX: "titleImageSecondaryPositionX",
    titleSecondaryPosY: "titleImageSecondaryPositionY",
    heroTitleX: "heroTitlePositionX",
    heroTitleY: "heroTitlePositionY",
    heroTitleScale: "heroTitleScale",
    presentationTextX: "presentationTextPositionX",
    presentationTextY: "presentationTextPositionY",
    presentationTextScale: "presentationTextScale",
    presentationImageX: "presentationImagePositionX",
    presentationImageY: "presentationImagePositionY",
    presentationImageScale: "presentationImageScale",
  };
}

export function heroText(details: CmsHeroSettings, key: keyof CmsHeroSettings) {
  const value = details[key];
  return typeof value === "string" ? value : "";
}

export function heroScale(details: CmsHeroSettings, key: keyof CmsHeroSettings) {
  const value = details[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 1;
}

export function heroBackgroundImage(details: CmsHeroSettings, device: DeviceKey) {
  return device === "phone" && details.heroImageMobile ? details.heroImageMobile : details.heroImage;
}

export function heroPreviewVideoUrl(details: CmsHeroSettings, device: DeviceKey) {
  if (details.heroVariant !== "image") return "";
  return device === "phone" && details.heroVideoUrlMobile ? details.heroVideoUrlMobile : details.heroVideoUrl;
}

export function patchDeviceField(
  key: keyof CmsHeroSettings,
  value: string | number,
): Partial<CmsHeroSettings> {
  return { [key]: value } as Partial<CmsHeroSettings>;
}

/** Stable revision when preview copy / variant / typography inputs change (not position-only edits). */
export function heroPreviewContentRevision(
  details: CmsHeroSettings,
  titleFallback: string,
  subtitleFallback?: string,
): string {
  return [
    details.heroVariant,
    details.heroTitle,
    details.heroSubtitle,
    details.heroPresentationText,
    details.heroPresentationSubtitle,
    details.heroPresentationTextColor,
    details.heroPresentationImage,
    details.titleImage,
    details.titleImageSecondary,
    details.heroPresentationCtaEnabled,
    details.heroPresentationCtaLabel,
    details.heroPresentationCtaHref,
    details.heroPresentationCtaNewTab,
    details.heroPresentationCtaBackgroundColor,
    details.heroPresentationCtaTextColor,
    richTextTypographyRevision(details.heroPresentationTextTypography),
    richTextTypographyRevision(details.heroPresentationSubtitleTypography),
    titleFallback,
    subtitleFallback ?? "",
  ].join("\u001f");
}

/** Stable revision for preview layout CSS (positions, logo, menu, media background). */
export function heroPreviewLayoutRevision(details: CmsHeroSettings, device: DeviceKey): string {
  const keys = deviceKeys(device);
  return [
    device,
    details.heroVariant,
    details.heroMenuColor,
    details.heroMenuTone,
    details.heroMenuScale,
    details.heroImage,
    details.heroImageMobile,
    details.heroVideoUrl,
    details.heroVideoUrlMobile,
    details.heroVideoPoster,
    heroText(details, keys.logoX),
    heroText(details, keys.logoY),
    heroText(details, keys.logoWidth),
    heroText(details, keys.menuY),
    heroText(details, keys.mediaX),
    heroText(details, keys.mediaY),
    heroScale(details, keys.mediaScale),
    heroText(details, keys.titlePosX),
    heroText(details, keys.titlePosY),
    heroScale(details, keys.titleScale),
    heroText(details, keys.titleSecondaryPosX),
    heroText(details, keys.titleSecondaryPosY),
    heroScale(details, keys.titleSecondaryScale),
    heroText(details, keys.heroTitleX),
    heroText(details, keys.heroTitleY),
    heroScale(details, keys.heroTitleScale),
    heroText(details, keys.presentationTextX),
    heroText(details, keys.presentationTextY),
    heroScale(details, keys.presentationTextScale),
    heroText(details, keys.presentationImageX),
    heroText(details, keys.presentationImageY),
    heroScale(details, keys.presentationImageScale),
  ].join("\u001f");
}

/** CSS variables for the admin hero preview frame (mirrors PreviewHeader + device tab). */
export function buildHeroPreviewCssVariables(details: CmsHeroSettings, device: DeviceKey): CSSProperties {
  const keys = deviceKeys(device);
  const navColor = details.heroMenuColor || (details.heroMenuTone === "light" ? "#ffffff" : "#3f3933");

  const presentationTextX = heroText(details, keys.presentationTextX) || "8%";
  const presentationTextY = heroText(details, keys.presentationTextY) || "50%";
  const presentationTextScale = heroScale(details, keys.presentationTextScale);
  const presentationImageX = heroText(details, keys.presentationImageX) || "70%";
  const presentationImageY = heroText(details, keys.presentationImageY) || "50%";
  const presentationImageScale = heroScale(details, keys.presentationImageScale);

  return {
    "--hero-menu-color": navColor,
    "--hero-menu-scale": details.heroMenuScale ?? 1,
    "--hero-logo-position-x": responsivePreviewValue(
      device,
      details.heroLogoPositionX || "50%",
      details.heroLogoTabletPositionX || details.heroLogoPositionX || "50%",
      details.heroLogoMobilePositionX ||
        details.heroLogoTabletPositionX ||
        details.heroLogoPositionX ||
        "50%",
    ),
    "--hero-logo-position-y": responsivePreviewValue(
      device,
      details.heroLogoPositionY || "46px",
      details.heroLogoTabletPositionY || details.heroLogoPositionY || "42px",
      details.heroLogoMobilePositionY ||
        details.heroLogoTabletPositionY ||
        details.heroLogoPositionY ||
        "34px",
    ),
    "--hero-logo-width": responsivePreviewValue(
      device,
      details.heroLogoWidth || "118px",
      details.heroLogoTabletWidth || details.heroLogoWidth || "106px",
      details.heroLogoMobileWidth || details.heroLogoTabletWidth || details.heroLogoWidth || "92px",
    ),
    "--title-image-scale": details.titleImageScale ?? 1,
    "--title-image-scale-tablet": details.titleImageScaleTablet ?? details.titleImageScale ?? 1,
    "--title-image-scale-mobile":
      details.titleImageScaleMobile ?? details.titleImageScaleTablet ?? details.titleImageScale ?? 1,
    "--title-image-position-x": details.titleImagePositionX ?? "50%",
    "--title-image-position-y": details.titleImagePositionY ?? "50%",
    "--title-image-position-x-tablet": details.titleImagePositionXTablet ?? details.titleImagePositionX ?? "50%",
    "--title-image-position-y-tablet": details.titleImagePositionYTablet ?? details.titleImagePositionY ?? "50%",
    "--title-image-position-x-mobile":
      details.titleImagePositionXMobile ?? details.titleImagePositionXTablet ?? details.titleImagePositionX ?? "50%",
    "--title-image-position-y-mobile":
      details.titleImagePositionYMobile ??
      details.titleImagePositionYTablet ??
      details.titleImagePositionY ??
      "50%",
    "--title-image-secondary-scale": details.titleImageSecondaryScale ?? 1,
    "--title-image-secondary-scale-tablet":
      details.titleImageSecondaryScaleTablet ?? details.titleImageSecondaryScale ?? 1,
    "--title-image-secondary-scale-mobile":
      details.titleImageSecondaryScaleMobile ??
      details.titleImageSecondaryScaleTablet ??
      details.titleImageSecondaryScale ??
      1,
    "--title-image-secondary-position-x": details.titleImageSecondaryPositionX ?? "50%",
    "--title-image-secondary-position-y": details.titleImageSecondaryPositionY ?? "50%",
    "--title-image-secondary-position-x-tablet":
      details.titleImageSecondaryPositionXTablet ?? details.titleImageSecondaryPositionX ?? "50%",
    "--title-image-secondary-position-y-tablet":
      details.titleImageSecondaryPositionYTablet ?? details.titleImageSecondaryPositionY ?? "50%",
    "--title-image-secondary-position-x-mobile":
      details.titleImageSecondaryPositionXMobile ??
      details.titleImageSecondaryPositionXTablet ??
      details.titleImageSecondaryPositionX ??
      "50%",
    "--title-image-secondary-position-y-mobile":
      details.titleImageSecondaryPositionYMobile ??
      details.titleImageSecondaryPositionYTablet ??
      details.titleImageSecondaryPositionY ??
      "50%",
    "--hero-title-position-x": responsivePreviewValue(
      device,
      details.heroTitlePositionX ?? "50%",
      details.heroTitlePositionXTablet ?? details.heroTitlePositionX ?? "50%",
      details.heroTitlePositionXMobile ??
        details.heroTitlePositionXTablet ??
        details.heroTitlePositionX ??
        "50%",
    ),
    "--hero-title-position-y": responsivePreviewValue(
      device,
      details.heroTitlePositionY ?? "50%",
      details.heroTitlePositionYTablet ?? details.heroTitlePositionY ?? "50%",
      details.heroTitlePositionYMobile ??
        details.heroTitlePositionYTablet ??
        details.heroTitlePositionY ??
        "50%",
    ),
    "--hero-title-scale": responsivePreviewValue(
      device,
      details.heroTitleScale ?? 1,
      details.heroTitleScaleTablet ?? details.heroTitleScale ?? 1,
      details.heroTitleScaleMobile ?? details.heroTitleScaleTablet ?? details.heroTitleScale ?? 1,
    ),
    "--presentation-text-position-x": details.presentationTextPositionX ?? "8%",
    "--presentation-text-position-y": details.presentationTextPositionY ?? "50%",
    "--presentation-text-position-x-tablet":
      details.presentationTextPositionXTablet ?? details.presentationTextPositionX ?? "8%",
    "--presentation-text-position-y-tablet":
      details.presentationTextPositionYTablet ?? details.presentationTextPositionY ?? "50%",
    "--presentation-text-position-x-mobile":
      details.presentationTextPositionXMobile ??
      details.presentationTextPositionXTablet ??
      details.presentationTextPositionX ??
      "8%",
    "--presentation-text-position-y-mobile":
      details.presentationTextPositionYMobile ??
      details.presentationTextPositionYTablet ??
      details.presentationTextPositionY ??
      "50%",
    "--presentation-text-scale": details.presentationTextScale ?? 1,
    "--presentation-text-scale-tablet":
      details.presentationTextScaleTablet ?? details.presentationTextScale ?? 1,
    "--presentation-text-scale-mobile":
      details.presentationTextScaleMobile ??
      details.presentationTextScaleTablet ??
      details.presentationTextScale ??
      1,
    "--presentation-image-position-x": details.presentationImagePositionX ?? "70%",
    "--presentation-image-position-y": details.presentationImagePositionY ?? "50%",
    "--presentation-image-position-x-tablet":
      details.presentationImagePositionXTablet ?? details.presentationImagePositionX ?? "70%",
    "--presentation-image-position-y-tablet":
      details.presentationImagePositionYTablet ?? details.presentationImagePositionY ?? "50%",
    "--presentation-image-position-x-mobile":
      details.presentationImagePositionXMobile ??
      details.presentationImagePositionXTablet ??
      details.presentationImagePositionX ??
      "70%",
    "--presentation-image-position-y-mobile":
      details.presentationImagePositionYMobile ??
      details.presentationImagePositionYTablet ??
      details.presentationImagePositionY ??
      "50%",
    "--presentation-image-scale": details.presentationImageScale ?? 1,
    "--presentation-image-scale-tablet":
      details.presentationImageScaleTablet ?? details.presentationImageScale ?? 1,
    "--presentation-image-scale-mobile":
      details.presentationImageScaleMobile ??
      details.presentationImageScaleTablet ??
      details.presentationImageScale ??
      1,
    "--preview-presentation-text-x": presentationTextX,
    "--preview-presentation-text-y": presentationTextY,
    "--preview-presentation-text-scale": presentationTextScale,
    "--preview-presentation-image-x": presentationImageX,
    "--preview-presentation-image-y": presentationImageY,
    "--preview-presentation-image-scale": presentationImageScale,
  } as CSSProperties;
}

export function buildHeroPreviewHero(
  details: CmsHeroSettings,
  titleFallback: string,
  subtitleFallback?: string,
): CmsHeroSettings {
  const heroTitle = details.heroTitle || titleFallback;
  const heroSubtitle = details.heroSubtitle || subtitleFallback || "";
  const normalized = resolvePresentationHeroContent({
    ...details,
    heroTitle,
    heroSubtitle,
  });

  return {
    ...normalized,
    heroTitle,
    heroSubtitle,
  };
}

/** Keeps presentation copy fields aligned with typographic hero fields when migrating variants. */
export function resolvePresentationHeroContent<T extends Pick<CmsHeroSettings, "heroVariant" | "heroTitle" | "heroSubtitle" | "heroPresentationText" | "heroPresentationSubtitle">>(
  details: T,
): T {
  if (details.heroVariant !== "presentation") return details;

  return {
    ...details,
    heroPresentationText: details.heroPresentationText?.trim() || details.heroTitle?.trim() || "",
    heroPresentationSubtitle: details.heroPresentationSubtitle?.trim() || details.heroSubtitle?.trim() || "",
  };
}
