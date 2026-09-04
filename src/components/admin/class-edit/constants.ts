import { defaultContent } from "@/components/admin/class-content/defaultContent";
import { DEFAULT_RICH_TEXT_TYPOGRAPHY, DEFAULT_DESCRIPTION_TYPOGRAPHY } from "@/lib/cms/rich-text-typography";
import { DEFAULT_CALENDAR_UI, type ClassOfferingDetails } from "@/lib/cms/types";
import type { NavigationItem } from "@/data/types";
import type { ClassEditorPreviewChrome } from "@/lib/cms/class-editor-preview";
import type { PreviewDevice, TabKey } from "./types";

export const DEFAULT_HERO_IMAGE = "/img/hero-bg.jpg";
export const MAX_CALENDAR_LABELS = 6;
export const MAX_GALLERY_IMAGES = 8;
export const FORM_ID = "class-edit-form";
export const SEO_MAX_TITLE_LENGTH = 70;
export const SEO_MAX_DESCRIPTION_LENGTH = 160;

export const MONTH_OPTIONS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export const WEEKDAY_LABELS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
export const YEAR_OPTIONS = Array.from({ length: 101 }, (_, index) => 2000 + index);

export const DEFAULT_CALENDAR_LABELS_TITLE = "PRÓXIMAS FECHAS DEL WORKSHOP";
export const DEFAULT_CALENDAR_LABELS_DESCRIPTION =
  "Consulta las próximas fechas disponibles del workshop durante el año y elige la edición que mejor se adapte a tu calendario. Cada convocatoria incluye información sobre horarios, plazas disponibles y detalles de reserva.";

export const DEFAULT_DETAIL_QUESTION =
  "Te apasiona la creatividad y deseas explorar el mundo de la ceramica?";

export const CLASS_EDIT_TABS: { key: TabKey; label: string }[] = [
  { key: "hero", label: "Hero" },
  { key: "home", label: "Tarjeta para Home" },
  { key: "basic", label: "Página detallada" },
  { key: "seo", label: "SEO" },
  { key: "additions", label: "Adiciones" },
  { key: "preview", label: "Vista previa" },
];

export const DETAIL_PAGE_SECTIONS = [
  {
    key: "basic-info",
    label: "Información",
    description: "Título, slug, textos y contacto",
    icon: "article",
    group: "general",
  },
  {
    key: "cta",
    label: "Botones CTA",
    description: "Consultar e inscribirme",
    icon: "smart_button",
    group: "general",
  },
  {
    key: "pricing",
    label: "Precios",
    description: "Opciones y tarifas",
    icon: "payments",
    group: "general",
  },
  {
    key: "schedule",
    label: "Horario",
    description: "Horarios en texto",
    icon: "schedule",
    group: "public",
  },
  {
    key: "calendar",
    label: "Calendario",
    description: "Fechas destacadas",
    icon: "calendar_month",
    group: "public",
  },
  {
    key: "media",
    label: "Video e incluye",
    description: "Multimedia y beneficios",
    icon: "perm_media",
    group: "public",
  },
  {
    key: "gallery",
    label: "Galería",
    description: "Imágenes del producto",
    icon: "photo_library",
    group: "public",
  },
  {
    key: "content",
    label: "Contenido extra",
    description: "Módulos y secciones",
    icon: "library_books",
    group: "public",
  },
] as const satisfies ReadonlyArray<{
  key: import("./types").DetailPageSectionKey;
  label: string;
  description: string;
  icon: string;
  group: "general" | "public";
}>;

export const PREVIEW_DEVICES: Array<{ key: PreviewDevice; label: string; width: number }> = [
  { key: "phone", label: "Teléfono", width: 390 },
  { key: "tablet", label: "Tablet", width: 768 },
  { key: "desktop", label: "Desktop", width: 1180 },
];

export const PREVIEW_NAVIGATION_ITEMS: NavigationItem[] = [
  { label: "Inicio", href: "/#hero", order: 0, visible: true },
  { label: "Clases", href: "/clases", order: 1, visible: true, children: [] },
  { label: "Workshops", href: "/workshops", order: 2, visible: true, children: [] },
  { label: "Experiencias", href: "/experiencias", order: 3, visible: true, children: [] },
  { label: "Gift Cards", href: "/gift-cards", order: 4, visible: true, children: [] },
  {
    label: "El Estudio",
    href: "/el-estudio",
    order: 5,
    visible: true,
    children: [
      { label: "El Estudio", href: "/el-estudio", order: 0, visible: true },
      { label: "Bitácora", href: "/blog", order: 1, visible: true },
    ],
  },
  { label: "Shop", href: "/shop", order: 6, visible: true },
];

export const FALLBACK_PREVIEW_CHROME: ClassEditorPreviewChrome = {
  navigationItems: PREVIEW_NAVIGATION_ITEMS,
  menuSettings: {
    header_logo_url: "/img/logo-header.png",
    scroll_menu_background_color: "#8c7457",
    scroll_menu_text_color: "#fff9f1",
    scroll_menu_icon_color: "#fff9f1",
    scroll_menu_logo_tint_enabled: false,
    scroll_menu_logo_tint_color: "#fff9f1",
  },
  socialGallery: null,
  footer: null,
  footerContactForm: null,
  siteContact: {
    email: "",
    phone: "",
    whatsapp: "",
    address: "",
    city: "",
    country: "",
    map_url: "",
  },
};

export const defaultClassDetails: ClassOfferingDetails = {
  menuTitle: "",
  heroVariant: "text",
  heroTitle: "",
  heroSubtitle: "",
  heroPresentationText: "",
  heroPresentationSubtitle: "",
  heroPresentationTextTypography: { ...DEFAULT_RICH_TEXT_TYPOGRAPHY },
  heroPresentationSubtitleTypography: { ...DEFAULT_RICH_TEXT_TYPOGRAPHY, fontSize: 22 },
  heroPresentationTextColor: "#FFFFFF",
  heroPresentationImage: "",
  heroPresentationCtaEnabled: false,
  heroPresentationCtaLabel: "Descubrir",
  heroPresentationCtaHref: "",
  heroPresentationCtaNewTab: false,
  heroPresentationCtaBackgroundColor: "#FFFFFF",
  heroPresentationCtaTextColor: "#3f3933",
  heroMenuTone: "dark",
  heroMenuColor: "#3f3933",
  heroMenuScale: 1,
  heroLogoPositionX: "50%",
  heroLogoPositionY: "46px",
  heroLogoWidth: "118px",
  heroLogoTabletPositionX: "50%",
  heroLogoTabletPositionY: "42px",
  heroLogoTabletWidth: "106px",
  heroLogoMobilePositionX: "50%",
  heroLogoMobilePositionY: "34px",
  heroLogoMobileWidth: "92px",
  heroMenuPositionY: "132px",
  heroMenuTabletPositionY: "118px",
  heroMenuMobilePositionY: "96px",
  ctaHref: "",
  ctaConsultHref: "",
  ctaEnrollHref: "",
  ctaConsultLabel: "",
  ctaEnrollLabel: "",
  showConsultCta: true,
  showEnrollCta: true,
  detailQuestion: DEFAULT_DETAIL_QUESTION,
  highlightDescription: "",
  subtitleTypography: { ...DEFAULT_RICH_TEXT_TYPOGRAPHY },
  detailQuestionTypography: { ...DEFAULT_RICH_TEXT_TYPOGRAPHY },
  highlightDescriptionTypography: { ...DEFAULT_RICH_TEXT_TYPOGRAPHY },
  descriptionTypography: { ...DEFAULT_DESCRIPTION_TYPOGRAPHY },
homeCard: {
    image: "",
    imageAlt: "",
    showEyebrow: true,
    eyebrow: "",
    eyebrowTypography: { ...DEFAULT_RICH_TEXT_TYPOGRAPHY, fontSize: 14 },
    title: "",
    titleTypography: { ...DEFAULT_RICH_TEXT_TYPOGRAPHY, fontSize: 26 },
    tagline: "",
    taglineTypography: { ...DEFAULT_RICH_TEXT_TYPOGRAPHY, fontSize: 21 },
    excerpt: "",
    excerptTypography: { ...DEFAULT_DESCRIPTION_TYPOGRAPHY },
    ctaLabel: "ver más",
  },
  homeExcerpt: "",
  durationText: "",
  durationSectionTitle: "Duración",
  showDurationSectionTitle: true,
  scheduleLabel: "Horario",
  whatsappNumber: "",
  scheduleDescription: "",
  showScheduleOnFrontend: true,
  scheduleDays: [],
  showCalendarLabels: false,
  calendarLabelsTitle: DEFAULT_CALENDAR_LABELS_TITLE,
  calendarLabelsDescription: DEFAULT_CALENDAR_LABELS_DESCRIPTION,
  calendarLabels: [],
  calendarUi: DEFAULT_CALENDAR_UI,
  priceSectionTitle: "Precio",
  menuPlacement: ["classes"],
  homeSections: [],
  heroImage: DEFAULT_HERO_IMAGE,
  heroImageMobile: "",
  heroVideoUrl: "",
  heroVideoUrlMobile: "",
  heroVideoPoster: "",
  heroMediaPositionX: "50%",
  heroMediaPositionY: "50%",
  heroMediaScale: 1,
  heroMediaTabletPositionX: "50%",
  heroMediaTabletPositionY: "50%",
  heroMediaTabletScale: 1,
  heroMediaMobilePositionX: "50%",
  heroMediaMobilePositionY: "50%",
  heroMediaMobileScale: 1,
  titleImage: "",
  titleImageSecondary: "",
  titleImageScale: 1,
  titleImageScaleTablet: 1,
  titleImageScaleMobile: 1,
  titleImagePositionX: "50%",
  titleImagePositionY: "50%",
  titleImagePositionXTablet: "50%",
  titleImagePositionYTablet: "50%",
  titleImagePositionXMobile: "50%",
  titleImagePositionYMobile: "50%",
  titleImageSecondaryScale: 1,
  titleImageSecondaryScaleTablet: 1,
  titleImageSecondaryScaleMobile: 1,
  titleImageSecondaryPositionX: "50%",
  titleImageSecondaryPositionY: "50%",
  titleImageSecondaryPositionXTablet: "50%",
  titleImageSecondaryPositionYTablet: "50%",
  titleImageSecondaryPositionXMobile: "50%",
  titleImageSecondaryPositionYMobile: "50%",
  heroTitlePositionX: "50%",
  heroTitlePositionXTablet: "50%",
  heroTitlePositionXMobile: "50%",
  heroTitlePositionY: "50%",
  heroTitlePositionYTablet: "50%",
  heroTitlePositionYMobile: "50%",
  heroTitleScale: 1,
  heroTitleScaleTablet: 1,
  heroTitleScaleMobile: 1,
  presentationTextPositionX: "8%",
  presentationTextPositionY: "50%",
  presentationTextPositionXTablet: "8%",
  presentationTextPositionYTablet: "50%",
  presentationTextPositionXMobile: "8%",
  presentationTextPositionYMobile: "50%",
  presentationTextScale: 1,
  presentationTextScaleTablet: 1,
  presentationTextScaleMobile: 1,
  presentationImagePositionX: "70%",
  presentationImagePositionY: "50%",
  presentationImagePositionXTablet: "70%",
  presentationImagePositionYTablet: "50%",
  presentationImagePositionXMobile: "70%",
  presentationImagePositionYMobile: "50%",
  presentationImageScale: 1,
  presentationImageScaleTablet: 1,
  presentationImageScaleMobile: 1,
  galleryImages: [],
  videoUrl: "",
  videoPoster: "",
  showIncludedSection: false,
  includedSectionTitle: "Incluye",
  includedItems: [],
  includedItemsTypography: { ...DEFAULT_RICH_TEXT_TYPOGRAPHY, fontSize: 16 },
  pricing: [],
  seoImage: "",
  showIdeaPromptSection: true,
  content: defaultContent(),
};
