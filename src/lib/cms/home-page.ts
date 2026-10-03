import { promises as fs } from "fs";
import path from "path";
import { cache } from "react";
import { createAdminClient } from "../supabase/admin";
import { normalizeHeroSettings, defaultHeroSettings } from "./hero-settings";
import type { HomeIntroSlide, HomePageSettings } from "./types";

const TABLE = "home_page_settings";
const FILE_PATH = path.join(process.cwd(), "data", "home-page-settings.json");
const SETTINGS_ID = "home-page";
const USE_LOCAL_DATA = process.env.CMS_USE_LOCAL_DATA === "true";

export const defaultHomeIntroSlides: HomeIntroSlide[] = [];

export const defaultHomePageSettings: HomePageSettings = {
  id: SETTINGS_ID,
  status: "published",
  hero: { ...defaultHeroSettings, heroTitle: "", heroSubtitle: "" },
  introSlides: defaultHomeIntroSlides,
  classesTitle: "",
  classesSubtitle: "",
  classesFeaturedIds: [],
  workshopsTitle: "",
  workshopsSubtitle: "",
  workshopsFeaturedIds: [],
  giftTitle: "",
  giftSubtitle: "",
  giftFeaturedIds: [],
  updated_at: "",
};

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function normalizeSlide(input: Partial<HomeIntroSlide>, index: number): HomeIntroSlide {
  const id = String(input.id ?? `intro-${index + 1}`);

  return {
    id,
    text: String(input.text ?? ""),
    buttonText: String(input.buttonText ?? ""),
    buttonHref: String(input.buttonHref ?? ""),
    showButton: input.showButton ?? id !== "intro-1788248293295",
    image: String(input.image ?? ""),
    imageAlt: String(input.imageAlt ?? ""),
    isVisible: input.isVisible !== false,
    sortOrder: Number(input.sortOrder ?? index),
  };
}

function normalizeHomePageSettings(input: Partial<HomePageSettings> | null | undefined): HomePageSettings {
  const row = input as Partial<HomePageSettings> & {
    intro_slides?: unknown;
    classes_title?: string;
    classes_subtitle?: string;
    classes_featured_ids?: unknown;
    workshops_title?: string;
    workshops_subtitle?: string;
    workshops_featured_ids?: unknown;
    gift_title?: string;
    gift_subtitle?: string;
    gift_featured_ids?: unknown;
  } | null | undefined;
  const rawSlides = Array.isArray(input?.introSlides ?? row?.intro_slides)
    ? (input?.introSlides ?? row?.intro_slides) as Partial<HomeIntroSlide>[]
    : [];
  // A featured item has one Home destination. Workshop destination wins when
  // legacy data contains the same id in both lists.
  const workshopsFeaturedIds = stringArray(input?.workshopsFeaturedIds ?? row?.workshops_featured_ids);
  const workshopIds = new Set(workshopsFeaturedIds);
  const classesFeaturedIds = stringArray(input?.classesFeaturedIds ?? row?.classes_featured_ids)
    .filter((id) => !workshopIds.has(id));

  return {
    id: SETTINGS_ID,
    status: input?.status === "draft" ? "draft" : "published",
    hero: normalizeHeroSettings((input as Partial<HomePageSettings>)?.hero ?? (row as { hero?: unknown })?.hero, defaultHomePageSettings.hero),
    introSlides: rawSlides.map(normalizeSlide).sort((a, b) => a.sortOrder - b.sortOrder),
    classesTitle: String(input?.classesTitle ?? row?.classes_title ?? defaultHomePageSettings.classesTitle),
    classesSubtitle: String(input?.classesSubtitle ?? row?.classes_subtitle ?? defaultHomePageSettings.classesSubtitle),
    classesFeaturedIds,
    workshopsTitle: String(input?.workshopsTitle ?? row?.workshops_title ?? defaultHomePageSettings.workshopsTitle),
    workshopsSubtitle: String(input?.workshopsSubtitle ?? row?.workshops_subtitle ?? defaultHomePageSettings.workshopsSubtitle),
    workshopsFeaturedIds,
    giftTitle: String(input?.giftTitle ?? row?.gift_title ?? defaultHomePageSettings.giftTitle),
    giftSubtitle: String(input?.giftSubtitle ?? row?.gift_subtitle ?? defaultHomePageSettings.giftSubtitle),
    giftFeaturedIds: stringArray(input?.giftFeaturedIds ?? row?.gift_featured_ids),
    updated_at: String(input?.updated_at ?? ""),
  };
}

function toRow(settings: HomePageSettings) {
  return {
    id: settings.id,
    status: settings.status,
    hero: settings.hero,
    intro_slides: settings.introSlides,
    classes_title: settings.classesTitle,
    classes_subtitle: settings.classesSubtitle,
    classes_featured_ids: settings.classesFeaturedIds,
    workshops_title: settings.workshopsTitle,
    workshops_subtitle: settings.workshopsSubtitle,
    workshops_featured_ids: settings.workshopsFeaturedIds,
    gift_title: settings.giftTitle,
    gift_subtitle: settings.giftSubtitle,
    gift_featured_ids: settings.giftFeaturedIds,
    updated_at: settings.updated_at,
  };
}

async function readFromFile(): Promise<HomePageSettings | null> {
  try {
    const raw = await fs.readFile(FILE_PATH, "utf8");
    return normalizeHomePageSettings(JSON.parse(raw) as Partial<HomePageSettings>);
  } catch {
    return null;
  }
}

async function writeToFile(settings: HomePageSettings) {
  await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
  await fs.writeFile(FILE_PATH, JSON.stringify(settings, null, 2), "utf8");
}

export const getHomePageSettings = cache(async function getHomePageSettings() {
  if (USE_LOCAL_DATA) return (await readFromFile()) ?? defaultHomePageSettings;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from(TABLE).select("*").eq("id", SETTINGS_ID).maybeSingle();
    if (error) throw error;
    if (data) return normalizeHomePageSettings(data as Partial<HomePageSettings>);

    return (await readFromFile()) ?? defaultHomePageSettings;
  } catch (error) {
    console.error("[home-page] No se pudo leer la configuracion de Supabase.", error);
    const localSettings = await readFromFile();
    if (localSettings) return localSettings;

    return { ...defaultHomePageSettings, introSlides: [] };
  }
});

export async function updateHomePageSettings(input: Partial<HomePageSettings>) {
  const next = normalizeHomePageSettings({
    ...input,
    updated_at: new Date().toISOString(),
  });

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from(TABLE).upsert(toRow(next), { onConflict: "id" });
    if (error) throw error;
  } catch {
    await writeToFile(next);
  }

  return next;
}
