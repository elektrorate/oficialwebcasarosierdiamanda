import { randomUUID } from "crypto";
import { deleteOfferingMediaAssets } from "./offering-media";
import { createAdminClient } from "../supabase/admin";
import { addTrashItem, getCurrentUserEmail, getTrashItemByEntity, removeTrashItem } from "./trash";
import { readJsonFile, writeJsonFile } from "./local-storage";
import { isOfferingStatus, isOfferingType } from "./types";
import type { ClassOfferingDetails, Offering, OfferingStatus, OfferingType } from "./types";
import { DEFAULT_RICH_TEXT_TYPOGRAPHY, normalizeRichTextTypography, type RichTextTypography } from "./rich-text-typography";
import type { Json } from "../supabase/types";
import { logAction } from "./history-logs";

const TABLE = "offerings";
const HERO_SETTINGS_TABLE = "offering_public_hero_settings";
const HOME_CARD_SETTINGS_TABLE = "offering_home_card_settings";
const DETAIL_TEXT_SETTINGS_TABLE = "offering_detail_text_settings";
const FILE_NAME = "offerings.json";
const SUPABASE_READ_TIMEOUT_MS = 1_500;
const OFFERINGS_CACHE_TTL_MS = 15_000;

let offeringsCache: { items: Offering[]; expiresAt: number } | null = null;

type OfferingInput = Partial<Omit<Offering, "id" | "created_at" | "updated_at" | "deleted_at">> & {
  id?: string;
  deleted_at?: string | null;
};

export type OfferingsPageOptions = {
  page?: number;
  pageSize?: number;
  q?: string;
  sort?: "recent" | "old";
  type?: "all" | OfferingType;
  status?: "all" | OfferingStatus | OfferingStatus[];
};

export type OfferingsPageResult = {
  items: Offering[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const OFFERING_LIST_SELECT = [
  "id",
  "type",
  "title",
  "slug",
  "subtitle",
  "excerpt",
  "price",
  "currency",
  "status",
  "featured",
  "duration",
  "cover_image_url",
  "created_at",
  "updated_at",
  "deleted_at",
].join(",");

function getCachedOfferings() {
  if (!offeringsCache || offeringsCache.expiresAt <= Date.now()) return null;
  return offeringsCache.items;
}

function cacheOfferings(items: Offering[]) {
  offeringsCache = { items, expiresAt: Date.now() + OFFERINGS_CACHE_TTL_MS };
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise.catch(() => fallback).finally(() => {
        if (timeout) clearTimeout(timeout);
      }),
      new Promise<T>((resolve) => {
        timeout = setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function uniqueSlug(items: Offering[], baseSlug: string, currentId?: string) {
  const taken = new Set(items.filter((item) => item.id !== currentId).map((item) => item.slug));
  if (!taken.has(baseSlug)) return baseSlug;
  let counter = 2;
  while (taken.has(`${baseSlug}-${counter}`)) counter++;
  return `${baseSlug}-${counter}`;
}

function duplicateSlugBase(slug: string, items: Offering[]) {
  const match = slug.match(/^(.*)-(\d+)$/);
  if (match?.[1] && items.some((item) => item.slug === match[1])) {
    return match[1];
  }
  return slug;
}

function normalizeTextArray(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string") return value.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);
  return [] as string[];
}

function normalizeDetails(value: unknown) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Offering["details"];
  return {};
}

function normalizeOffering(input: OfferingInput, existing?: Offering, allItems: Offering[] = []) {
  const title = String(input.title ?? existing?.title ?? "").trim();
  const rawSlug = String(input.slug ?? existing?.slug ?? "").trim();
  const slugBase = toSlug(rawSlug) || toSlug(title) || "offering";
  const slug = uniqueSlug(allItems, slugBase, existing?.id);
  const now = new Date().toISOString();
  const type = input.type ?? existing?.type;
  const status = input.status ?? existing?.status ?? "draft";

  if (!isOfferingType(type)) throw new Error("Tipo de offering no vÃ¡lido.");
  if (!isOfferingStatus(status)) throw new Error("Estado de offering no vÃ¡lido.");

  return {
    id: existing?.id ?? input.id ?? randomUUID(),
    type,
    title,
    slug,
    subtitle: String(input.subtitle ?? existing?.subtitle ?? "").trim(),
    excerpt: String(input.excerpt ?? existing?.excerpt ?? "").trim(),
    description: String(input.description ?? existing?.description ?? "").trim(),
    price: input.price === undefined ? existing?.price ?? null : input.price === null ? null : Number(input.price),
    currency: String(input.currency ?? existing?.currency ?? "USD").trim().toUpperCase() || "USD",
    status,
    featured: Boolean(input.featured ?? existing?.featured ?? false),
    header_id: input.header_id !== undefined ? (input.header_id || null) : existing?.header_id ?? null,
    duration: String(input.duration ?? existing?.duration ?? "").trim(),
    schedule: normalizeTextArray(input.schedule ?? existing?.schedule ?? []),
    teacher: String(input.teacher ?? existing?.teacher ?? "").trim(),
    capacity: input.capacity === undefined ? existing?.capacity ?? null : input.capacity === null ? null : Number(input.capacity),
    cover_image_url: String(input.cover_image_url ?? existing?.cover_image_url ?? "").trim(),
    gallery: normalizeTextArray(input.gallery ?? existing?.gallery ?? []),
    details: normalizeDetails(input.details ?? existing?.details ?? {}),
    seo_title: String(input.seo_title ?? existing?.seo_title ?? "").trim(),
    seo_description: String(input.seo_description ?? existing?.seo_description ?? "").trim(),
    created_at: existing?.created_at ?? now,
    updated_at: now,
    deleted_at: input.status === "deleted" ? existing?.deleted_at ?? now : input.deleted_at ?? existing?.deleted_at ?? null,
  } satisfies Offering;
}

function rowToOffering(row: Record<string, unknown>): Offering {
  const details = mergeDetailTextSettingsIntoDetails(
    mergeHomeCardSettingsIntoDetails(
      mergeHeroSettingsIntoDetails(normalizeDetails(row.details), row.public_hero_settings),
      row.home_card_settings,
    ),
    row.detail_text_settings,
  );
  return {
    ...row,
    schedule: Array.isArray(row.schedule) ? row.schedule : [],
    gallery: Array.isArray(row.gallery) ? row.gallery : [],
    details,
  } as Offering;
}

function offeringToRow(offering: Offering): Record<string, unknown> {
  const { ...rest } = offering;
  return {
    ...rest,
    schedule: rest.schedule as unknown as Json,
    gallery: rest.gallery as unknown as Json,
    details: rest.details as unknown as Json,
  };
}

function heroSettingsFromDetails(offering: Offering) {
  if (!["class", "workshop", "experience", "gift_card"].includes(offering.type)) return null;
  const details = normalizeDetails(offering.details);
  const classDetails = details.class && typeof details.class === "object" && !Array.isArray(details.class)
    ? details.class as Record<string, unknown>
    : {};
  const text = (value: unknown, fallback: string) => {
    const next = typeof value === "string" ? value.trim() : "";
    return next || fallback;
  };
  const num = (value: unknown, fallback: number) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };
  const scale = Number(classDetails.heroMenuScale);
  const heroVariant = ["image", "text", "presentation"].includes(String(classDetails.heroVariant)) ? String(classDetails.heroVariant) : "text";
  const heroMenuTone = ["light", "dark"].includes(String(classDetails.heroMenuTone)) ? String(classDetails.heroMenuTone) : heroVariant === "image" || heroVariant === "presentation" ? "light" : "dark";

  return {
    offering_id: offering.id,
    hero_variant: heroVariant,
    hero_menu_tone: heroMenuTone,
    hero_menu_color: text(classDetails.heroMenuColor, heroMenuTone === "light" ? "#ffffff" : "#3f3933"),
    hero_menu_scale: Number.isFinite(scale) && scale > 0 ? scale : 1,
    hero_logo_position_x: text(classDetails.heroLogoPositionX, "50%"),
    hero_logo_position_y: text(classDetails.heroLogoPositionY, "46px"),
    hero_logo_width: text(classDetails.heroLogoWidth, "118px"),
    hero_logo_tablet_position_x: text(classDetails.heroLogoTabletPositionX, text(classDetails.heroLogoPositionX, "50%")),
    hero_logo_tablet_position_y: text(classDetails.heroLogoTabletPositionY, text(classDetails.heroLogoPositionY, "42px")),
    hero_logo_tablet_width: text(classDetails.heroLogoTabletWidth, text(classDetails.heroLogoWidth, "106px")),
    hero_logo_mobile_position_x: text(classDetails.heroLogoMobilePositionX, text(classDetails.heroLogoPositionX, "50%")),
    hero_logo_mobile_position_y: text(classDetails.heroLogoMobilePositionY, "34px"),
    hero_logo_mobile_width: text(classDetails.heroLogoMobileWidth, "92px"),
    hero_menu_position_y: text(classDetails.heroMenuPositionY, "132px"),
    hero_menu_tablet_position_y: text(classDetails.heroMenuTabletPositionY, text(classDetails.heroMenuPositionY, "118px")),
    hero_menu_mobile_position_y: text(classDetails.heroMenuMobilePositionY, "96px"),
    title_image_scale: num(classDetails.titleImageScale, 1),
    title_image_scale_tablet: num(classDetails.titleImageScaleTablet, num(classDetails.titleImageScale, 1)),
    title_image_scale_mobile: num(classDetails.titleImageScaleMobile, num(classDetails.titleImageScale, 1)),
    title_image_position_x: text(classDetails.titleImagePositionX, "50%"),
    title_image_position_y: text(classDetails.titleImagePositionY, "50%"),
    title_image_position_x_tablet: text(classDetails.titleImagePositionXTablet, text(classDetails.titleImagePositionX, "50%")),
    title_image_position_y_tablet: text(classDetails.titleImagePositionYTablet, text(classDetails.titleImagePositionY, "50%")),
    title_image_position_x_mobile: text(classDetails.titleImagePositionXMobile, text(classDetails.titleImagePositionX, "50%")),
    title_image_position_y_mobile: text(classDetails.titleImagePositionYMobile, "50%"),
    title_image_secondary_scale: num(classDetails.titleImageSecondaryScale, 1),
    title_image_secondary_scale_tablet: num(classDetails.titleImageSecondaryScaleTablet, num(classDetails.titleImageSecondaryScale, 1)),
    title_image_secondary_scale_mobile: num(classDetails.titleImageSecondaryScaleMobile, num(classDetails.titleImageSecondaryScale, 1)),
    title_image_secondary_position_x: text(classDetails.titleImageSecondaryPositionX, "50%"),
    title_image_secondary_position_y: text(classDetails.titleImageSecondaryPositionY, "50%"),
    title_image_secondary_position_x_tablet: text(classDetails.titleImageSecondaryPositionXTablet, text(classDetails.titleImageSecondaryPositionX, "50%")),
    title_image_secondary_position_y_tablet: text(classDetails.titleImageSecondaryPositionYTablet, text(classDetails.titleImageSecondaryPositionY, "50%")),
    title_image_secondary_position_x_mobile: text(classDetails.titleImageSecondaryPositionXMobile, text(classDetails.titleImageSecondaryPositionX, "50%")),
    title_image_secondary_position_y_mobile: text(classDetails.titleImageSecondaryPositionYMobile, "50%"),
    hero_title_position_x: text(classDetails.heroTitlePositionX, "50%"),
    hero_title_position_x_tablet: text(classDetails.heroTitlePositionXTablet, text(classDetails.heroTitlePositionX, "50%")),
    hero_title_position_x_mobile: text(classDetails.heroTitlePositionXMobile, text(classDetails.heroTitlePositionX, "50%")),
    hero_title_position_y: text(classDetails.heroTitlePositionY, "50%"),
    hero_title_position_y_tablet: text(classDetails.heroTitlePositionYTablet, text(classDetails.heroTitlePositionY, "50%")),
    hero_title_position_y_mobile: text(classDetails.heroTitlePositionYMobile, "50%"),
    hero_title_scale: num(classDetails.heroTitleScale, 1),
    hero_title_scale_tablet: num(classDetails.heroTitleScaleTablet, num(classDetails.heroTitleScale, 1)),
    hero_title_scale_mobile: num(classDetails.heroTitleScaleMobile, num(classDetails.heroTitleScale, 1)),
    presentation_text_position_x: text(classDetails.presentationTextPositionX, "8%"),
    presentation_text_position_y: text(classDetails.presentationTextPositionY, "50%"),
    presentation_text_position_x_tablet: text(classDetails.presentationTextPositionXTablet, text(classDetails.presentationTextPositionX, "8%")),
    presentation_text_position_y_tablet: text(classDetails.presentationTextPositionYTablet, text(classDetails.presentationTextPositionY, "50%")),
    presentation_text_position_x_mobile: text(classDetails.presentationTextPositionXMobile, text(classDetails.presentationTextPositionX, "8%")),
    presentation_text_position_y_mobile: text(classDetails.presentationTextPositionYMobile, "50%"),
    presentation_text_scale: num(classDetails.presentationTextScale, 1),
    presentation_text_scale_tablet: num(classDetails.presentationTextScaleTablet, num(classDetails.presentationTextScale, 1)),
    presentation_text_scale_mobile: num(classDetails.presentationTextScaleMobile, num(classDetails.presentationTextScale, 1)),
    presentation_image_position_x: text(classDetails.presentationImagePositionX, "70%"),
    presentation_image_position_y: text(classDetails.presentationImagePositionY, "50%"),
    presentation_image_position_x_tablet: text(classDetails.presentationImagePositionXTablet, text(classDetails.presentationImagePositionX, "70%")),
    presentation_image_position_y_tablet: text(classDetails.presentationImagePositionYTablet, text(classDetails.presentationImagePositionY, "50%")),
    presentation_image_position_x_mobile: text(classDetails.presentationImagePositionXMobile, text(classDetails.presentationImagePositionX, "70%")),
    presentation_image_position_y_mobile: text(classDetails.presentationImagePositionYMobile, "50%"),
    presentation_image_scale: num(classDetails.presentationImageScale, 1),
    presentation_image_scale_tablet: num(classDetails.presentationImageScaleTablet, num(classDetails.presentationImageScale, 1)),
    presentation_image_scale_mobile: num(classDetails.presentationImageScaleMobile, num(classDetails.presentationImageScale, 1)),
    updated_at: offering.updated_at,
  };
}

function mergeHeroSettingsIntoDetails(details: Offering["details"], settings: unknown): Offering["details"] {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return details;
  const row = settings as Record<string, unknown>;
  const classDetails = details.class && typeof details.class === "object" && !Array.isArray(details.class)
    ? details.class as Record<string, unknown>
    : {};
  const numField = (key: string, fallback: unknown): number | undefined => {
    const v = row[key] ?? classDetails[key];
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback !== undefined ? Number(fallback) : undefined;
  };
  const nextClass = {
    ...classDetails,
    heroVariant: row.hero_variant ?? classDetails.heroVariant,
    heroMenuTone: row.hero_menu_tone ?? classDetails.heroMenuTone,
    heroMenuColor: row.hero_menu_color ?? classDetails.heroMenuColor,
    heroMenuScale: row.hero_menu_scale !== undefined ? Number(row.hero_menu_scale) : classDetails.heroMenuScale,
    heroLogoPositionX: row.hero_logo_position_x ?? classDetails.heroLogoPositionX,
    heroLogoPositionY: row.hero_logo_position_y ?? classDetails.heroLogoPositionY,
    heroLogoWidth: row.hero_logo_width ?? classDetails.heroLogoWidth,
    heroLogoTabletPositionX: row.hero_logo_tablet_position_x ?? classDetails.heroLogoTabletPositionX,
    heroLogoTabletPositionY: row.hero_logo_tablet_position_y ?? classDetails.heroLogoTabletPositionY,
    heroLogoTabletWidth: row.hero_logo_tablet_width ?? classDetails.heroLogoTabletWidth,
    heroLogoMobilePositionX: row.hero_logo_mobile_position_x ?? classDetails.heroLogoMobilePositionX,
    heroLogoMobilePositionY: row.hero_logo_mobile_position_y ?? classDetails.heroLogoMobilePositionY,
    heroLogoMobileWidth: row.hero_logo_mobile_width ?? classDetails.heroLogoMobileWidth,
    heroMenuPositionY: row.hero_menu_position_y ?? classDetails.heroMenuPositionY,
    heroMenuTabletPositionY: row.hero_menu_tablet_position_y ?? classDetails.heroMenuTabletPositionY,
    heroMenuMobilePositionY: row.hero_menu_mobile_position_y ?? classDetails.heroMenuMobilePositionY,
    titleImageScale: numField("title_image_scale", classDetails.titleImageScale),
    titleImageScaleTablet: numField("title_image_scale_tablet", classDetails.titleImageScaleTablet),
    titleImageScaleMobile: numField("title_image_scale_mobile", classDetails.titleImageScaleMobile),
    titleImagePositionX: row.title_image_position_x ?? classDetails.titleImagePositionX,
    titleImagePositionY: row.title_image_position_y ?? classDetails.titleImagePositionY,
    titleImagePositionXTablet: row.title_image_position_x_tablet ?? classDetails.titleImagePositionXTablet,
    titleImagePositionYTablet: row.title_image_position_y_tablet ?? classDetails.titleImagePositionYTablet,
    titleImagePositionXMobile: row.title_image_position_x_mobile ?? classDetails.titleImagePositionXMobile,
    titleImagePositionYMobile: row.title_image_position_y_mobile ?? classDetails.titleImagePositionYMobile,
    titleImageSecondaryScale: numField("title_image_secondary_scale", classDetails.titleImageSecondaryScale),
    titleImageSecondaryScaleTablet: numField("title_image_secondary_scale_tablet", classDetails.titleImageSecondaryScaleTablet),
    titleImageSecondaryScaleMobile: numField("title_image_secondary_scale_mobile", classDetails.titleImageSecondaryScaleMobile),
    titleImageSecondaryPositionX: row.title_image_secondary_position_x ?? classDetails.titleImageSecondaryPositionX,
    titleImageSecondaryPositionY: row.title_image_secondary_position_y ?? classDetails.titleImageSecondaryPositionY,
    titleImageSecondaryPositionXTablet: row.title_image_secondary_position_x_tablet ?? classDetails.titleImageSecondaryPositionXTablet,
    titleImageSecondaryPositionYTablet: row.title_image_secondary_position_y_tablet ?? classDetails.titleImageSecondaryPositionYTablet,
    titleImageSecondaryPositionXMobile: row.title_image_secondary_position_x_mobile ?? classDetails.titleImageSecondaryPositionXMobile,
    titleImageSecondaryPositionYMobile: row.title_image_secondary_position_y_mobile ?? classDetails.titleImageSecondaryPositionYMobile,
    heroTitlePositionX: row.hero_title_position_x ?? classDetails.heroTitlePositionX,
    heroTitlePositionXTablet: row.hero_title_position_x_tablet ?? classDetails.heroTitlePositionXTablet,
    heroTitlePositionXMobile: row.hero_title_position_x_mobile ?? classDetails.heroTitlePositionXMobile,
    heroTitlePositionY: row.hero_title_position_y ?? classDetails.heroTitlePositionY,
    heroTitlePositionYTablet: row.hero_title_position_y_tablet ?? classDetails.heroTitlePositionYTablet,
    heroTitlePositionYMobile: row.hero_title_position_y_mobile ?? classDetails.heroTitlePositionYMobile,
    heroTitleScale: numField("hero_title_scale", classDetails.heroTitleScale),
    heroTitleScaleTablet: numField("hero_title_scale_tablet", classDetails.heroTitleScaleTablet),
    heroTitleScaleMobile: numField("hero_title_scale_mobile", classDetails.heroTitleScaleMobile),
    presentationTextPositionX: row.presentation_text_position_x ?? classDetails.presentationTextPositionX,
    presentationTextPositionY: row.presentation_text_position_y ?? classDetails.presentationTextPositionY,
    presentationTextPositionXTablet: row.presentation_text_position_x_tablet ?? classDetails.presentationTextPositionXTablet,
    presentationTextPositionYTablet: row.presentation_text_position_y_tablet ?? classDetails.presentationTextPositionYTablet,
    presentationTextPositionXMobile: row.presentation_text_position_x_mobile ?? classDetails.presentationTextPositionXMobile,
    presentationTextPositionYMobile: row.presentation_text_position_y_mobile ?? classDetails.presentationTextPositionYMobile,
    presentationTextScale: numField("presentation_text_scale", classDetails.presentationTextScale),
    presentationTextScaleTablet: numField("presentation_text_scale_tablet", classDetails.presentationTextScaleTablet),
    presentationTextScaleMobile: numField("presentation_text_scale_mobile", classDetails.presentationTextScaleMobile),
    presentationImagePositionX: row.presentation_image_position_x ?? classDetails.presentationImagePositionX,
    presentationImagePositionY: row.presentation_image_position_y ?? classDetails.presentationImagePositionY,
    presentationImagePositionXTablet: row.presentation_image_position_x_tablet ?? classDetails.presentationImagePositionXTablet,
    presentationImagePositionYTablet: row.presentation_image_position_y_tablet ?? classDetails.presentationImagePositionYTablet,
    presentationImagePositionXMobile: row.presentation_image_position_x_mobile ?? classDetails.presentationImagePositionXMobile,
    presentationImagePositionYMobile: row.presentation_image_position_y_mobile ?? classDetails.presentationImagePositionYMobile,
    presentationImageScale: numField("presentation_image_scale", classDetails.presentationImageScale),
    presentationImageScaleTablet: numField("presentation_image_scale_tablet", classDetails.presentationImageScaleTablet),
    presentationImageScaleMobile: numField("presentation_image_scale_mobile", classDetails.presentationImageScaleMobile),
  } as Partial<ClassOfferingDetails>;
  return { ...details, class: nextClass };
}

function homeCardFromClassDetails(classDetails: Record<string, unknown>) {
  const homeCard = classDetails.homeCard && typeof classDetails.homeCard === "object" && !Array.isArray(classDetails.homeCard)
    ? classDetails.homeCard as Record<string, unknown>
    : {};
  const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
  const typographySource = homeCard.excerptTypography;
  const typography = normalizeRichTextTypography(typographySource);

  return {
    image: text(homeCard.image),
    image_alt: text(homeCard.imageAlt),
    eyebrow: text(homeCard.eyebrow),
    title: text(homeCard.title),
    excerpt: text(homeCard.excerpt) || text(classDetails.homeExcerpt),
    excerpt_font_size: typography.fontSize,
    excerpt_font_weight: typography.weight,
    excerpt_font_width: typography.width,
    excerpt_italic: typography.italic,
  };
}

function homeCardSettingsFromDetails(offering: Offering) {
  if (!["class", "workshop", "experience", "gift_card"].includes(offering.type)) return null;
  const details = normalizeDetails(offering.details);
  const classDetails = details.class && typeof details.class === "object" && !Array.isArray(details.class)
    ? details.class as Record<string, unknown>
    : {};

  return {
    offering_id: offering.id,
    ...homeCardFromClassDetails(classDetails),
    updated_at: offering.updated_at,
  };
}

function mergeHomeCardSettingsIntoDetails(details: Offering["details"], settings: unknown): Offering["details"] {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return details;
  const row = settings as Record<string, unknown>;
  const classDetails = details.class && typeof details.class === "object" && !Array.isArray(details.class)
    ? details.class as Record<string, unknown>
    : {};
  const existingHomeCard = classDetails.homeCard && typeof classDetails.homeCard === "object" && !Array.isArray(classDetails.homeCard)
    ? classDetails.homeCard as Record<string, unknown>
    : {};
  const text = (key: string, fallback = "") => {
    const value = row[key];
    return typeof value === "string" ? value : fallback;
  };
  const num = (key: string, fallback: number) => {
    const value = Number(row[key]);
    return Number.isFinite(value) ? value : fallback;
  };
  const excerptTypography = normalizeRichTextTypography({
    fontSize: num("excerpt_font_size", Number(existingHomeCard.excerptTypography && typeof existingHomeCard.excerptTypography === "object" ? (existingHomeCard.excerptTypography as Record<string, unknown>).fontSize : 28) || 28),
    weight: num("excerpt_font_weight", Number(existingHomeCard.excerptTypography && typeof existingHomeCard.excerptTypography === "object" ? (existingHomeCard.excerptTypography as Record<string, unknown>).weight : 400) || 400),
    width: num("excerpt_font_width", Number(existingHomeCard.excerptTypography && typeof existingHomeCard.excerptTypography === "object" ? (existingHomeCard.excerptTypography as Record<string, unknown>).width : 100) || 100),
    italic: typeof row.excerpt_italic === "boolean" ? row.excerpt_italic : Boolean(existingHomeCard.excerptTypography && typeof existingHomeCard.excerptTypography === "object" ? (existingHomeCard.excerptTypography as Record<string, unknown>).italic : false),
  });
  const homeCard = {
    // The normalized JSON details contain the CMS-only presentation controls
    // (visibility flags and the complete typography settings). Preserve them
    // when the legacy home_card_settings row contributes its text fields.
    ...existingHomeCard,
    image: text("image", String(existingHomeCard.image ?? "")),
    imageAlt: text("image_alt", String(existingHomeCard.imageAlt ?? "")),
    eyebrow: text("eyebrow", String(existingHomeCard.eyebrow ?? "")),
    title: text("title", String(existingHomeCard.title ?? "")),
    excerpt: text("excerpt", String(existingHomeCard.excerpt ?? classDetails.homeExcerpt ?? "")),
    excerptTypography,
  };
  const nextClass = {
    ...classDetails,
    homeCard,
    homeExcerpt: homeCard.excerpt,
  } as Partial<ClassOfferingDetails>;
  return { ...details, class: nextClass };
}

function typographyFromRow(row: Record<string, unknown>, prefix: string, fallback: RichTextTypography): RichTextTypography {
  return normalizeRichTextTypography({
    fontSize: Number(row[`${prefix}_font_size`]),
    weight: Number(row[`${prefix}_font_weight`]),
    width: Number(row[`${prefix}_font_width`]),
    italic: typeof row[`${prefix}_italic`] === "boolean" ? row[`${prefix}_italic`] : fallback.italic,
  });
}

function detailTextSettingsFromDetails(offering: Offering) {
  if (!["class", "workshop", "experience", "gift_card"].includes(offering.type)) return null;
  const details = normalizeDetails(offering.details);
  const classDetails = details.class && typeof details.class === "object" && !Array.isArray(details.class)
    ? details.class as Record<string, unknown>
    : {};

  const subtitleTypography = normalizeRichTextTypography(classDetails.subtitleTypography);
  const detailQuestionTypography = normalizeRichTextTypography(classDetails.detailQuestionTypography);
  const highlightTypography = normalizeRichTextTypography(classDetails.highlightDescriptionTypography);
  const descriptionTypography = normalizeRichTextTypography(
    classDetails.descriptionTypography ?? { ...DEFAULT_RICH_TEXT_TYPOGRAPHY, fontSize: 18 },
  );

  return {
    offering_id: offering.id,
    subtitle_font_size: subtitleTypography.fontSize,
    subtitle_font_weight: subtitleTypography.weight,
    subtitle_font_width: subtitleTypography.width,
    subtitle_italic: subtitleTypography.italic,
    detail_question_font_size: detailQuestionTypography.fontSize,
    detail_question_font_weight: detailQuestionTypography.weight,
    detail_question_font_width: detailQuestionTypography.width,
    detail_question_italic: detailQuestionTypography.italic,
    highlight_font_size: highlightTypography.fontSize,
    highlight_font_weight: highlightTypography.weight,
    highlight_font_width: highlightTypography.width,
    highlight_italic: highlightTypography.italic,
    description_font_size: descriptionTypography.fontSize,
    description_font_weight: descriptionTypography.weight,
    description_font_width: descriptionTypography.width,
    description_italic: descriptionTypography.italic,
    updated_at: offering.updated_at,
  };
}

function mergeDetailTextSettingsIntoDetails(details: Offering["details"], settings: unknown): Offering["details"] {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return details;
  const row = settings as Record<string, unknown>;
  const classDetails = details.class && typeof details.class === "object" && !Array.isArray(details.class)
    ? details.class as Record<string, unknown>
    : {};

  const nextClass = {
    ...classDetails,
    subtitleTypography: typographyFromRow(row, "subtitle", normalizeRichTextTypography(classDetails.subtitleTypography)),
    detailQuestionTypography: typographyFromRow(row, "detail_question", normalizeRichTextTypography(classDetails.detailQuestionTypography)),
    highlightDescriptionTypography: typographyFromRow(row, "highlight", normalizeRichTextTypography(classDetails.highlightDescriptionTypography)),
    descriptionTypography: typographyFromRow(
      row,
      "description",
      normalizeRichTextTypography(classDetails.descriptionTypography ?? { fontSize: 18 }),
    ),
  } as Partial<ClassOfferingDetails>;

  return { ...details, class: nextClass };
}

async function readHomeCardSettingsMap(ids: string[]) {
  if (ids.length === 0) return new Map<string, Record<string, unknown>>();
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from(HOME_CARD_SETTINGS_TABLE).select("*").in("offering_id", ids);
    if (error || !data) return new Map<string, Record<string, unknown>>();
    return new Map((data as Array<Record<string, unknown>>).map((item) => [String(item.offering_id), item]));
  } catch {
    return new Map<string, Record<string, unknown>>();
  }
}

async function readOneHomeCardSettings(id: string) {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from(HOME_CARD_SETTINGS_TABLE).select("*").eq("offering_id", id).maybeSingle();
    if (error || !data) return null;
    return data as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function syncHomeCardSettingsToSupabase(item: Offering): Promise<void> {
  const row = homeCardSettingsFromDetails(item);
  if (!row) return;
  try {
    const supabase = createAdminClient();
    await supabase.from(HOME_CARD_SETTINGS_TABLE).upsert(row, { onConflict: "offering_id" });
  } catch { /* best-effort until the migration exists in every environment */ }
}

async function readDetailTextSettingsMap(ids: string[]) {
  if (ids.length === 0) return new Map<string, Record<string, unknown>>();
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from(DETAIL_TEXT_SETTINGS_TABLE).select("*").in("offering_id", ids);
    if (error || !data) return new Map<string, Record<string, unknown>>();
    return new Map((data as Array<Record<string, unknown>>).map((item) => [String(item.offering_id), item]));
  } catch {
    return new Map<string, Record<string, unknown>>();
  }
}

async function readOneDetailTextSettings(id: string) {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from(DETAIL_TEXT_SETTINGS_TABLE).select("*").eq("offering_id", id).maybeSingle();
    if (error || !data) return null;
    return data as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function syncDetailTextSettingsToSupabase(item: Offering): Promise<void> {
  const row = detailTextSettingsFromDetails(item);
  if (!row) return;
  try {
    const supabase = createAdminClient();
    await supabase.from(DETAIL_TEXT_SETTINGS_TABLE).upsert(row, { onConflict: "offering_id" });
  } catch { /* best-effort until the migration exists in every environment */ }
}

async function readHeroSettingsMap(ids: string[]) {
  if (ids.length === 0) return new Map<string, Record<string, unknown>>();
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from(HERO_SETTINGS_TABLE).select("*").in("offering_id", ids);
    if (error || !data) return new Map<string, Record<string, unknown>>();
    return new Map((data as Array<Record<string, unknown>>).map((item) => [String(item.offering_id), item]));
  } catch {
    return new Map<string, Record<string, unknown>>();
  }
}

async function readOneHeroSettings(id: string) {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from(HERO_SETTINGS_TABLE).select("*").eq("offering_id", id).maybeSingle();
    if (error || !data) return null;
    return data as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function syncHeroSettingsToSupabase(item: Offering): Promise<void> {
  const row = heroSettingsFromDetails(item);
  if (!row) return;
  try {
    const supabase = createAdminClient();
    await supabase.from(HERO_SETTINGS_TABLE).upsert(row, { onConflict: "offering_id" });
  } catch { /* best-effort until the migration exists in every environment */ }
}

function emptyOfferingFields(row: Offering): Offering {
  return {
    ...row,
    description: row.description ?? "",
    header_id: row.header_id ?? null,
    schedule: Array.isArray(row.schedule) ? row.schedule : [],
    teacher: row.teacher ?? "",
    capacity: row.capacity ?? null,
    gallery: Array.isArray(row.gallery) ? row.gallery : [],
    details: row.details ?? {},
    seo_title: row.seo_title ?? "",
    seo_description: row.seo_description ?? "",
  };
}

function normalizeOfferingsPageOptions(options: OfferingsPageOptions = {}) {
  const pageSize = Math.min(Math.max(Number(options.pageSize) || 8, 1), 100);
  const page = Math.max(Number(options.page) || 1, 1);
  return {
    page,
    pageSize,
    q: (options.q ?? "").trim(),
    sort: options.sort ?? "recent",
    type: options.type ?? "all",
    status: options.status ?? "all",
  };
}

function matchesOfferingStatus(item: Offering, status: OfferingsPageOptions["status"]) {
  if (!status || status === "all") return item.status !== "deleted";
  return Array.isArray(status) ? status.includes(item.status) : item.status === status;
}

function paginateOfferings(items: Offering[], options: OfferingsPageOptions = {}): OfferingsPageResult {
  const normalized = normalizeOfferingsPageOptions(options);
  const query = normalized.q.toLowerCase();
  const filtered = items
    .filter((item) => matchesOfferingStatus(item, normalized.status))
    .filter((item) => normalized.type === "all" || item.type === normalized.type)
    .filter((item) => {
      if (!query) return true;
      return [item.title, item.slug, item.excerpt, item.type].join(" ").toLowerCase().includes(query);
    })
    .sort((a, b) => {
      const first = +new Date(a.updated_at || a.created_at);
      const second = +new Date(b.updated_at || b.created_at);
      return normalized.sort === "old" ? first - second : second - first;
    });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / normalized.pageSize));
  const page = Math.min(normalized.page, totalPages);
  const start = (page - 1) * normalized.pageSize;
  return {
    items: filtered.slice(start, start + normalized.pageSize).map(emptyOfferingFields),
    total,
    page,
    pageSize: normalized.pageSize,
    totalPages,
  };
}

async function readOfferingsPageFromSupabase(options: OfferingsPageOptions = {}): Promise<OfferingsPageResult | null> {
  const normalized = normalizeOfferingsPageOptions(options);
  const from = (normalized.page - 1) * normalized.pageSize;
  const to = from + normalized.pageSize - 1;

  try {
    const supabase = createAdminClient();
    let query = supabase
      .from(TABLE)
      .select(OFFERING_LIST_SELECT, { count: "exact" });

    if (normalized.status === "all") query = query.neq("status", "deleted");
    else if (Array.isArray(normalized.status)) query = query.in("status", normalized.status);
    else query = query.eq("status", normalized.status);

    if (normalized.type !== "all") query = query.eq("type", normalized.type);
    if (normalized.q) {
      const term = normalized.q.replace(/[%]/g, "");
      query = query.or("title.ilike.%" + term + "%,slug.ilike.%" + term + "%,excerpt.ilike.%" + term + "%");
    }

    const { data, error, count } = await query
      .order("updated_at", { ascending: normalized.sort === "old" })
      .range(from, to);

    if (error) throw error;
    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / normalized.pageSize));
    return {
      items: ((data ?? []) as unknown as Array<Record<string, unknown>>).map((row) => emptyOfferingFields(rowToOffering(row))),
      total,
      page: Math.min(normalized.page, totalPages),
      pageSize: normalized.pageSize,
      totalPages,
    };
  } catch {
    return null;
  }
}

async function readAllFromSupabase(): Promise<Offering[] | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from(TABLE).select("*");
    if (error) throw error;
    if (!data || data.length === 0) return null;
    const rows = data as Array<Record<string, unknown>>;
    const [settings, homeCards, detailTextSettings] = await Promise.all([
      readHeroSettingsMap(rows.map((row) => String(row.id))),
      readHomeCardSettingsMap(rows.map((row) => String(row.id))),
      readDetailTextSettingsMap(rows.map((row) => String(row.id))),
    ]);
    return rows.map((row) => rowToOffering({
      ...row,
      public_hero_settings: settings.get(String(row.id)),
      home_card_settings: homeCards.get(String(row.id)),
      detail_text_settings: detailTextSettings.get(String(row.id)),
    }));
  } catch {
    return null;
  }
}

async function readOneFromSupabase(column: "id" | "slug", value: string): Promise<Offering | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from(TABLE).select("*").eq(column, value).maybeSingle();
    if (error || !data) return null;
    const row = data as Record<string, unknown>;
    const offeringId = column === "id" ? value : String(row.id);
    const [settings, homeCardSettings, detailTextSettings] = await Promise.all([
      readOneHeroSettings(offeringId),
      readOneHomeCardSettings(offeringId),
      readOneDetailTextSettings(offeringId),
    ]);
    return rowToOffering({ ...row, public_hero_settings: settings, home_card_settings: homeCardSettings, detail_text_settings: detailTextSettings });
  } catch {
    return null;
  }
}

async function upsertToSupabase(item: Offering): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from(TABLE).upsert(offeringToRow(item), { onConflict: "id" });
    await Promise.all([
      syncHeroSettingsToSupabase(item),
      syncHomeCardSettingsToSupabase(item),
      syncDetailTextSettingsToSupabase(item),
    ]);
  } catch { /* best-effort */ }
}

async function saveToSupabase(item: Offering): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from(TABLE).upsert(offeringToRow(item), { onConflict: "id" });
  if (error) throw error;
  await Promise.all([
    syncHeroSettingsToSupabase(item),
    syncHomeCardSettingsToSupabase(item),
    syncDetailTextSettingsToSupabase(item),
  ]);
}

async function seedSupabase(items: Offering[]): Promise<void> {
  if (items.length === 0) return;
  try {
    const supabase = createAdminClient();
    await supabase.from(TABLE).upsert(items.map(offeringToRow), { onConflict: "id" });
  } catch { /* best-effort */ }
}

async function deleteFromSupabase(id: string): Promise<void> {
  try {
    const supabase = createAdminClient();
    await Promise.all([
      supabase.from(TABLE).delete().eq("id", id),
      supabase.from(HERO_SETTINGS_TABLE).delete().eq("offering_id", id),
      supabase.from(HOME_CARD_SETTINGS_TABLE).delete().eq("offering_id", id),
      supabase.from(DETAIL_TEXT_SETTINGS_TABLE).delete().eq("offering_id", id),
    ]);
  } catch { /* best-effort */ }
}

export async function getOfferingsPage(options: OfferingsPageOptions = {}) {
  const fromSupabase = await withTimeout(readOfferingsPageFromSupabase(options), SUPABASE_READ_TIMEOUT_MS, null);
  if (fromSupabase) return fromSupabase;
  const localOfferings = await readJsonFile<Offering[]>(FILE_NAME, []);
  return paginateOfferings(localOfferings, options);
}

export async function getOfferings() {
  const cached = getCachedOfferings();
  if (cached) return cached;

  const fromSupabase = await withTimeout(readAllFromSupabase(), SUPABASE_READ_TIMEOUT_MS, null);
  if (fromSupabase) {
    cacheOfferings(fromSupabase);
    return fromSupabase;
  }

  const localOfferings = await readJsonFile<Offering[]>(FILE_NAME, []);
  cacheOfferings(localOfferings);
  void seedSupabase(localOfferings);
  return localOfferings;
}

export async function getOfferingById(id: string) {
  const fromSupabase = await withTimeout(readOneFromSupabase("id", id), SUPABASE_READ_TIMEOUT_MS, null);
  if (fromSupabase) return fromSupabase;

  const cached = getCachedOfferings()?.find((item) => item.id === id);
  if (cached) return cached;

  const offerings = await getOfferings();
  return offerings.find((item) => item.id === id) ?? null;
}

export async function getOfferingBySlug(slug: string) {
  const fromSupabase = await withTimeout(readOneFromSupabase("slug", slug), SUPABASE_READ_TIMEOUT_MS, null);
  if (fromSupabase) return fromSupabase;

  const cached = getCachedOfferings()?.find((item) => item.slug === slug);
  if (cached) return cached;

  const offerings = await getOfferings();
  return offerings.find((item) => item.slug === slug) ?? null;
}

export async function createOffering(data: OfferingInput) {
  const offerings = await getOfferings();
  const next = normalizeOffering(data, undefined, offerings);

  if (!next.title || !next.type) {
    throw new Error("El tÃ­tulo y el tipo son obligatorios.");
  }

  const nextItems = [next, ...offerings];
  await saveToSupabase(next);
  cacheOfferings(nextItems);
  void logAction({ action: "create", entity_type: "offering", entity_id: next.id, entity_title: next.title, new_data: next });
  return next;
}

export async function updateOffering(id: string, data: OfferingInput) {
  const offerings = await getOfferings();
  const index = offerings.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const old = offerings[index];
  const next = normalizeOffering(data, old, offerings);
  offerings[index] = next;
  await saveToSupabase(next);
  cacheOfferings(offerings);
  if (old.status !== next.status) {
    if (next.status === "published") void logAction({ action: "publish", entity_type: "offering", entity_id: next.id, entity_title: next.title, old_data: old, new_data: next });
    else if (old.status === "published") void logAction({ action: "unpublish", entity_type: "offering", entity_id: next.id, entity_title: next.title, old_data: old, new_data: next });
  }
  void logAction({ action: "update", entity_type: "offering", entity_id: next.id, entity_title: next.title, old_data: old, new_data: next });
  return next;
}

export async function duplicateOffering(id: string) {
  const offerings = await getOfferings();
  const original = offerings.find((item) => item.id === id);
  if (!original) return null;
  const duplicateData: OfferingInput = { ...original, id: undefined, deleted_at: null };
  const copy = normalizeOffering(
    { ...duplicateData, title: `${original.title} (copia)`, slug: duplicateSlugBase(original.slug, offerings), status: "draft", deleted_at: null },
    undefined,
    offerings,
  );
  const nextItems = [copy, ...offerings];
  await saveToSupabase(copy);
  cacheOfferings(nextItems);
  void logAction({ action: "duplicate", entity_type: "offering", entity_id: original.id, entity_title: original.title, new_data: copy });
  return copy;
}

export async function moveOfferingToTrash(id: string, deletedBy?: string) {
  const dBy = deletedBy ?? await getCurrentUserEmail();
  const offerings = await readJsonFile<Offering[]>(FILE_NAME, []);
  const index = offerings.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const current = offerings[index];
  const deletedAt = new Date().toISOString();
  const trashed: Offering = { ...current, status: "deleted", deleted_at: deletedAt, updated_at: deletedAt };

  offerings[index] = trashed;
  await writeJsonFile(FILE_NAME, offerings);
  cacheOfferings(offerings);
  await upsertToSupabase(trashed);

  await addTrashItem({
    id: randomUUID(), entity_type: "offering", entity_id: current.id, title: current.title,
    deleted_by: dBy, deleted_at: deletedAt, restore_data: current,
  });
  await logAction({ action: "trash", entity_type: "offering", entity_id: current.id, entity_title: current.title, old_data: current, user_email: dBy });
  return trashed;
}

export async function restoreOffering(id: string) {
  const offerings = await readJsonFile<Offering[]>(FILE_NAME, []);
  const index = offerings.findIndex((item) => item.id === id);
  const trashItem = await getTrashItemByEntity(id);
  if (index === -1 && !trashItem) return null;

  const restored = trashItem?.restore_data && typeof trashItem.restore_data === "object"
    ? ({ ...(trashItem.restore_data as Offering), status: (trashItem.restore_data as Offering).status === "deleted" ? "draft" : (trashItem.restore_data as Offering).status, deleted_at: null, updated_at: new Date().toISOString() } as Offering)
    : ({ ...offerings[index], status: "draft", deleted_at: null, updated_at: new Date().toISOString() } as Offering);

  if (index === -1) {
    offerings.unshift(restored);
  } else {
    offerings[index] = restored;
  }
  await writeJsonFile(FILE_NAME, offerings);
  cacheOfferings(offerings);
  await upsertToSupabase(restored);

  if (trashItem) await removeTrashItem(trashItem.id);
  await logAction({ action: "restore", entity_type: "offering", entity_id: restored.id, entity_title: restored.title });
  return restored;
}

export async function deleteOfferingPermanently(id: string) {
  const offerings = await readJsonFile<Offering[]>(FILE_NAME, []);
  const item = offerings.find((o) => o.id === id) ?? (await getOfferingById(id));
  const next = offerings.filter((entry) => entry.id !== id);

  const trashItem = await getTrashItemByEntity(id);
  const changed = next.length !== offerings.length || Boolean(trashItem) || Boolean(item);
  if (!changed) return false;

  if (item) {
    await deleteOfferingMediaAssets(item);
  }

  await writeJsonFile(FILE_NAME, next);
  cacheOfferings(next);
  await deleteFromSupabase(id);
  if (trashItem) await removeTrashItem(trashItem.id);
  if (item) await logAction({ action: "delete_permanently", entity_type: "offering", entity_id: id, entity_title: item.title, old_data: item });
  return true;
}
