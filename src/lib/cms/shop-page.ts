import { promises as fs } from "fs";
import path from "path";
import { createAdminClient } from "../supabase/admin";
import { getSettings } from "./settings";
import { defaultHeroSettings, normalizeHeroSettings } from "./hero-settings";
import type { ShopPageSettings } from "./types";

const TABLE = "shop_page_settings";
const FILE_PATH = path.join(process.cwd(), "data", "shop-page-settings.json");
const SETTINGS_ID = "shop-page";

export const defaultShopPageSettings = (siteName: string, defaultSeoTitle: string, defaultSeoDescription: string): ShopPageSettings => ({
  id: SETTINGS_ID,
  status: "published",
  hero: normalizeHeroSettings({
    ...defaultHeroSettings,
    heroVariant: "text",
    heroTitle: siteName,
    heroSubtitle: siteName,
    heroImage: "/img/social-2.jpg",
    heroPresentationText: `# ${siteName}\n\nPiezas ceramicas creadas con tiempo, materia y mirada propia.`,
  }),
  showCharacteristicsInPreview: true,
  previewCharacteristicLabels: ["Peso", "Medidas", "Caracteristicas"],
  seo_title: `${defaultSeoTitle || siteName} | ${siteName}`,
  seo_description: defaultSeoDescription || `Piezas ceramicas disponibles en ${siteName}.`,
  seo_image: "",
  updated_at: "",
});

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.map(String).map((item) => item.trim()).filter(Boolean) : [];
}

function normalizeShopPageSettings(input: Partial<ShopPageSettings> | null | undefined, siteName: string, defaultSeoTitle: string, defaultSeoDescription: string): ShopPageSettings {
  const row = input as Partial<ShopPageSettings> & {
    show_characteristics_in_preview?: boolean;
    preview_characteristic_labels?: unknown;
  } | null | undefined;

  const labels = stringArray(input?.previewCharacteristicLabels ?? row?.preview_characteristic_labels);

  const defaults = defaultShopPageSettings(siteName, defaultSeoTitle, defaultSeoDescription);

  return {
    ...defaults,
    ...input,
    id: SETTINGS_ID,
    status: input?.status === "draft" ? "draft" : "published",
    hero: normalizeHeroSettings(input?.hero, {
      heroTitle: siteName,
      heroSubtitle: siteName,
      heroImage: "/img/social-2.jpg",
    }),
    showCharacteristicsInPreview: (input?.showCharacteristicsInPreview ?? row?.show_characteristics_in_preview) !== false,
    previewCharacteristicLabels: labels.length ? labels : defaults.previewCharacteristicLabels,
    seo_title: String(input?.seo_title ?? defaults.seo_title),
    seo_description: String(input?.seo_description ?? defaults.seo_description),
    seo_image: String(input?.seo_image ?? ""),
    updated_at: String(input?.updated_at ?? ""),
  };
}

function toRow(settings: ShopPageSettings) {
  return {
    id: settings.id,
    status: settings.status,
    hero: settings.hero,
    show_characteristics_in_preview: settings.showCharacteristicsInPreview,
    preview_characteristic_labels: settings.previewCharacteristicLabels,
    seo_title: settings.seo_title,
    seo_description: settings.seo_description,
    seo_image: settings.seo_image,
    updated_at: settings.updated_at,
  };
}

async function readFromFile(siteName: string, defaultSeoTitle: string, defaultSeoDescription: string) {
  try {
    const raw = await fs.readFile(FILE_PATH, "utf8");
    return normalizeShopPageSettings(JSON.parse(raw) as Partial<ShopPageSettings>, siteName, defaultSeoTitle, defaultSeoDescription);
  } catch {
    return defaultShopPageSettings(siteName, defaultSeoTitle, defaultSeoDescription);
  }
}

async function writeToFile(settings: ShopPageSettings) {
  await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
  await fs.writeFile(FILE_PATH, JSON.stringify(settings, null, 2), "utf8");
}

export async function getShopPageSettings(siteName = "Casa Rosier", defaultSeoTitle = "", defaultSeoDescription = "") {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from(TABLE).select("*").eq("id", SETTINGS_ID).maybeSingle();
    if (error) throw error;
    if (data) return normalizeShopPageSettings(data as Partial<ShopPageSettings>, siteName, defaultSeoTitle, defaultSeoDescription);
  } catch {
    return readFromFile(siteName, defaultSeoTitle, defaultSeoDescription);
  }

  return readFromFile(siteName, defaultSeoTitle, defaultSeoDescription);
}

export async function updateShopPageSettings(input: Partial<ShopPageSettings>) {
  const settings = await getSettings();
  const siteName = settings.site.site_name;
  const next = normalizeShopPageSettings({
    ...input,
    updated_at: new Date().toISOString(),
  }, siteName, settings.seo.default_seo_title, settings.seo.default_seo_description);

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from(TABLE).upsert(toRow(next), { onConflict: "id" });
    if (error) throw error;
  } catch {
    await writeToFile(next);
  }

  return next;
}
