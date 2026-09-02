export const OFFERING_TYPES = ["class", "workshop", "experience", "gift_card"] as const;
export const OFFERING_STATUSES = ["draft", "published", "archived", "deleted"] as const;

export type OfferingType = (typeof OFFERING_TYPES)[number];
export type OfferingStatus = (typeof OFFERING_STATUSES)[number];

export interface OfferingPriceOption {
  description: string;
  price: number | null;
  order: number;
}

export interface OfferingGalleryImage {
  image: string;
  alt: string;
  seoTitle?: string;
  seoDescription?: string;
  order: number;
}

export interface ClassScheduleDay {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  description: string;
  location: string;
  availableSeats: number | null;
  order: number;
}

export interface CalendarLabel {
  id: string;
  month: number;
  year: number;
  days: number[];
  active: boolean;
  order: number;
  availabilityText?: string;
}

export interface RichTextTypography {
  italic: boolean;
  weight: number;
  width: number;
  fontSize: number;
  lineHeight?: number;
}

export interface ClassOfferingModule {
  id: string;
  title: string;
  description: string;
  descriptionTypography?: RichTextTypography;
  order: number;
}

export interface ClassHomeCard {
  image: string;
  imageAlt: string;
  showEyebrow: boolean;
  eyebrow: string;
  eyebrowTypography?: RichTextTypography;
  title: string;
  titleTypography?: RichTextTypography;
  tagline: string;
  taglineTypography?: RichTextTypography;
  excerpt: string;
  excerptTypography?: RichTextTypography;
  ctaLabel: string;
}

export interface CalendarUiSettings {
  collapseLabel: string;
  expandLabel: string;
  daySingular: string;
  dayPlural: string;
  monthNames: string[];
  weekdayLabels: string[];
}

export const DEFAULT_CALENDAR_UI: CalendarUiSettings = {
  collapseLabel: "ocultar fechas",
  expandLabel: "ver otras fechas",
  daySingular: "día",
  dayPlural: "días",
  monthNames: [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ],
  weekdayLabels: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
};

export function normalizeCalendarUi(value: Partial<CalendarUiSettings> | undefined): CalendarUiSettings {
  if (!value || typeof value !== "object") return DEFAULT_CALENDAR_UI;
  const months = Array.isArray(value.monthNames) ? value.monthNames.map(normalizeNonEmptyLines) : [];
  const weekdays = Array.isArray(value.weekdayLabels) ? value.weekdayLabels.map(normalizeNonEmptyLines) : [];
  return {
    collapseLabel: normalizeNonEmptyLines(value.collapseLabel) || DEFAULT_CALENDAR_UI.collapseLabel,
    expandLabel: normalizeNonEmptyLines(value.expandLabel) || DEFAULT_CALENDAR_UI.expandLabel,
    daySingular: normalizeNonEmptyLines(value.daySingular) || DEFAULT_CALENDAR_UI.daySingular,
    dayPlural: normalizeNonEmptyLines(value.dayPlural) || DEFAULT_CALENDAR_UI.dayPlural,
    monthNames: months.length === 12 ? months : DEFAULT_CALENDAR_UI.monthNames,
    weekdayLabels: weekdays.length === 7 ? weekdays : DEFAULT_CALENDAR_UI.weekdayLabels,
  };
}

function normalizeNonEmptyLines(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.split("\n").map((line) => line.trim()).filter(Boolean).join("\n");
}

export interface ClassOfferingActivityItem {
  id: string;
  title: string;
  description: string;
  image: string;
  order: number;
}

export interface ClassOfferingContent {
  /** Compatibilidad con registros creados antes de los controles independientes. */
  showCourseContent?: boolean;
  showLearningSection: boolean;
  showParticipationSection: boolean;
  showPaymentMethodsSection: boolean;
  showModulesSection: boolean;
  learningSectionTitle: string;
  learningContent: string;
  learningContentTypography?: RichTextTypography;
  participationSectionTitle: string;
  participationContent: string;
  participationContentTypography?: RichTextTypography;
  paymentMethods: string;
  paymentMethodsList: string[];
  paymentMethodsSectionTitle: string;
  contactWhatsapp: string;
  contactEmail: string;
  extraInfo: string;
  extraInfoTitle?: string;
  showExtraInfoSection?: boolean;
  extraInfoTypography?: RichTextTypography;
  showEnrollButtonAtEnd: boolean;
  activitiesSection: {
    enabled: boolean;
    title: string;
    content: string;
    items: ClassOfferingActivityItem[];
  };
  modulesSectionTitle: string;
  modulesAccordionTitle: string;
  modules: ClassOfferingModule[];
}

export type ClassHeroVariant = "image" | "text" | "presentation";

export interface CmsHeroSettings {
  heroVariant: ClassHeroVariant;
  heroTitle: string;
  heroSubtitle: string;
  heroPresentationText: string;
  heroPresentationSubtitle: string;
  heroPresentationTextTypography?: RichTextTypography;
  heroPresentationSubtitleTypography?: RichTextTypography;
  heroPresentationTextColor: string;
  heroPresentationImage: string;
  heroPresentationCtaEnabled: boolean;
  heroPresentationCtaLabel: string;
  heroPresentationCtaHref: string;
  heroPresentationCtaNewTab: boolean;
  heroPresentationCtaBackgroundColor: string;
  heroPresentationCtaTextColor: string;
  heroMenuTone: "light" | "dark";
  heroMenuColor: string;
  heroMenuScale: number;
  heroLogoPositionX: string;
  heroLogoPositionY: string;
  heroLogoWidth: string;
  heroLogoTabletPositionX: string;
  heroLogoTabletPositionY: string;
  heroLogoTabletWidth: string;
  heroLogoMobilePositionX: string;
  heroLogoMobilePositionY: string;
  heroLogoMobileWidth: string;
  heroMenuPositionY: string;
  heroMenuTabletPositionY: string;
  heroMenuMobilePositionY: string;
  heroImage: string;
  heroImageMobile: string;
  heroVideoUrl: string;
  heroVideoUrlMobile: string;
  heroVideoPoster: string;
  heroMediaPositionX: string;
  heroMediaPositionY: string;
  heroMediaScale: number;
  heroMediaTabletPositionX: string;
  heroMediaTabletPositionY: string;
  heroMediaTabletScale: number;
  heroMediaMobilePositionX: string;
  heroMediaMobilePositionY: string;
  heroMediaMobileScale: number;
  titleImage: string;
  titleImageSecondary: string;
  /* Hero con imagen: escala + posición X/Y de cada imagen superpuesta */
  titleImageScale: number;
  titleImageScaleTablet: number;
  titleImageScaleMobile: number;
  titleImagePositionX: string;
  titleImagePositionY: string;
  titleImagePositionXTablet: string;
  titleImagePositionYTablet: string;
  titleImagePositionXMobile: string;
  titleImagePositionYMobile: string;
  titleImageSecondaryScale: number;
  titleImageSecondaryScaleTablet: number;
  titleImageSecondaryScaleMobile: number;
  titleImageSecondaryPositionX: string;
  titleImageSecondaryPositionY: string;
  titleImageSecondaryPositionXTablet: string;
  titleImageSecondaryPositionYTablet: string;
  titleImageSecondaryPositionXMobile: string;
  titleImageSecondaryPositionYMobile: string;
  /* Hero tipográfico: posición X/Y + escala del título */
  heroTitlePositionX: string;
  heroTitlePositionXTablet: string;
  heroTitlePositionXMobile: string;
  heroTitlePositionY: string;
  heroTitlePositionYTablet: string;
  heroTitlePositionYMobile: string;
  heroTitleScale: number;
  heroTitleScaleTablet: number;
  heroTitleScaleMobile: number;
  /* Hero con presentación: posición X/Y + escala del texto y la imagen */
  presentationTextPositionX: string;
  presentationTextPositionY: string;
  presentationTextPositionXTablet: string;
  presentationTextPositionYTablet: string;
  presentationTextPositionXMobile: string;
  presentationTextPositionYMobile: string;
  presentationTextScale: number;
  presentationTextScaleTablet: number;
  presentationTextScaleMobile: number;
  presentationImagePositionX: string;
  presentationImagePositionY: string;
  presentationImagePositionXTablet: string;
  presentationImagePositionYTablet: string;
  presentationImagePositionXMobile: string;
  presentationImagePositionYMobile: string;
  presentationImageScale: number;
  presentationImageScaleTablet: number;
  presentationImageScaleMobile: number;
}

export interface ClassOfferingDetails {
  menuTitle: string;
  heroVariant: ClassHeroVariant;
  heroTitle: string;
  heroSubtitle: string;
  heroPresentationText: string;
  heroPresentationSubtitle: string;
  heroPresentationTextTypography?: RichTextTypography;
  heroPresentationSubtitleTypography?: RichTextTypography;
  heroPresentationTextColor: string;
  heroPresentationImage: string;
  heroPresentationCtaEnabled: boolean;
  heroPresentationCtaLabel: string;
  heroPresentationCtaHref: string;
  heroPresentationCtaNewTab: boolean;
  heroPresentationCtaBackgroundColor: string;
  heroPresentationCtaTextColor: string;
  heroMenuTone: "light" | "dark";
  heroMenuColor: string;
  heroMenuScale: number;
  heroLogoPositionX: string;
  heroLogoPositionY: string;
  heroLogoWidth: string;
  heroLogoTabletPositionX: string;
  heroLogoTabletPositionY: string;
  heroLogoTabletWidth: string;
  heroLogoMobilePositionX: string;
  heroLogoMobilePositionY: string;
  heroLogoMobileWidth: string;
  heroMenuPositionY: string;
  heroMenuTabletPositionY: string;
  heroMenuMobilePositionY: string;
  ctaHref: string;
  ctaConsultHref: string;
  ctaEnrollHref: string;
  ctaConsultLabel: string;
  ctaEnrollLabel: string;
  showConsultCta: boolean;
  showEnrollCta: boolean;
  detailQuestion: string;
  highlightDescription: string;
  subtitleTypography?: RichTextTypography;
  detailQuestionTypography?: RichTextTypography;
  highlightDescriptionTypography?: RichTextTypography;
  descriptionTypography?: RichTextTypography;
  homeCard: ClassHomeCard;
  /** Compatibilidad con registros anteriores a la tarjeta de Home independiente. */
  homeExcerpt: string;
  durationText: string;
  durationSectionTitle: string;
  showDurationSectionTitle: boolean;
  scheduleLabel: string;
  whatsappNumber: string;
  scheduleDescription: string;
  showScheduleOnFrontend: boolean;
  scheduleDays: ClassScheduleDay[];
  showCalendarLabels: boolean;
  calendarLabelsTitle: string;
  calendarLabelsDescription: string;
  calendarLabels: CalendarLabel[];
  calendarUi: CalendarUiSettings;
  priceSectionTitle: string;
  menuPlacement: string[];
  homeSections: string[];
  heroImage: string;
  heroImageMobile: string;
  heroVideoUrl: string;
  heroVideoUrlMobile: string;
  heroVideoPoster: string;
  heroMediaPositionX: string;
  heroMediaPositionY: string;
  heroMediaScale: number;
  heroMediaTabletPositionX: string;
  heroMediaTabletPositionY: string;
  heroMediaTabletScale: number;
  heroMediaMobilePositionX: string;
  heroMediaMobilePositionY: string;
  heroMediaMobileScale: number;
  titleImage: string;
  titleImageSecondary: string;
  titleImageScale: number;
  titleImageScaleTablet: number;
  titleImageScaleMobile: number;
  titleImagePositionX: string;
  titleImagePositionY: string;
  titleImagePositionXTablet: string;
  titleImagePositionYTablet: string;
  titleImagePositionXMobile: string;
  titleImagePositionYMobile: string;
  titleImageSecondaryScale: number;
  titleImageSecondaryScaleTablet: number;
  titleImageSecondaryScaleMobile: number;
  titleImageSecondaryPositionX: string;
  titleImageSecondaryPositionY: string;
  titleImageSecondaryPositionXTablet: string;
  titleImageSecondaryPositionYTablet: string;
  titleImageSecondaryPositionXMobile: string;
  titleImageSecondaryPositionYMobile: string;
  heroTitlePositionX: string;
  heroTitlePositionXTablet: string;
  heroTitlePositionXMobile: string;
  heroTitlePositionY: string;
  heroTitlePositionYTablet: string;
  heroTitlePositionYMobile: string;
  heroTitleScale: number;
  heroTitleScaleTablet: number;
  heroTitleScaleMobile: number;
  presentationTextPositionX: string;
  presentationTextPositionY: string;
  presentationTextPositionXTablet: string;
  presentationTextPositionYTablet: string;
  presentationTextPositionXMobile: string;
  presentationTextPositionYMobile: string;
  presentationTextScale: number;
  presentationTextScaleTablet: number;
  presentationTextScaleMobile: number;
  presentationImagePositionX: string;
  presentationImagePositionY: string;
  presentationImagePositionXTablet: string;
  presentationImagePositionYTablet: string;
  presentationImagePositionXMobile: string;
  presentationImagePositionYMobile: string;
  presentationImageScale: number;
  presentationImageScaleTablet: number;
  presentationImageScaleMobile: number;
  galleryImages: OfferingGalleryImage[];
  videoUrl: string;
  videoPoster: string;
  showIncludedSection: boolean;
  includedSectionTitle: string;
  includedItems: string[];
  includedItemsTypography?: RichTextTypography;
  pricing: OfferingPriceOption[];
  seoImage: string;
  showIdeaPromptSection: boolean;
  content: ClassOfferingContent;
}

export interface OfferingDetails {
  class?: Partial<ClassOfferingDetails>;
  [key: string]: unknown;
}

export function isOfferingType(value: unknown): value is OfferingType {
  return typeof value === "string" && (OFFERING_TYPES as readonly string[]).includes(value);
}

export function isOfferingStatus(value: unknown): value is OfferingStatus {
  return typeof value === "string" && (OFFERING_STATUSES as readonly string[]).includes(value);
}

export const HEADER_TYPES = ["home", "internal", "landing", "offering", "shop", "blog", "studio", "custom"] as const;
export const HEADER_STATUSES = ["draft", "published", "archived", "deleted"] as const;
export const CONTENT_POSITIONS = ["left", "center", "right", "bottom_left", "bottom_center", "bottom_right"] as const;
export const CONTENT_ALIGNMENTS = ["left", "center", "right"] as const;
export const MENU_COLORS = ["light", "dark", "custom"] as const;
export const LOGO_VARIANTS = ["default", "light", "dark", "hidden"] as const;
export const VISUAL_VARIANTS = ["minimal", "editorial", "immersive", "split", "clean"] as const;

export type HeaderType = (typeof HEADER_TYPES)[number];
export type HeaderStatus = (typeof HEADER_STATUSES)[number];

export interface HeaderOverlayImage {
  id: string;
  image: string;
  alt: string;
  width: string;
  height: string;
  positionX: string;
  positionY: string;
  desktopPositionX: string;
  desktopPositionY: string;
  mobilePositionX: string;
  mobilePositionY: string;
  zIndex: number;
  opacity: number;
  rotation: string;
  visibleDesktop: boolean;
  visibleMobile: boolean;
  animation: string;
  order: number;
}

export interface Header {
  id: string;
  name: string;
  slug: string;
  type: HeaderType;
  status: HeaderStatus;
  title: string;
  subtitle: string;
  eyebrow: string;
  desktop_image_url: string;
  mobile_image_url: string;
  overlay_enabled: boolean;
  overlay_color: string;
  overlay_opacity: number;
  gradient_enabled: boolean;
  gradient_css: string;
  desktop_height: string;
  mobile_height: string;
  content_position: string;
  content_alignment: string;
  menu_color: string;
  logo_variant: string;
  visual_variant: string;
  cta_label: string;
  cta_url: string;
  logo: string;
  logoAlt: string;
  logoWidth: string;
  logoHeight: string;
  logoPositionX: string;
  logoPositionY: string;
  logoDesktopPositionX: string;
  logoDesktopPositionY: string;
  logoMobilePositionX: string;
  logoMobilePositionY: string;
  logoZIndex: number;
  logoVisibleDesktop: boolean;
  logoVisibleMobile: boolean;
  menuId: string | null;
  showMenu: boolean;
  menuPositionX: string;
  menuPositionY: string;
  menuDesktopPositionX: string;
  menuDesktopPositionY: string;
  menuMobilePositionX: string;
  menuMobilePositionY: string;
  menuAlign: string;
  menuZIndex: number;
  menuVisibleDesktop: boolean;
  menuVisibleMobile: boolean;
  menuTextColor: string;
  menuHoverColor: string;
  showMenuSeparators: boolean;
  overlayImages: HeaderOverlayImage[];
  assignedPages: string[];
  isDefault: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export function isHeaderType(value: unknown): value is HeaderType {
  return typeof value === "string" && (HEADER_TYPES as readonly string[]).includes(value);
}

export function isHeaderStatus(value: unknown): value is HeaderStatus {
  return typeof value === "string" && (HEADER_STATUSES as readonly string[]).includes(value);
}

export interface Offering {
  id: string;
  type: OfferingType;
  title: string;
  slug: string;
  subtitle: string;
  excerpt: string;
  description: string;
  price: number | null;
  currency: string;
  status: OfferingStatus;
  featured: boolean;
  header_id: string | null;
  duration: string;
  schedule: string[];
  teacher: string;
  capacity: number | null;
  cover_image_url: string;
  gallery: string[];
  details: OfferingDetails;
  seo_title: string;
  seo_description: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export const MEDIA_FOLDERS = ["home", "headers", "offerings", "shop", "bitacora", "estudio", "marketing", "logos", "general"] as const;
export const MEDIA_STATUSES = ["active", "archived", "deleted"] as const;
export const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif", "svg", "pdf"] as const;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export type MediaFolder = (typeof MEDIA_FOLDERS)[number];
export type MediaStatus = (typeof MEDIA_STATUSES)[number];

export function isMediaFolder(value: unknown): value is MediaFolder {
  return typeof value === "string" && (MEDIA_FOLDERS as readonly string[]).includes(value);
}

export function isMediaStatus(value: unknown): value is MediaStatus {
  return typeof value === "string" && (MEDIA_STATUSES as readonly string[]).includes(value);
}

export interface MediaAsset {
  id: string;
  file_name: string;
  original_name: string;
  file_url: string;
  file_type: string;
  mime_type: string;
  size: number;
  alt_text: string;
  title: string;
  description: string;
  folder: string;
  tags: string[];
  status: MediaStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface TrashItem {
  id: string;
  entity_type: string;
  entity_id: string;
  title: string;
  deleted_by: string;
  deleted_at: string;
  restore_data: unknown;
}

export const MENU_LOCATIONS = ["main", "mobile", "footer"] as const;
export const MENU_STATUSES = ["active", "draft", "archived", "deleted"] as const;
export const MENU_ITEM_TYPES = ["internal", "external", "offering", "custom"] as const;
export const LINKED_ENTITY_TYPES = ["offering", "page", "landing", "blog", "shop", "none"] as const;

export type MenuLocation = (typeof MENU_LOCATIONS)[number];
export type MenuStatus = (typeof MENU_STATUSES)[number];
export type MenuItemType = (typeof MENU_ITEM_TYPES)[number];
export type LinkedEntityType = (typeof LINKED_ENTITY_TYPES)[number];

export interface MenuItem {
  id: string;
  label: string;
  type: MenuItemType;
  url: string;
  linked_entity_type: LinkedEntityType;
  linked_entity_id: string;
  parent_id: string | null;
  sort_order: number;
  is_visible: boolean;
  open_in_new_tab: boolean;
  created_at: string;
  updated_at: string;
}

export interface Menu {
  id: string;
  name: string;
  location: MenuLocation;
  status: MenuStatus;
  items: MenuItem[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export function isMenuLocation(value: unknown): value is MenuLocation {
  return typeof value === "string" && (MENU_LOCATIONS as readonly string[]).includes(value);
}

export function isMenuStatus(value: unknown): value is MenuStatus {
  return typeof value === "string" && (MENU_STATUSES as readonly string[]).includes(value);
}

export function isMenuItemType(value: unknown): value is MenuItemType {
  return typeof value === "string" && (MENU_ITEM_TYPES as readonly string[]).includes(value);
}

export function isLinkedEntityType(value: unknown): value is LinkedEntityType {
  return typeof value === "string" && (LINKED_ENTITY_TYPES as readonly string[]).includes(value);
}

export const PAGE_TYPES = ["home", "studio", "contact", "faq", "privacy", "cookies", "legal", "custom"] as const;
export const PAGE_STATUSES = ["draft", "published", "archived", "deleted"] as const;

export type PageType = (typeof PAGE_TYPES)[number];
export type PageStatus = (typeof PAGE_STATUSES)[number];

export function isPageType(value: unknown): value is PageType {
  return typeof value === "string" && (PAGE_TYPES as readonly string[]).includes(value);
}

export function isPageStatus(value: unknown): value is PageStatus {
  return typeof value === "string" && (PAGE_STATUSES as readonly string[]).includes(value);
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  type: PageType;
  status: PageStatus;
  header_id: string | null;
  social_gallery_id: string | null;
  testimonials_id: string | null;
  footer_id: string | null;
  seo_title: string;
  seo_description: string;
  seo_image: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PageFaqItem {
  id: string;
  faq_section_id: string;
  question: string;
  answer: string;
  position: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface PageFaqSection {
  id: string;
  page_id: string;
  title: string;
  is_enabled: boolean;
  items: PageFaqItem[];
  created_at: string;
  updated_at: string;
}


/* ── Social Gallery ── */
export const SOCIAL_GALLERY_STATUSES = ["draft", "published", "archived", "deleted"] as const;
export type SocialGalleryStatus = (typeof SOCIAL_GALLERY_STATUSES)[number];

export interface SocialGalleryItem {
  id: string;
  image_id: string;
  image_url: string;
  title: string;
  description: string;
  instagram_url: string;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface SocialGallery {
  id: string;
  name: string;
  slug: string;
  status: SocialGalleryStatus;
  title: string;
  description: string;
  cta_text: string;
  cta_url: string;
  items: SocialGalleryItem[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export function isSocialGalleryStatus(value: unknown): value is SocialGalleryStatus {
  return typeof value === "string" && (SOCIAL_GALLERY_STATUSES as readonly string[]).includes(value);
}

/* ── Testimonial ── */
export const TESTIMONIAL_STATUSES = ["draft", "published", "archived", "deleted"] as const;
export type TestimonialStatus = (typeof TESTIMONIAL_STATUSES)[number];

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  text: string;
  avatar_id: string;
  status: TestimonialStatus;
  sort_order: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export function isTestimonialStatus(value: unknown): value is TestimonialStatus {
  return typeof value === "string" && (TESTIMONIAL_STATUSES as readonly string[]).includes(value);
}

/* ── Footer Component ── */
export const FOOTER_STATUSES = ["draft", "published", "archived", "deleted"] as const;
export type FooterStatus = (typeof FOOTER_STATUSES)[number];

export interface SocialLink {
  platform: string;
  url: string;
  label: string;
  icon_url?: string;
  icon_color?: string;
  button_color?: string;
}

export interface FooterComponent {
  id: string;
  name: string;
  status: FooterStatus;
  logo_id: string;
  contact_email: string;
  whatsapp: string;
  address: string;
  map_url: string;
  legal_text: string;
  contact_title: string;
  contact_text: string;
  form_button_color: string;
  form_button_text_color: string;
  social_button_color: string;
  social_icon_color: string;
  social_links: SocialLink[];
  menu_id: string | null;
  newsletter_enabled: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export function isFooterStatus(value: unknown): value is FooterStatus {
  return typeof value === "string" && (FOOTER_STATUSES as readonly string[]).includes(value);
}

/* ── Promo Banner ── */
export const PROMO_STATUSES = ["draft", "published", "archived", "deleted"] as const;
export const PROMO_VISUAL_VARIANTS = ["default", "accent", "minimal"] as const;
export type PromoStatus = (typeof PROMO_STATUSES)[number];
export type PromoVisualVariant = (typeof PROMO_VISUAL_VARIANTS)[number];

export interface PromoBanner {
  id: string;
  title: string;
  text: string;
  key_text: string;
  detail_text: string;
  image_url: string;
  button_text: string;
  link_url: string;
  start_date: string;
  end_date: string;
  status: PromoStatus;
  visual_variant: PromoVisualVariant;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export function isPromoStatus(value: unknown): value is PromoStatus {
  return typeof value === "string" && (PROMO_STATUSES as readonly string[]).includes(value);
}

/* ── FAQ ── */
export const FAQ_STATUSES = ["draft", "published", "archived", "deleted"] as const;
export const FAQ_CATEGORIES = ["general", "classes", "shop", "booking"] as const;
export type FaqStatus = (typeof FAQ_STATUSES)[number];
export type FaqCategory = (typeof FAQ_CATEGORIES)[number];
export type PageFaqCategory = FaqCategory | "all";

export interface FaqGroup {
  id: string;
  title: string;
  description: string;
  status: FaqStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: FaqCategory;
  faq_group_id: string | null;
  topic_title: string;
  sort_order: number;
  status: FaqStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export function isFaqStatus(value: unknown): value is FaqStatus {
  return typeof value === "string" && (FAQ_STATUSES as readonly string[]).includes(value);
}

export interface PublicFaqBlock {
  group: FaqGroup;
  faqs: Faq[];
}

/* ── Teacher ── */
export const TEACHER_STATUSES = ["draft", "published", "archived", "deleted"] as const;
export type TeacherStatus = (typeof TEACHER_STATUSES)[number];

export interface Teacher {
  id: string;
  name: string;
  bio: string;
  bio_typography?: RichTextTypography;
  image_id: string;
  instagram: string;
  specialty: string;
  status: TeacherStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export function isTeacherStatus(value: unknown): value is TeacherStatus {
  return typeof value === "string" && (TEACHER_STATUSES as readonly string[]).includes(value);
}

/* ── Landing Page ── */
export const LANDING_PAGE_STATUSES = ["draft", "published", "archived", "deleted"] as const;
export const CAMPAIGN_TYPES = ["course", "workshop", "experience", "gift_card", "event", "lead_capture", "custom"] as const;
export const BLOCK_TYPES = ["text", "image", "text_image", "gallery", "cta", "testimonial", "faq", "teacher", "promo_banner", "custom_html"] as const;

export type LandingPageStatus = (typeof LANDING_PAGE_STATUSES)[number];
export type CampaignType = (typeof CAMPAIGN_TYPES)[number];
export type BlockType = (typeof BLOCK_TYPES)[number];

export function isLandingPageStatus(value: unknown): value is LandingPageStatus {
  return typeof value === "string" && (LANDING_PAGE_STATUSES as readonly string[]).includes(value);
}

export function isCampaignType(value: unknown): value is CampaignType {
  return typeof value === "string" && (CAMPAIGN_TYPES as readonly string[]).includes(value);
}

export function isBlockType(value: unknown): value is BlockType {
  return typeof value === "string" && (BLOCK_TYPES as readonly string[]).includes(value);
}

export interface LandingPageBlock {
  id: string;
  type: BlockType;
  title: string;
  text: string;
  image_id: string;
  cta_text: string;
  cta_url: string;
  is_visible: boolean;
  sort_order: number;
  custom_html: string;
  created_at: string;
  updated_at: string;
}

export interface LandingPage {
  id: string;
  title: string;
  slug: string;
  status: LandingPageStatus;
  campaign_type: CampaignType;
  header_id: string | null;
  hero_title: string;
  hero_subtitle: string;
  hero_image_id: string;
  intro_text: string;
  cta_text: string;
  cta_url: string;
  form_id: string | null;
  social_gallery_id: string | null;
  testimonials_id: string | null;
  footer_id: string | null;
  seo_title: string;
  seo_description: string;
  seo_image: string;
  blocks: LandingPageBlock[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/* ── Reservation ── */
export const RESERVATION_STATUSES = ["pending", "confirmed", "paid", "cancelled", "rescheduled", "deleted"] as const;
export const RESERVATION_PAYMENT_STATUSES = ["unpaid", "pending", "paid", "refunded", "failed"] as const;
export const CURRENCIES = ["EUR", "USD", "ARS"] as const;

export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];
export type ReservationPaymentStatus = (typeof RESERVATION_PAYMENT_STATUSES)[number];
export type Currency = (typeof CURRENCIES)[number];

export function isReservationStatus(value: unknown): value is ReservationStatus {
  return typeof value === "string" && (RESERVATION_STATUSES as readonly string[]).includes(value);
}
export function isReservationPaymentStatus(value: unknown): value is ReservationPaymentStatus {
  return typeof value === "string" && (RESERVATION_PAYMENT_STATUSES as readonly string[]).includes(value);
}

export interface Reservation {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  offering_id: string;
  schedule_id: string | null;
  date: string;
  time: string;
  people_count: number;
  status: ReservationStatus;
  payment_status: ReservationPaymentStatus;
  payment_id: string | null;
  total_amount: number | null;
  currency: Currency;
  notes: string;
  internal_notes: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/* ── Form ── */
export const FORM_TYPES = ["contact", "newsletter", "landing", "workshop", "gift_card", "private_booking", "custom"] as const;
export const FORM_STATUSES = ["draft", "active", "archived", "deleted"] as const;
export const FORM_FIELD_TYPES = ["text", "email", "phone", "textarea", "select", "checkbox", "radio", "date", "number", "hidden"] as const;

export type FormType = (typeof FORM_TYPES)[number];
export type FormStatus = (typeof FORM_STATUSES)[number];
export type FormFieldType = (typeof FORM_FIELD_TYPES)[number];

export function isFormType(value: unknown): value is FormType {
  return typeof value === "string" && (FORM_TYPES as readonly string[]).includes(value);
}
export function isFormStatus(value: unknown): value is FormStatus {
  return typeof value === "string" && (FORM_STATUSES as readonly string[]).includes(value);
}
export function isFormFieldType(value: unknown): value is FormFieldType {
  return typeof value === "string" && (FORM_FIELD_TYPES as readonly string[]).includes(value);
}

export interface FormField {
  id: string;
  label: string;
  name: string;
  type: FormFieldType;
  placeholder: string;
  required: boolean;
  options: string[];
  default_value: string;
  sort_order: number;
  is_visible: boolean;
}

export interface Form {
  id: string;
  name: string;
  slug: string;
  type: FormType;
  status: FormStatus;
  title: string;
  description: string;
  success_message: string;
  redirect_url: string;
  email_notification_enabled: boolean;
  notification_email: string;
  fields: FormField[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/* ── Form Submission ── */
export const SUBMISSION_STATUSES = ["new", "read", "replied", "archived", "spam", "deleted"] as const;
export type FormSubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export function isFormSubmissionStatus(value: unknown): value is FormSubmissionStatus {
  return typeof value === "string" && (SUBMISSION_STATUSES as readonly string[]).includes(value);
}

export type FormNotificationStatus = "disabled" | "missing_recipient" | "missing_api_key" | "sent" | "failed";

export interface FormNotificationMeta {
  status: FormNotificationStatus;
  provider: "resend";
  attempted_at: string;
  to?: string;
  from?: string;
  message_id?: string;
  error?: string;
}
export interface FormSubmission {
  id: string;
  form_id: string;
  form_slug: string;
  form_name: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  data: Record<string, unknown>;
  source_page: string;
  status: FormSubmissionStatus;
  internal_notes: string;
  notification_status: FormNotificationStatus | null;
  notification_provider: "resend" | null;
  notification_to: string;
  notification_from: string;
  notification_message_id: string;
  notification_error: string;
  notification_attempted_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/* ── Blog Post ── */
export const BLOG_STATUSES = ["draft", "published", "archived", "deleted"] as const;
export const BLOG_BLOCK_TYPES = ["text", "heading", "image", "quote", "gallery", "list", "video", "cta", "faq", "custom_html"] as const;
export const BLOG_CATEGORIES = ["Procesos", "Esmaltes", "Taller", "general"] as const;

export type BlogPostStatus = (typeof BLOG_STATUSES)[number];
export type BlogPostBlockType = (typeof BLOG_BLOCK_TYPES)[number];
export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export function isBlogPostStatus(value: unknown): value is BlogPostStatus {
  return typeof value === "string" && (BLOG_STATUSES as readonly string[]).includes(value);
}
export function isBlogPostBlockType(value: unknown): value is BlogPostBlockType {
  return typeof value === "string" && (BLOG_BLOCK_TYPES as readonly string[]).includes(value);
}
export function isBlogCategory(value: unknown): value is BlogCategory {
  return typeof value === "string" && (BLOG_CATEGORIES as readonly string[]).includes(value);
}

export interface BlogPostBlock {
  id: string;
  type: BlogPostBlockType;
  title: string;
  text: string;
  image_id: string;
  source_url: string;
  is_visible: boolean;
  sort_order: number;
  custom_html: string;
  created_at: string;
  updated_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  status: BlogPostStatus;
  excerpt: string;
  listing_excerpt: string;
  content: string;
  featured_image_id: string;
  author_id: string;
  category: string;
  tags: string[];
  is_featured: boolean;
  featured_order: number;
  featured_excerpt: string;
  visible_in_listing: boolean;
  sort_order: number;
  published_at: string;
  reading_time: number;
  seo_title: string;
  seo_description: string;
  seo_image: string;
  hero: CmsHeroSettings;
  blocks: BlogPostBlock[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface StudioPageSettings {
  id: string;
  status: "draft" | "published";
  hero: CmsHeroSettings;
  introHeading: string;
  introContent: string;
  introContentTypography?: RichTextTypography;
  showIdeaPromptSection: boolean;
  showFaqSection: boolean;
  faqGroupId: string;
  seo_title: string;
  seo_description: string;
  seo_image: string;
  updated_at: string;
}

export interface BlogPageSettings {
  id: string;
  status: "draft" | "published";
  hero: CmsHeroSettings;
  /** Public index masthead title (e.g. Bitácora cerámica). */
  introHeading: string;
  /** Brand line under the masthead title. */
  introKicker: string;
  /** Centered intro paragraph on the blog index. */
  introText: string;
  showIdeaPromptSection: boolean;
  showFaqSection: boolean;
  faqGroupId: string;
  seo_title: string;
  seo_description: string;
  seo_image: string;
  updated_at: string;
}

export interface HomeIntroSlide {
  id: string;
  text: string;
  buttonText: string;
  buttonHref: string;
  image: string;
  imageAlt: string;
  isVisible: boolean;
  sortOrder: number;
}

export interface HomePageSettings {
  id: string;
  status: "draft" | "published";
  hero: CmsHeroSettings;
  introSlides: HomeIntroSlide[];
  classesTitle: string;
  classesSubtitle: string;
  classesFeaturedIds: string[];
  workshopsTitle: string;
  workshopsSubtitle: string;
  workshopsFeaturedIds: string[];
  giftTitle: string;
  giftSubtitle: string;
  giftFeaturedIds: string[];
  updated_at: string;
}

export interface ShopPageSettings {
  id: string;
  status: "draft" | "published";
  hero: CmsHeroSettings;
  showCharacteristicsInPreview: boolean;
  previewCharacteristicLabels: string[];
  seo_title: string;
  seo_description: string;
  seo_image: string;
  updated_at: string;
}

/* ── Product ── */
export const PRODUCT_STATUSES = ["draft", "published", "archived", "deleted"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];
export function isProductStatus(value: unknown): value is ProductStatus {
  return typeof value === "string" && (PRODUCT_STATUSES as readonly string[]).includes(value);
}

export interface Product {
  id: string;
  status: ProductStatus;
  name: string;
  slug: string;
  sku: string;
  description: string;
  excerpt: string;
  main_image_id: string;
  gallery: string[];
  price: number | null;
  compare_at_price: number | null;
  stock: number | null;
  low_stock_threshold: number;
  category_id: string;
  characteristics: string;
  weight: string;
  dimensions: string;
  cta_label: string;
  cta_url: string;
  seo_title: string;
  seo_description: string;
  seo_image: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/* ── Product Category ── */
export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_id: string;
  status: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/* ── Order ── */
export const ORDER_STATUSES = ["new", "paid", "preparing", "shipped", "completed", "cancelled", "deleted"] as const;
export const ORDER_PAYMENT_STATUSES = ["unpaid", "pending", "paid", "refunded", "failed"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type OrderPaymentStatus = (typeof ORDER_PAYMENT_STATUSES)[number];
export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);
}
export function isOrderPaymentStatus(value: unknown): value is OrderPaymentStatus {
  return typeof value === "string" && (ORDER_PAYMENT_STATUSES as readonly string[]).includes(value);
}

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  status: OrderStatus;
  payment_status: OrderPaymentStatus;
  items: OrderItem[];
  subtotal: number | null;
  discount_total: number | null;
  shipping_total: number | null;
  total: number | null;
  coupon_code: string;
  shipping_method_id: string;
  shipping_address: string;
  payment_method: string;
  payment_id: string;
  internal_notes: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/* ── Coupon ── */
export const COUPON_STATUSES = ["active", "inactive", "expired", "deleted"] as const;
export const DISCOUNT_TYPES = ["percentage", "fixed"] as const;
export type CouponStatus = (typeof COUPON_STATUSES)[number];
export type DiscountType = (typeof DISCOUNT_TYPES)[number];
export function isCouponStatus(value: unknown): value is CouponStatus {
  return typeof value === "string" && (COUPON_STATUSES as readonly string[]).includes(value);
}
export function isDiscountType(value: unknown): value is DiscountType {
  return typeof value === "string" && (DISCOUNT_TYPES as readonly string[]).includes(value);
}

export interface Coupon {
  id: string;
  code: string;
  status: CouponStatus;
  discount_type: DiscountType;
  value: number | null;
  start_date: string;
  end_date: string;
  usage_limit: number | null;
  used_count: number;
  minimum_order_amount: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/* ── Shipping Method ── */
export const SHIPPING_STATUSES = ["active", "inactive", "deleted"] as const;
export type ShippingMethodStatus = (typeof SHIPPING_STATUSES)[number];
export function isShippingMethodStatus(value: unknown): value is ShippingMethodStatus {
  return typeof value === "string" && (SHIPPING_STATUSES as readonly string[]).includes(value);
}

export interface ShippingMethod {
  id: string;
  name: string;
  status: ShippingMethodStatus;
  type: string;
  price: number | null;
  countries: string[];
  description: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/* ── Marketing Settings ── */
export const MARKETING_EVENTS = [
  "page_view", "lead", "contact_form", "newsletter_signup", "click_whatsapp", "click_instagram",
  "click_external_link",
  "class_booking", "workshop_booking", "experience_booking", "gift_card_purchase",
  "add_to_cart", "initiate_checkout", "purchase",
] as const;
export type MarketingEvent = (typeof MARKETING_EVENTS)[number];

export interface MarketingPublicButtonLink {
  id: string;
  label: string;
  url: string;
  eventName: Extract<MarketingEvent, "click_whatsapp" | "click_instagram" | "click_external_link">;
}

export interface MarketingSettings {
  analytics_enabled: boolean;
  ga4_measurement_id: string;
  gtm_container_id: string;
  google_search_console_id: string;
  microsoft_clarity_id: string;
  meta_pixel_enabled: boolean;
  meta_pixel_id: string;
  meta_conversion_api_enabled: boolean;
  meta_access_token: string;
  meta_dataset_id: string;
  tiktok_pixel_enabled: boolean;
  tiktok_pixel_id: string;
  pinterest_tag_enabled: boolean;
  pinterest_tag_id: string;
  linkedin_insight_enabled: boolean;
  linkedin_partner_id: string;
  seo_global_title: string;
  seo_global_description: string;
  seo_og_image: string;
  robots_enabled: boolean;
  sitemap_enabled: boolean;
  schema_enabled: boolean;
  events: MarketingEvent[];
  utm_builder_enabled: boolean;
  automation_webhooks_enabled: boolean;
  webhook_url: string;
  whatsapp_button_url: string;
  instagram_button_url: string;
  public_button_links: MarketingPublicButtonLink[];
  updated_at: string;
}

export function defaultMarketingSettings(): MarketingSettings {
  return {
    analytics_enabled: false, ga4_measurement_id: "", gtm_container_id: "", google_search_console_id: "", microsoft_clarity_id: "",
    meta_pixel_enabled: false, meta_pixel_id: "", meta_conversion_api_enabled: false, meta_access_token: "", meta_dataset_id: "",
    tiktok_pixel_enabled: false, tiktok_pixel_id: "", pinterest_tag_enabled: false, pinterest_tag_id: "", linkedin_insight_enabled: false, linkedin_partner_id: "",
    seo_global_title: "", seo_global_description: "", seo_og_image: "", robots_enabled: true, sitemap_enabled: true, schema_enabled: true,
    events: ["page_view", "contact_form", "click_whatsapp", "click_instagram"],
    utm_builder_enabled: false, automation_webhooks_enabled: false, webhook_url: "", whatsapp_button_url: "", instagram_button_url: "", public_button_links: [
      { id: "whatsapp", label: "WhatsApp", url: "", eventName: "click_whatsapp" },
      { id: "instagram", label: "Instagram", url: "", eventName: "click_instagram" },
    ], updated_at: new Date().toISOString(),
  };
}

/* ── Marketing Campaigns (UTM) ── */
export const MARKETING_CAMPAIGN_STATUSES = ["draft", "active", "paused", "finished", "archived"] as const;
export type MarketingCampaignStatus = (typeof MARKETING_CAMPAIGN_STATUSES)[number];

export interface MarketingCampaign {
  id: string;
  name: string;
  slug: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
  destination_url: string;
  generated_url: string;
  start_date: string;
  end_date: string;
  status: MarketingCampaignStatus;
  notes: string;
  created_at: string;
  updated_at: string;
}

/* ── Marketing Event Types ── */
export const MARKETING_EVENT_CATEGORIES = ["conversion", "engagement", "navigation", "commerce", "content"] as const;
export type MarketingEventCategory = (typeof MARKETING_EVENT_CATEGORIES)[number];

export interface MarketingEventType {
  id: string;
  name: string;
  label: string;
  description: string;
  category: MarketingEventCategory;
  is_active: boolean;
  last_triggered_at: string;
  created_at: string;
  updated_at: string;
}

/* ── Marketing Event Logs ── */
export interface MarketingEventLog {
  id: string;
  event_id: string;
  event_name: string;
  page_url: string;
  page_title: string;
  content_type: string;
  content_id: string;
  campaign_id: string;
  source: string;
  medium: string;
  device: string;
  country: string;
  city: string;
  metadata: Record<string, unknown>;
  occurred_at: string;
  created_at: string;
}

/* ── Marketing Page Metrics ── */
export const MARKETING_CONTENT_TYPES = ["home", "page", "class", "workshop", "experience", "gift_card", "product", "blog_post"] as const;
export type MarketingContentType = (typeof MARKETING_CONTENT_TYPES)[number];

export interface MarketingPageMetric {
  id: string;
  page_path: string;
  page_title: string;
  content_type: MarketingContentType;
  content_id: string;
  date: string;
  views: number;
  active_users: number;
  new_users: number;
  sessions: number;
  engagement_rate: number;
  average_engagement_time: number;
  bounce_rate: number;
  conversions: number;
  cta_clicks: number;
  whatsapp_clicks: number;
  form_submissions: number;
  created_at: string;
  updated_at: string;
}

/* ── Marketing Traffic Sources ── */
export interface MarketingTrafficSource {
  id: string;
  date: string;
  source: string;
  medium: string;
  campaign: string;
  sessions: number;
  users: number;
  new_users: number;
  conversions: number;
  created_at: string;
  updated_at: string;
}

/* ── Marketing Conversions ── */
export const MARKETING_CONVERSION_TYPES = [
  "whatsapp_click", "form_submit", "booking_click",
  "purchase", "gift_card_purchase", "newsletter_signup", "email_click",
] as const;
export type MarketingConversionType = (typeof MARKETING_CONVERSION_TYPES)[number];

export interface MarketingConversion {
  id: string;
  conversion_type: MarketingConversionType;
  page_url: string;
  page_title: string;
  content_type: MarketingContentType;
  content_id: string;
  campaign_id: string;
  source: string;
  medium: string;
  value: number;
  currency: string;
  metadata: Record<string, unknown>;
  occurred_at: string;
  created_at: string;
}

/* ── Marketing Reports ── */
export const MARKETING_REPORT_TYPES = ["weekly", "monthly", "campaign", "page", "seo", "conversion"] as const;
export const MARKETING_REPORT_STATUSES = ["pending", "generating", "ready", "failed"] as const;
export type MarketingReportType = (typeof MARKETING_REPORT_TYPES)[number];
export type MarketingReportStatus = (typeof MARKETING_REPORT_STATUSES)[number];

export interface MarketingReport {
  id: string;
  name: string;
  type: MarketingReportType;
  date_from: string;
  date_to: string;
  file_url: string;
  status: MarketingReportStatus;
  generated_at: string;
  created_at: string;
  updated_at: string;
}

/* ── Marketing Search Console ── */
export interface MarketingSearchConsoleQuery {
  id: string;
  date: string;
  query: string;
  page: string;
  country: string;
  device: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface MarketingSearchConsolePage {
  id: string;
  date: string;
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface MarketingSearchConsoleSummary {
  id: string;
  date: string;
  total_clicks: number;
  total_impressions: number;
  average_ctr: number;
  average_position: number;
  created_at: string;
  updated_at: string;
}

/* ── Marketing SEO Audit ── */
export const MARKETING_SEO_STATUSES = ["ok", "incomplete", "review", "error", "pending"] as const;
export const MARKETING_SLUG_STATUSES = ["ok", "duplicate", "missing", "too_long", "review"] as const;
export type MarketingSeoStatus = (typeof MARKETING_SEO_STATUSES)[number];
export type MarketingSlugStatus = (typeof MARKETING_SLUG_STATUSES)[number];

export interface MarketingSeoAudit {
  id: string;
  content_id?: string;
  edit_url?: string;
  page_url: string;
  page_title: string;
  content_type: MarketingContentType;
  meta_title: string;
  meta_description: string;
  og_image: string;
  canonical_url: string;
  is_indexable: boolean;
  has_meta_title: boolean;
  has_meta_description: boolean;
  has_og_image: boolean;
  has_canonical: boolean;
  slug_status: MarketingSlugStatus;
  seo_status: MarketingSeoStatus;
  issues: string[];
  recommendations: string[];
  last_checked_at: string;
  created_at: string;
  updated_at: string;
}

/* ── Legal Settings ── */
export const COOKIE_CATEGORIES = ["necessary", "analytics", "marketing", "functional"] as const;
export type CookieCategory = (typeof COOKIE_CATEGORIES)[number];

export const DEFAULT_PRIVACY_POLICY_MARKDOWN = `En **Casa Rosier** tratamos tus datos personales con cuidado, responsabilidad y <u>transparencia</u>. Esta política explica qué información podemos recopilar cuando navegas por la web, escribes desde un formulario, reservas una experiencia o realizas una compra, para qué la usamos y cómo puedes ejercer tus derechos.

## 1. Responsable del tratamiento

El responsable del tratamiento es **Casa Rosier**, proyecto vinculado a experiencias, clases, contenidos y piezas de cerámica en Barcelona.

Para cualquier consulta relacionada con privacidad puedes escribirnos a través de los formularios de contacto disponibles en esta web o por los canales publicados en el sitio.

## 2. Datos personales que podemos tratar

Podemos tratar los datos que nos facilitas directamente y los datos técnicos necesarios para que la web funcione correctamente:

- **Datos identificativos y de contacto:** nombre, correo electrónico, teléfono y cualquier información incluida en el mensaje enviado.
- **Datos de reservas, compras o solicitudes:** actividad seleccionada, fecha, número de personas, preferencias, observaciones y datos necesarios para gestionar la relación contigo.
- **Datos de navegación y uso:** páginas visitadas, preferencias de cookies, idioma, dispositivo, navegador y datos técnicos asociados al funcionamiento del sitio.
- **Comunicaciones:** mensajes recibidos, respuestas enviadas y seguimiento necesario para atender tu solicitud.

## 3. Finalidades del tratamiento

Usamos tus datos para las siguientes finalidades:

- **Responder consultas** enviadas desde formularios, correo o canales de contacto.
- **Gestionar reservas, compras, gift cards, clases, workshops y experiencias** solicitadas por la persona usuaria.
- **Prestar atención al cliente** y enviar comunicaciones necesarias sobre una solicitud, reserva o compra.
- **Mantener la seguridad y el correcto funcionamiento** de la web, prevenir abusos y resolver incidencias técnicas.
- **Mejorar la experiencia del sitio** mediante analítica, siempre que corresponda y exista una base legal válida.
- **Enviar comunicaciones comerciales o de marketing** solo cuando exista consentimiento o una base legítima aplicable.

## 4. Base legal

El tratamiento de tus datos puede apoyarse en una o varias de estas bases:

- **Consentimiento**, cuando aceptas cookies no necesarias, envías voluntariamente un formulario o autorizas comunicaciones.
- **Ejecución de una relación contractual o precontractual**, cuando solicitas información, reservas una actividad o realizas una compra.
- **Interés legítimo**, para mantener la seguridad del sitio, responder comunicaciones ya iniciadas y mejorar nuestros servicios de forma proporcionada.
- **Obligación legal**, cuando debamos conservar información por motivos fiscales, contables, administrativos o de cumplimiento normativo.

## 5. Conservación de los datos

Conservaremos tus datos durante el tiempo necesario para cumplir la finalidad para la que fueron recogidos y, posteriormente, durante los plazos exigidos por la normativa aplicable.

Los datos vinculados a consultas se conservarán mientras sea necesario para atender la comunicación. Los datos de compras, reservas o facturación se conservarán durante los plazos legales correspondientes. Las preferencias de cookies se mantendrán durante el periodo definido en la configuración del sitio.

## 6. Destinatarios y encargados de tratamiento

No vendemos tus datos personales. Podremos compartirlos únicamente cuando sea necesario para prestar el servicio o cumplir obligaciones legales.

Esto puede incluir proveedores tecnológicos, alojamiento web, herramientas de gestión, servicios de comunicación, pasarelas de pago, asesoría administrativa o autoridades competentes cuando exista obligación legal.

Cuando trabajamos con proveedores, procuramos que actúen como encargados de tratamiento y apliquen medidas adecuadas de seguridad y confidencialidad.

## 7. Cookies y tecnologías similares

La web puede utilizar cookies técnicas necesarias para su funcionamiento y, si las aceptas, cookies analíticas, funcionales o de marketing.

Puedes aceptar, rechazar o configurar tus preferencias desde el banner de cookies o desde las opciones disponibles en el sitio. El uso de cookies no necesarias se realiza conforme a tu elección.

## 8. Derechos de las personas usuarias

Puedes ejercer tus derechos de <u>acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad</u>, así como retirar tu consentimiento cuando el tratamiento se base en él.

Para ejercerlos, contacta con **Casa Rosier** indicando el derecho que deseas ejercer y la información necesaria para identificar tu solicitud. Si consideras que el tratamiento no se ajusta a la normativa, también puedes presentar una reclamación ante la autoridad de control competente.

## 9. Seguridad

Aplicamos medidas técnicas y organizativas razonables para proteger los datos personales frente a accesos no autorizados, pérdida, alteración o uso indebido.

Aunque trabajamos para mantener un entorno seguro, ningún sistema es completamente infalible. Por eso recomendamos no enviar información sensible que no sea necesaria para gestionar tu solicitud.

## 10. Cambios en esta política

Podremos actualizar esta política para reflejar cambios legales, técnicos o de funcionamiento del sitio. La versión publicada en esta página será la vigente en cada momento.

Si los cambios son relevantes, procuraremos comunicarlos de forma visible en la web.`;

export interface LegalSettings {
  cookies_banner_enabled: boolean;
  cookies_banner_title: string;
  cookies_banner_text: string;
  accept_button_text: string;
  reject_button_text: string;
  preferences_button_text: string;
  analytics_consent_required: boolean;
  marketing_consent_required: boolean;
  functional_consent_required: boolean;
  privacy_policy_title: string;
  privacy_policy_content: string;
  cookies_policy_title: string;
  cookies_policy_content: string;
  legal_notice_title: string;
  legal_notice_content: string;
  terms_title: string;
  terms_content: string;
  purchase_terms_content: string;
  consent_mode_enabled: boolean;
  google_consent_mode_enabled: boolean;
  meta_consent_mode_enabled: boolean;
  updated_at: string;
}

export function defaultLegalSettings(): LegalSettings {
  return {
    cookies_banner_enabled: true,
    cookies_banner_title: "Este sitio utiliza cookies",
    cookies_banner_text: "Utilizamos cookies propias y de terceros para mejorar tu experiencia en nuestro sitio web.",
    accept_button_text: "Aceptar todas", reject_button_text: "Rechazar", preferences_button_text: "Preferencias",
    analytics_consent_required: true, marketing_consent_required: true, functional_consent_required: false,
    privacy_policy_title: "Políticas de privacidad", privacy_policy_content: DEFAULT_PRIVACY_POLICY_MARKDOWN,
    cookies_policy_title: "Política de Cookies", cookies_policy_content: "",
    legal_notice_title: "Aviso Legal", legal_notice_content: "",
    terms_title: "Términos y Condiciones", terms_content: "",
    purchase_terms_content: "",
    consent_mode_enabled: false, google_consent_mode_enabled: false, meta_consent_mode_enabled: false,
    updated_at: new Date().toISOString(),
  };
}

/* ── Redirect ── */
export const REDIRECT_TYPES = ["301", "302"] as const;
export const REDIRECT_STATUSES = ["active", "inactive", "deleted"] as const;
export type RedirectType = (typeof REDIRECT_TYPES)[number];
export type RedirectStatus = (typeof REDIRECT_STATUSES)[number];
export function isRedirectType(value: unknown): value is RedirectType { return typeof value === "string" && (REDIRECT_TYPES as readonly string[]).includes(value); }
export function isRedirectStatus(value: unknown): value is RedirectStatus { return typeof value === "string" && (REDIRECT_STATUSES as readonly string[]).includes(value); }

export interface Redirect {
  id: string;
  source_url: string;
  target_url: string;
  redirect_type: RedirectType;
  status: RedirectStatus;
  notes: string;
  hit_count: number;
  last_hit_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/* ── Internal Link ── */
export interface InternalLink {
  id: string;
  label: string;
  url: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/* ── History Log ── */
export const HISTORY_ACTIONS = ["create", "update", "publish", "unpublish", "archive", "trash", "restore", "delete_permanently", "duplicate", "login"] as const;
export type HistoryLogAction = (typeof HISTORY_ACTIONS)[number];
export function isHistoryLogAction(value: unknown): value is HistoryLogAction { return typeof value === "string" && (HISTORY_ACTIONS as readonly string[]).includes(value); }

export interface HistoryLog {
  id: string;
  user_id: string;
  user_email: string;
  action: HistoryLogAction;
  entity_type: string;
  entity_id: string;
  entity_title: string;
  old_data: unknown | null;
  new_data: unknown | null;
  created_at: string;
}

export const COMPONENT_SECTIONS = [
  "headers",
  "social-galleries",
  "testimonials",
  "footers",
  "promo-banners",
  "faqs",
  "teachers",
] as const;

export type ComponentSection = (typeof COMPONENT_SECTIONS)[number];

export interface LocalAdminSession {
  email: string;
  issuedAt: number;
  expiresAt: number;
}
