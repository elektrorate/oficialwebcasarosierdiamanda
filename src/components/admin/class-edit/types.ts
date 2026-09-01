import type { ClassOfferingDetails, Offering } from "@/lib/cms/types";

export type TabKey = "hero" | "home" | "basic" | "schedule" | "seo" | "additions" | "preview";

export type PickerTarget =
  | "hero"
  | "home"
  | "presentation"
  | "title"
  | "titleSecondary"
  | "gallery"
  | `gallery:${number}`
  | "seo"
  | "videoPoster"
  | null;

export type UploadTarget = Exclude<PickerTarget, "gallery" | null> | "gallery:new";

export type SaveIntent = "draft" | "publish";

export type FormNotice = { type: "success" | "error"; message: string; details?: string[] };

export type UploadOptimization = { originalSize: number; finalSize: number; reductionPercent: number };

export type LegacyOfferingDetails = Partial<ClassOfferingDetails> & {
  additionalInfo?: unknown;
  category?: unknown;
  included?: unknown;
  introHighlight?: unknown;
  paymentMethods?: unknown;
  program?: unknown;
  videoCardImage?: unknown;
  whatYouWillLearn?: unknown;
  whoCanJoin?: unknown;
};

export type PreviewDevice = "phone" | "tablet" | "desktop";

export type ClassEditFormMode = "create" | "edit";

export type DetailPageSectionKey =
  | "basic-info"
  | "cta"
  | "pricing"
  | "schedule"
  | "calendar"
  | "media"
  | "gallery"
  | "content";

export type DetailPageSection = {
  key: DetailPageSectionKey;
  label: string;
  description: string;
  icon: string;
  group: "general" | "public";
};
