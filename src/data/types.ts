import type { CalendarLabel, CmsHeroSettings, RichTextTypography } from "@/lib/cms/types";

export type ExperienceKind =
  | "class"
  | "workshop"
  | "gift-card"
  | "private-booking";

export interface PriceOption {
  label: string;
  price: string;
}

export interface ScheduleItem {
  day: string;
  slots: string[];
}

export interface ProgramItem {
  title: string;
  content: string;
  contentTypography?: RichTextTypography;
  points?: string[];
}

export interface ExperienceItem {
  id: string;
  kind: ExperienceKind;
  slug: string;
  title: string;
  subtitle: string;
  heroSubtitle?: string;
  category: string;
  excerpt: string;
  description: string[];
  coverImage: string;
  homeImage?: string;
  homeImageAlt?: string;
  showHomeEyebrow?: boolean;
  homeEyebrow?: string;
  homeEyebrowTypography?: RichTextTypography;
  homeTitle?: string;
  homeTitleTypography?: RichTextTypography;
  homeTagline?: string;
  homeTaglineTypography?: RichTextTypography;
  homeExcerpt?: string;
  homeExcerptTypography?: RichTextTypography;
  heroImage: string;
  heroImageMobile?: string;
  heroVideoUrl?: string;
  heroVideoUrlMobile?: string;
  heroVideoPoster?: string;
  heroVariant?: "image" | "text" | "presentation";
  heroMenuTone?: "light" | "dark";
  heroMenuColor?: string;
  heroMenuScale?: number;
  heroLogoPositionX?: string;
  heroLogoPositionY?: string;
  heroLogoWidth?: string;
  heroLogoTabletPositionX?: string;
  heroLogoTabletPositionY?: string;
  heroLogoTabletWidth?: string;
  heroLogoMobilePositionX?: string;
  heroLogoMobilePositionY?: string;
  heroLogoMobileWidth?: string;
  heroMenuPositionY?: string;
  heroMenuTabletPositionY?: string;
  heroMenuMobilePositionY?: string;
  heroTitleImage?: string;
  heroTitleImageSecondary?: string;
  heroPresentationText?: string;
  heroPresentationSubtitle?: string;
  heroPresentationTextTypography?: RichTextTypography;
  heroPresentationSubtitleTypography?: RichTextTypography;
  heroPresentationTextColor?: string;
  heroPresentationImage?: string;
  heroPresentationCtaEnabled?: boolean;
  heroPresentationCtaLabel?: string;
  heroPresentationCtaHref?: string;
  heroPresentationCtaNewTab?: boolean;
  heroPresentationCtaBackgroundColor?: string;
  heroPresentationCtaTextColor?: string;
  /* Hero con imagen */
  titleImageScale?: number;
  titleImageScaleTablet?: number;
  titleImageScaleMobile?: number;
  titleImagePositionX?: string;
  titleImagePositionY?: string;
  titleImagePositionXTablet?: string;
  titleImagePositionYTablet?: string;
  titleImagePositionXMobile?: string;
  titleImagePositionYMobile?: string;
  titleImageSecondaryScale?: number;
  titleImageSecondaryScaleTablet?: number;
  titleImageSecondaryScaleMobile?: number;
  titleImageSecondaryPositionX?: string;
  titleImageSecondaryPositionY?: string;
  titleImageSecondaryPositionXTablet?: string;
  titleImageSecondaryPositionYTablet?: string;
  titleImageSecondaryPositionXMobile?: string;
  titleImageSecondaryPositionYMobile?: string;
  /* Hero tipográfico */
  heroTitlePositionX?: string;
  heroTitlePositionXTablet?: string;
  heroTitlePositionXMobile?: string;
  heroTitlePositionY?: string;
  heroTitlePositionYTablet?: string;
  heroTitlePositionYMobile?: string;
  heroTitleScale?: number;
  heroTitleScaleTablet?: number;
  heroTitleScaleMobile?: number;
  /* Hero con presentación */
  presentationTextPositionX?: string;
  presentationTextPositionY?: string;
  presentationTextPositionXTablet?: string;
  presentationTextPositionYTablet?: string;
  presentationTextPositionXMobile?: string;
  presentationTextPositionYMobile?: string;
  presentationTextScale?: number;
  presentationTextScaleTablet?: number;
  presentationTextScaleMobile?: number;
  presentationImagePositionX?: string;
  presentationImagePositionY?: string;
  presentationImagePositionXTablet?: string;
  presentationImagePositionYTablet?: string;
  presentationImagePositionXMobile?: string;
  presentationImagePositionYMobile?: string;
  presentationImageScale?: number;
  presentationImageScaleTablet?: number;
  presentationImageScaleMobile?: number;
  heroTitle: string;
  listingTitle: string;
  listingSubtitle: string;
  subtitleTypography?: import("@/lib/cms/rich-text-typography").RichTextTypography;
  detailQuestion: string;
  detailQuestionTypography?: import("@/lib/cms/rich-text-typography").RichTextTypography;
  introHighlight: string;
  introHighlightTypography?: import("@/lib/cms/rich-text-typography").RichTextTypography;
  descriptionTypography?: import("@/lib/cms/rich-text-typography").RichTextTypography;
  galleryImages: string[];
  videoCardImage?: string;
  videoCardLabel: string;
  videoUrl?: string;
  giftCardTypeLabel?: string;
  giftCardTypeOptions?: string[];
  priceOptions: PriceOption[];
  duration: string;
  schedule: ScheduleItem[];
  showCalendarLabels?: boolean;
  calendarLabelsTitle?: string;
  calendarLabelsDescription?: string;
  calendarLabels?: CalendarLabel[];
  included: string[];
  includedSectionTitle?: string;
  includedTypography?: RichTextTypography;
  showIncludedSection: boolean;
  program: ProgramItem[];
  showLearningSection: boolean;
  showParticipationSection: boolean;
  showPaymentMethodsSection: boolean;
  showModulesSection: boolean;
  programSectionTitle?: string;
  learningSectionTitle?: string;
  whatYouWillLearn: string[];
  whatYouWillLearnTypography?: RichTextTypography;
  participationSectionTitle?: string;
  whoCanJoin: string[];
  whoCanJoinTypography?: RichTextTypography;
  paymentMethods: string[];
  additionalInfo: string;
  additionalInfoTitle?: string;
  showAdditionalInfoSection?: boolean;
  additionalInfoTypography?: RichTextTypography;
  showIdeaPromptSection?: boolean;
  ctaHref: string;
  ctaConsultHref: string;
  ctaEnrollHref: string;
  ctaConsultLabel: string;
  ctaEnrollLabel: string;
  seoTitle: string;
  seoDescription: string;
  isPublished: boolean;
  isFeatured?: boolean;
  order: number;
}

export type ClassItem = ExperienceItem & { kind: "class" };
export type WorkshopItem = ExperienceItem & { kind: "workshop" };
export type GiftCardItem = ExperienceItem & { kind: "gift-card" };
export type PrivateExperienceItem = ExperienceItem & {
  kind: "private-booking";
};

export interface ShopCategory {
  key: string;
  label: string;
  count?: number;
}

export type ShopProductBadge = "sale" | "sold" | "new" | "popular";

export interface ShopItem {
  id: string;
  slug: string;
  name: string;
  category: string;
  categoryLabel: string;
  price: string;
  compareAtPrice: string | null;
  priceAmount: number | null;
  compareAtPriceAmount: number | null;
  badge: ShopProductBadge | null;
  availability: string;
  image: string;
  gallery: string[];
  description: string;
  details: Record<string, string>;
  availabilityNote: string;
  ctaLabel: string;
  ctaUrl: string;
  seoTitle: string;
  seoDescription: string;
  order: number;
  isPublished: boolean;
  createdAt: string;
}

export type BlogContentBlock =
  | { type: "paragraph"; content: string }
  | { type: "heading"; level: 2 | 3; content: string }
  | { type: "quote"; content: string }
  | {
      type: "image";
      src: string;
      alt?: string;
      caption?: string;
    }
  | { type: "list"; items: string[] }
  | {
      type: "gallery";
      images: Array<{ src: string; alt?: string }>;
    }
  | { type: "cta"; text: string; href: string };

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  /** Short plain excerpt for index feed cards (listing_excerpt from CMS). */
  listingExcerpt: string;
  coverImage: string;
  category: string;
  tags: string[];
  author: string;
  authorInitial: string;
  status: "published" | "draft";
  isFeatured: boolean;
  featuredOrder?: number;
  featuredImage?: string;
  featuredExcerpt?: string;
  featuredOnHome: boolean;
  visibleInListing: boolean;
  manualOrder: number;
  publishedAt: string;
  seoTitle: string;
  seoDescription: string;
  hero?: CmsHeroSettings;
  contentBlocks: BlogContentBlock[];
}

export type BlogPostStatus = BlogPost["status"];

export interface NavigationItem {
  label: string;
  href: string;
  order: number;
  visible: boolean;
  target?: string;
  children?: NavigationItem[];
  linked_entity_id?: string;
  linked_entity_type?: string;
}

export interface CartSummaryRow {
  label: string;
  value: string;
}

export interface CartItem {
  cartItemId: string;
  productId: string;
  slug: string;
  kind: ExperienceKind | string;
  title: string;
  subtitle?: string;
  price?: string;
  quantity: number;
  giftCardType?: string;
  orderSummary?: CartSummaryRow[];
  addedAt: string;
}
