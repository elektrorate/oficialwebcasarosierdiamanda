import type { CSSProperties } from "react";
import type { ClassHeroVariant, CmsHeroSettings } from "@/lib/cms/types";

export type DeviceKey = "phone" | "tablet" | "desktop";

export type DeviceConfig = {
  key: DeviceKey;
  label: string;
  width: number;
  height: number;
};

export type DeviceFieldKeys = {
  logoX: keyof CmsHeroSettings;
  logoY: keyof CmsHeroSettings;
  logoWidth: keyof CmsHeroSettings;
  menuY: keyof CmsHeroSettings;
  mediaX: keyof CmsHeroSettings;
  mediaY: keyof CmsHeroSettings;
  mediaScale: keyof CmsHeroSettings;
  titleScale: keyof CmsHeroSettings;
  titlePosX: keyof CmsHeroSettings;
  titlePosY: keyof CmsHeroSettings;
  titleSecondaryScale: keyof CmsHeroSettings;
  titleSecondaryPosX: keyof CmsHeroSettings;
  titleSecondaryPosY: keyof CmsHeroSettings;
  heroTitleX: keyof CmsHeroSettings;
  heroTitleY: keyof CmsHeroSettings;
  heroTitleScale: keyof CmsHeroSettings;
  presentationTextX: keyof CmsHeroSettings;
  presentationTextY: keyof CmsHeroSettings;
  presentationTextScale: keyof CmsHeroSettings;
  presentationImageX: keyof CmsHeroSettings;
  presentationImageY: keyof CmsHeroSettings;
  presentationImageScale: keyof CmsHeroSettings;
};

export type HeroEditorSectionKey = "variant" | "content" | "position";

export type SharedHeroEditorProps = {
  details: CmsHeroSettings;
  titleFallback: string;
  subtitleFallback?: string;
  allowImageTextOverlay?: boolean;
  onChange: (next: Partial<CmsHeroSettings>) => void;
};

export type SharedHeroEditorState = {
  device: DeviceKey;
  setDevice: (device: DeviceKey) => void;
  isHydrated: boolean;
  preset: DeviceConfig;
  keys: DeviceFieldKeys;
  navColor: string;
  isImageHero: boolean;
  isPresentationHero: boolean;
  isTextHero: boolean;
  previewVideoUrl: string;
  previewVideoEmbedUrl: string;
  previewVideoFrameStyle: CSSProperties;
  previewBackgroundStyle: CSSProperties;
  frameStyle: CSSProperties;
  menuStyle: CSSProperties;
  logoMask: CSSProperties;
  setVariant: (variant: ClassHeroVariant) => void;
  updateMenuColor: (color: string) => void;
};
