/**
 * Prioridad de cada campo de Configuración global frente al editor del footer.
 *
 * Reglas:
 * - Configuración global define los valores generales del sitio.
 * - El editor del footer controla su diseño y puede mantener sobrescrituras
 *   explícitas de contenido.
 * - Cuando existe una sobrescritura, el CMS la indica y permite volver al valor
 *   global (borrando el campo del footer, sin borrar ni migrar contenido).
 * - El SEO específico de cada página prevalece sobre los valores SEO generales.
 */

import type { FooterComponent } from "./types";

export type GlobalSettingsField =
  | "site.site_name"
  | "site.site_description"
  | "site.logo_url"
  | "site.favicon_url"
  | "site.default_language"
  | "site.timezone"
  | "menu.header_logo_url"
  | "menu.scroll_menu_background_color"
  | "menu.scroll_menu_text_color"
  | "menu.scroll_menu_icon_color"
  | "menu.scroll_menu_logo_tint_enabled"
  | "menu.scroll_menu_logo_tint_color"
  | "contact.email"
  | "contact.phone"
  | "contact.whatsapp"
  | "contact.address"
  | "contact.city"
  | "contact.country"
  | "contact.map_url"
  | "social.instagram_url"
  | "social.tiktok_url"
  | "social.facebook_url"
  | "social.youtube_url"
  | "social.pinterest_url"
  | "footer.footer_logo_url"
  | "footer.footer_text"
  | "footer.legal_text"
  | "footer.show_social_links"
  | "footer.show_contact_info"
  | "seo.default_seo_title"
  | "seo.default_seo_description"
  | "seo.default_og_image_url"
  | "seo.robots_index"
  | "seo.robots_follow"
  | "system.maintenance_mode";

export type SettingsOrigin = "global" | "footer-override" | "page-override";

export type FieldOriginInfo = {
  field: GlobalSettingsField;
  origin: SettingsOrigin;
  /** Texto para el CMS: quién manda y por qué. */
  detail?: string;
  /** Acción sugerida para volver al valor global. */
  resetHint?: string;
};

const SOCIAL_PLATFORM_FIELDS: Array<{
  field: GlobalSettingsField;
  platform: string;
}> = [
  { field: "social.instagram_url", platform: "instagram" },
  { field: "social.facebook_url", platform: "facebook" },
  { field: "social.tiktok_url", platform: "tiktok" },
  { field: "social.youtube_url", platform: "youtube" },
  { field: "social.pinterest_url", platform: "pinterest" },
];

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

/** El footer solo "personaliza" una red si además define su propia URL. */
function footerOverridesSocialUrl(footer: FooterComponent | null | undefined, platform: string) {
  const links = footer?.social_links ?? [];
  return links.some((link) => {
    const key = (link.platform ?? "").toLowerCase();
    const url = (link.url ?? "").toLowerCase();
    if (!key.includes(platform) && !url.includes(platform)) return false;
    return hasText(link.url);
  });
}

/**
 * Mapa campo → origen efectivo. La presencia de un campo en el footer es una
 * sobrescritura explícita: el footer gana, pero el CMS debe señalarlo.
 */
export function resolveSettingsOrigins(
  footer: FooterComponent | null | undefined,
): Record<GlobalSettingsField, FieldOriginInfo> {
  const origin = (
    field: GlobalSettingsField,
    detail?: string,
    resetHint?: string,
  ): FieldOriginInfo => ({
    field,
    origin: detail ? "footer-override" : "global",
    ...(detail ? { detail } : {}),
    ...(resetHint ? { resetHint } : {}),
  });

  const entries: Array<FieldOriginInfo> = [
    origin("site.site_name"),
    origin("site.site_description"),
    origin("site.logo_url"),
    origin("site.favicon_url"),
    origin("site.default_language"),
    origin("site.timezone"),
    origin("menu.header_logo_url"),
    origin("menu.scroll_menu_background_color"),
    origin("menu.scroll_menu_text_color"),
    origin("menu.scroll_menu_icon_color"),
    origin("menu.scroll_menu_logo_tint_enabled"),
    origin("menu.scroll_menu_logo_tint_color"),
    origin("contact.email", hasText(footer?.contact_email) ? "El footer define su propio email." : undefined,
      "Borra el email en Componentes → Footer para usar el global."),
    origin("contact.phone"),
    origin("contact.whatsapp", hasText(footer?.whatsapp) ? "El footer define su propio WhatsApp." : undefined,
      "Borra el WhatsApp en Componentes → Footer para usar el global."),
    origin("contact.address", hasText(footer?.address) ? "El footer define su propia dirección." : undefined,
      "Borra la dirección en Componentes → Footer para usar la global."),
    origin("contact.city"),
    origin("contact.country"),
    origin("contact.map_url", hasText(footer?.map_url) ? "El footer define su propio mapa." : undefined,
      "Borra la URL del mapa en Componentes → Footer para usar la global."),
    origin("footer.footer_logo_url"),
    origin("footer.footer_text"),
    origin("footer.legal_text", hasText(footer?.legal_text) ? "El footer define su propio texto legal." : undefined,
      "Borra el texto legal en Componentes → Footer para usar el global."),
    origin("footer.show_social_links"),
    origin("footer.show_contact_info"),
    origin("seo.default_seo_title"),
    origin("seo.default_seo_description"),
    origin("seo.default_og_image_url"),
    origin("seo.robots_index"),
    origin("seo.robots_follow"),
    origin("system.maintenance_mode"),
  ];

  for (const { field, platform } of SOCIAL_PLATFORM_FIELDS) {
    const overridden = footerOverridesSocialUrl(footer, platform);
    entries.push(
      origin(
        field,
        overridden ? `El footer define su propio enlace de ${platform}.` : undefined,
        overridden
          ? `Quita el enlace de ${platform} en Componentes → Footer para usar el global.`
          : undefined,
      ),
    );
  }

  return Object.fromEntries(entries.map((entry) => [entry.field, entry])) as Record<
    GlobalSettingsField,
    FieldOriginInfo
  >;
}

export const OVERRIDABLE_FIELDS_BY_FOOTER: GlobalSettingsField[] = [
  "contact.email",
  "contact.whatsapp",
  "contact.address",
  "contact.map_url",
  "footer.legal_text",
  "social.instagram_url",
  "social.facebook_url",
  "social.tiktok_url",
  "social.youtube_url",
  "social.pinterest_url",
];

/** Campos de SEO global que solo actúan como valor por defecto. */
export const SEO_DEFAULT_ONLY_FIELDS: GlobalSettingsField[] = [
  "seo.default_seo_title",
  "seo.default_seo_description",
  "seo.default_og_image_url",
  "seo.robots_index",
  "seo.robots_follow",
];

/** El email del footer solo sustituye al global si el footer tiene contenido. */
export function footerOverridesEmail(footer: FooterComponent | null | undefined) {
  return hasText(footer?.contact_email);
}

export function footerHasSocialLinks(footer: FooterComponent | null | undefined) {
  return (footer?.social_links ?? []).length > 0;
}

export function footerOverridesAnySocial(footer: FooterComponent | null | undefined) {
  return SOCIAL_PLATFORM_FIELDS.some(({ platform }) => footerOverridesSocialUrl(footer, platform));
}
