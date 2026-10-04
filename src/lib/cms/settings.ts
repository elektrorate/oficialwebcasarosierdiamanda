import { createAdminClient } from "../supabase/admin";
import type { SiteSettingInsert, SiteSettingUpdate } from "../supabase/types";
import { DEFAULT_SETTINGS, type SiteSettings } from "./settings-types";
import { SettingsPersistenceError, persistSettings, type UpdateSettingsResult } from "./settings-persist";
export { SettingsPersistenceError, persistSettings, type UpdateSettingsResult };

export { DEFAULT_SETTINGS, SETTINGS_SECTIONS } from "./settings-types";
export type { SiteSettings, SettingsSection } from "./settings-types";
const SETTINGS_ID = "00000000-0000-0000-0000-000000000001";
const MENU_VISUAL_SETTINGS_ID = "00000000-0000-0000-0000-000000000002";
const SUPABASE_READ_TIMEOUT_MS = 1_500;
const SETTINGS_CACHE_TTL_MS = 15_000;

let settingsCache: { item: SiteSettings; expiresAt: number } | null = null;

type MenuVisualSettingsRow = {
  header_logo_url?: string | null;
  scroll_menu_background_color?: string | null;
  scroll_menu_text_color?: string | null;
  scroll_menu_icon_color?: string | null;
  scroll_menu_logo_tint_enabled?: boolean | null;
  scroll_menu_logo_tint_color?: string | null;
};

type SiteSettingsRow = {
  site_name: string;
  site_description: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  header_logo_url?: string | null;
  scroll_menu_background_color?: string | null;
  scroll_menu_text_color?: string | null;
  scroll_menu_icon_color?: string | null;
  scroll_menu_logo_tint_enabled?: boolean | null;
  scroll_menu_logo_tint_color?: string | null;
  default_language: string;
  timezone: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  city: string;
  country: string;
  map_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  facebook_url: string | null;
  youtube_url: string | null;
  pinterest_url: string | null;
  footer_logo_url: string | null;
  footer_text: string | null;
  legal_text: string | null;
  show_social_links: boolean;
  show_contact_info: boolean;
  default_seo_title: string | null;
  default_seo_description: string | null;
  default_og_image_url: string | null;
  robots_index: boolean;
  robots_follow: boolean;
  sitemap_enabled: boolean;
  maintenance_mode: boolean;
  updated_at: string;
};

function flattenSettings(s: SiteSettings): SiteSettingUpdate {
  return {
    site_name: s.site.site_name,
    site_description: s.site.site_description || null,
    logo_url: s.site.logo_url || null,
    favicon_url: s.site.favicon_url || null,
    header_logo_url: s.menu.header_logo_url || null,
    scroll_menu_background_color: s.menu.scroll_menu_background_color || "#f9f8f3",
    scroll_menu_text_color: s.menu.scroll_menu_text_color || "#3f3933",
    scroll_menu_icon_color: s.menu.scroll_menu_icon_color || "#3f3933",
    scroll_menu_logo_tint_enabled: s.menu.scroll_menu_logo_tint_enabled,
    scroll_menu_logo_tint_color: s.menu.scroll_menu_logo_tint_color || "#3f3933",
    default_language: s.site.default_language,
    timezone: s.site.timezone,
    email: s.contact.email || null,
    phone: s.contact.phone || null,
    whatsapp: s.contact.whatsapp || null,
    address: s.contact.address || null,
    city: s.contact.city,
    country: s.contact.country,
    map_url: s.contact.map_url || null,
    instagram_url: s.social.instagram_url || null,
    tiktok_url: s.social.tiktok_url || null,
    facebook_url: s.social.facebook_url || null,
    youtube_url: s.social.youtube_url || null,
    pinterest_url: s.social.pinterest_url || null,
    footer_logo_url: s.footer.footer_logo_url || null,
    footer_text: s.footer.footer_text || null,
    legal_text: s.footer.legal_text || null,
    show_social_links: s.footer.show_social_links,
    show_contact_info: s.footer.show_contact_info,
    default_seo_title: s.seo.default_seo_title || null,
    default_seo_description: s.seo.default_seo_description || null,
    default_og_image_url: s.seo.default_og_image_url || null,
    robots_index: s.seo.robots_index,
    robots_follow: s.seo.robots_follow,
    sitemap_enabled: s.seo.sitemap_enabled,
    maintenance_mode: s.system.maintenance_mode,
  };
}

function rowToSettings(row: SiteSettingsRow): SiteSettings {
  return {
    site: {
      site_name: row.site_name,
      site_description: row.site_description ?? "",
      logo_url: row.logo_url ?? "",
      favicon_url: row.favicon_url ?? "",
      default_language: row.default_language,
      timezone: row.timezone,
    },
    menu: {
      header_logo_url: row.header_logo_url ?? row.logo_url ?? DEFAULT_SETTINGS.menu.header_logo_url,
      scroll_menu_background_color:
        row.scroll_menu_background_color ?? DEFAULT_SETTINGS.menu.scroll_menu_background_color,
      scroll_menu_text_color:
        row.scroll_menu_text_color ?? DEFAULT_SETTINGS.menu.scroll_menu_text_color,
      scroll_menu_icon_color:
        row.scroll_menu_icon_color ??
        row.scroll_menu_text_color ??
        DEFAULT_SETTINGS.menu.scroll_menu_icon_color,
      scroll_menu_logo_tint_enabled:
        row.scroll_menu_logo_tint_enabled ?? DEFAULT_SETTINGS.menu.scroll_menu_logo_tint_enabled,
      scroll_menu_logo_tint_color:
        row.scroll_menu_logo_tint_color ??
        row.scroll_menu_icon_color ??
        DEFAULT_SETTINGS.menu.scroll_menu_logo_tint_color,
    },
    contact: {
      email: row.email ?? "",
      phone: row.phone ?? "",
      whatsapp: row.whatsapp ?? "",
      address: row.address ?? "",
      city: row.city,
      country: row.country,
      map_url: row.map_url ?? "",
    },
    social: {
      instagram_url: row.instagram_url ?? "",
      tiktok_url: row.tiktok_url ?? "",
      facebook_url: row.facebook_url ?? "",
      youtube_url: row.youtube_url ?? "",
      pinterest_url: row.pinterest_url ?? "",
    },
    footer: {
      footer_logo_url: row.footer_logo_url ?? "",
      footer_text: row.footer_text ?? "",
      legal_text: row.legal_text ?? "",
      show_social_links: row.show_social_links,
      show_contact_info: row.show_contact_info,
    },
    seo: {
      default_seo_title: row.default_seo_title ?? "",
      default_seo_description: row.default_seo_description ?? "",
      default_og_image_url: row.default_og_image_url ?? "",
      robots_index: row.robots_index,
      robots_follow: row.robots_follow,
      sitemap_enabled: row.sitemap_enabled ?? DEFAULT_SETTINGS.seo.sitemap_enabled,
    },
    system: {
      maintenance_mode: row.maintenance_mode,
      updated_at: row.updated_at,
    },
  };
}

function getCachedSettings() {
  if (!settingsCache || settingsCache.expiresAt <= Date.now()) return null;
  return settingsCache.item;
}

function cacheSettings(settings: SiteSettings) {
  settingsCache = { item: settings, expiresAt: Date.now() + SETTINGS_CACHE_TTL_MS };
}

/** Descarta la caché en memoria para que la siguiente lectura vaya a Supabase. */
export function invalidateSettingsCache() {
  settingsCache = null;
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

function rowToMenuSettings(row: MenuVisualSettingsRow): Partial<SiteSettings["menu"]> {
  return {
    header_logo_url: row.header_logo_url ?? DEFAULT_SETTINGS.menu.header_logo_url,
    scroll_menu_background_color:
      row.scroll_menu_background_color ?? DEFAULT_SETTINGS.menu.scroll_menu_background_color,
    scroll_menu_text_color: row.scroll_menu_text_color ?? DEFAULT_SETTINGS.menu.scroll_menu_text_color,
    scroll_menu_icon_color:
      row.scroll_menu_icon_color ??
      row.scroll_menu_text_color ??
      DEFAULT_SETTINGS.menu.scroll_menu_icon_color,
    scroll_menu_logo_tint_enabled:
      row.scroll_menu_logo_tint_enabled ?? DEFAULT_SETTINGS.menu.scroll_menu_logo_tint_enabled,
    scroll_menu_logo_tint_color:
      row.scroll_menu_logo_tint_color ??
      row.scroll_menu_icon_color ??
      DEFAULT_SETTINGS.menu.scroll_menu_logo_tint_color,
  };
}

async function readMenuVisualSettingsFromSupabase(): Promise<Partial<SiteSettings["menu"]> | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("menu_visual_settings")
    .select("*")
    .eq("key", "default")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return rowToMenuSettings(data as MenuVisualSettingsRow);
}

/** Lee el ajuste global. `null` cuando la tabla no está disponible. */
export async function readSettingsFromSupabase(): Promise<SiteSettings | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const settings = rowToSettings(data as SiteSettingsRow);
  const menuVisualSettings = await readMenuVisualSettingsFromSupabase();
  return menuVisualSettings
    ? { ...settings, menu: { ...settings.menu, ...menuVisualSettings } }
    : settings;
}

async function readFromSupabase(): Promise<SiteSettings | null> {
  try {
    return await readSettingsFromSupabase();
  } catch (error) {
    console.error("No se pudo leer la configuración global de Supabase:", error);
    return null;
  }
}

/** Escritura única en `site_settings` (singleton por id, sin filas duplicadas). */
async function writeSiteSettings(settings: SiteSettings, updatedAt: string): Promise<void> {
  const supabase = createAdminClient();
  const flat = { ...flattenSettings(settings), updated_at: updatedAt };
  const { error } = await supabase
    .from("site_settings")
    .upsert({ id: SETTINGS_ID, ...flat } as SiteSettingInsert, { onConflict: "id" });
  if (error) throw error;
}

/** Escritura de los visuales del menú en su tabla propia. */
async function writeMenuVisualSettings(settings: SiteSettings, updatedAt: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("menu_visual_settings")
    .upsert(
      {
        id: MENU_VISUAL_SETTINGS_ID,
        key: "default",
        header_logo_url: settings.menu.header_logo_url,
        scroll_menu_background_color: settings.menu.scroll_menu_background_color || "#f9f8f3",
        scroll_menu_text_color: settings.menu.scroll_menu_text_color || "#3f3933",
        scroll_menu_icon_color: settings.menu.scroll_menu_icon_color || "#3f3933",
        scroll_menu_logo_tint_enabled: settings.menu.scroll_menu_logo_tint_enabled,
        scroll_menu_logo_tint_color: settings.menu.scroll_menu_logo_tint_color || "#3f3933",
        updated_at: updatedAt,
      },
      { onConflict: "key" },
    );
  if (error) throw error;
}

export function mergeSettings(current: SiteSettings, partial: Partial<SiteSettings>): SiteSettings {
  return {
    site: { ...current.site, ...(partial.site ?? {}) },
    menu: { ...current.menu, ...(partial.menu ?? {}) },
    contact: { ...current.contact, ...(partial.contact ?? {}) },
    social: { ...current.social, ...(partial.social ?? {}) },
    footer: { ...current.footer, ...(partial.footer ?? {}) },
    seo: { ...current.seo, ...(partial.seo ?? {}) },
    system: { ...current.system, ...(partial.system ?? {}), updated_at: new Date().toISOString() },
  };
}

export async function getSettings(): Promise<SiteSettings> {
  const cached = getCachedSettings();
  if (cached) return cached;

  const fromSupabase = await withTimeout(readFromSupabase(), SUPABASE_READ_TIMEOUT_MS, null);
  if (fromSupabase) {
    cacheSettings(fromSupabase);
    return fromSupabase;
  }

  // Sin fila todavía: se devuelven los valores por defecto. La escritura crea
  // el singleton cuando el usuario guarda por primera vez.
  const fallback: SiteSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  cacheSettings(fallback);
  return fallback;
}

/**
 * Guarda los ajustes y devuelve lo que el servidor ha confirmado leyendo la fila
 * persistida. Lanza `SettingsPersistenceError` si alguna escritura necesaria falla,
 * para que la API nunca responda con un falso éxito.
 */
export async function updateSettings(
  data: Partial<SiteSettings>,
): Promise<UpdateSettingsResult> {
  const current = await getSettings();
  const next = mergeSettings(current, data);

  const write = await persistSettings(next, {
    writeSiteSettings,
    writeMenuVisualSettings,
  });

  if (!write.ok) {
    const detail = write.errors.join(" · ");
    const partial =
      write.saved.length > 0
        ? ` Se guardó parcialmente (${write.saved.join(", ")}); no se puede confirmar el resto.`
        : " No se guardó ningún cambio.";
    throw new SettingsPersistenceError(`No se pudo guardar la configuración. ${partial} ${detail}`, write.saved, write.failed);
  }

  // Se relee para confirmar con `updated_at` real y no con el valor estimado.
  const confirmed = await readSettingsFromSupabase().catch(() => null);
  const settings = confirmed ?? { ...next, system: { ...next.system, updated_at: write.saved.length ? new Date().toISOString() : next.system.updated_at } };
  cacheSettings(settings);
  return { settings, write };
}

export async function updateSiteSettings(
  data: Partial<SiteSettings["site"]>,
): Promise<UpdateSettingsResult> {
  return updateSettings({ site: data } as Partial<SiteSettings>);
}

export async function updateContactSettings(
  data: Partial<SiteSettings["contact"]>,
): Promise<UpdateSettingsResult> {
  return updateSettings({ contact: data } as Partial<SiteSettings>);
}

export async function updateSocialSettings(
  data: Partial<SiteSettings["social"]>,
): Promise<UpdateSettingsResult> {
  return updateSettings({ social: data } as Partial<SiteSettings>);
}

export async function updateFooterSettings(
  data: Partial<SiteSettings["footer"]>,
): Promise<UpdateSettingsResult> {
  return updateSettings({ footer: data } as Partial<SiteSettings>);
}

export async function updateSeoSettings(
  data: Partial<SiteSettings["seo"]>,
): Promise<UpdateSettingsResult> {
  return updateSettings({ seo: data } as Partial<SiteSettings>);
}

/** Restaura los valores iniciales (guarda real; si falla, lanza). */
export async function resetSettings(): Promise<UpdateSettingsResult> {
  const next: SiteSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  const write = await persistSettings(next, {
    writeSiteSettings,
    writeMenuVisualSettings,
  });
  if (!write.ok) {
    const detail = write.errors.join(" · ");
    throw new SettingsPersistenceError(
      `No se pudieron restaurar los valores iniciales. ${detail}`,
      write.saved,
      write.failed,
    );
  }
  const confirmed = await readSettingsFromSupabase().catch(() => null);
  const settings = confirmed ?? next;
  cacheSettings(settings);
  return { settings, write };
}
