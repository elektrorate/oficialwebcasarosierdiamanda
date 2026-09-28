/**
 * Validación y normalización del payload de Configuración global.
 *
 * Se ejecuta en el servidor (`/api/admin/settings`) antes de tocar la base de
 * datos: rechaza estructuras o tipos incorrectos, aplica valores por defecto
 * seguros y normaliza los campos (colores, URLs, idioma, zona horaria).
 *
 * Módulo puro: no toca Supabase ni la red, así se puede testear aislado.
 */

import { isValidTimeZone, resolveSiteTimeZone } from "../seo/site-timezone.ts";
import { isSupportedSiteLanguage, normalizeSiteLanguage } from "../seo/site-language.ts";
import { SETTINGS_SECTIONS, type SiteSettings } from "./settings-types.ts";

export type SettingsValidationResult =
  | { ok: true; value: Partial<SiteSettings>; }
  | { ok: false; errors: string[]; };

const MAX_TEXT_LENGTHS = {
  short: 200,
  url: 2_048,
  description: 2_000,
  siteName: 120,
} as const;

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const SECTION_STRING_FIELDS: Record<string, readonly string[]> = {
  site: ["site_name", "site_description", "logo_url", "favicon_url", "default_language", "timezone"],
  menu: [
    "header_logo_url",
    "scroll_menu_background_color",
    "scroll_menu_text_color",
    "scroll_menu_icon_color",
    "scroll_menu_logo_tint_color",
  ],
  contact: ["email", "phone", "whatsapp", "address", "city", "country", "map_url"],
  social: ["instagram_url", "tiktok_url", "facebook_url", "youtube_url", "pinterest_url"],
  footer: ["footer_logo_url", "footer_text", "legal_text"],
  seo: ["default_seo_title", "default_seo_description", "default_og_image_url"],
};

const SECTION_BOOLEAN_FIELDS: Record<string, readonly string[]> = {
  menu: ["scroll_menu_logo_tint_enabled"],
  footer: ["show_social_links", "show_contact_info"],
  seo: ["robots_index", "robots_follow"],
  system: ["maintenance_mode"],
};

const COLOR_FIELDS = new Set([
  "scroll_menu_background_color",
  "scroll_menu_text_color",
  "scroll_menu_icon_color",
  "scroll_menu_logo_tint_color",
]);

const URL_FIELDS = new Set([
  "logo_url",
  "favicon_url",
  "header_logo_url",
  "footer_logo_url",
  "map_url",
  "instagram_url",
  "tiktok_url",
  "facebook_url",
  "youtube_url",
  "pinterest_url",
  "default_og_image_url",
]);

const LANGUAGE_FIELDS = new Set(["default_language"]);
const TIMEZONE_FIELDS = new Set(["timezone"]);
const EMAIL_FIELDS = new Set(["email"]);

/** Campos que el formulario envía pero decide el servidor (no validan ni fallan). */
const SERVER_MANAGED_FIELDS = new Set(["system.updated_at"]);

/** Columnas NOT NULL en `site_settings`: admiten "" pero no pueden desaparecer. */
const REQUIRED_STRING_FIELDS = new Set([
  "site.site_name",
  "site.default_language",
  "site.timezone",
  "contact.city",
  "contact.country",
]);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** `/img/x.png`, `https://…`; rechaza `javascript:` y `data:`. */
function isSafeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith("/")) return !trimmed.startsWith("//");
  return /^https?:\/\/[^\s]+$/i.test(trimmed);
}

function textLimitFor(field: string) {
  if (field === "site_name") return MAX_TEXT_LENGTHS.siteName;
  if (field === "site_description" || field === "default_seo_description") {
    return MAX_TEXT_LENGTHS.description;
  }
  if (URL_FIELDS.has(field)) return MAX_TEXT_LENGTHS.url;
  return MAX_TEXT_LENGTHS.short;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeField(section: string, field: string, raw: unknown, errors: string[]): unknown {
  const label = `Configuración global › ${section}.${field}`;

  if (typeof raw !== "string") {
    errors.push(`${label}: se esperaba un texto.`);
    return undefined;
  }
  const value = raw.trim();

  if (COLOR_FIELDS.has(field)) {
    if (!HEX_COLOR.test(value)) {
      errors.push(`${label}: usa un color hexadecimal, por ejemplo #f9f8f3.`);
      return undefined;
    }
    return value.toUpperCase();
  }

  if (URL_FIELDS.has(field)) {
    if (!isSafeUrl(value)) {
      errors.push(`${label}: introduce una URL http(s) absoluta o una ruta interna (/...).`);
      return undefined;
    }
    return value;
  }

  if (EMAIL_FIELDS.has(field)) {
    if (value && !EMAIL_PATTERN.test(value)) {
      errors.push(`${label}: el correo no tiene un formato válido.`);
      return undefined;
    }
    return value;
  }

  if (TIMEZONE_FIELDS.has(field)) {
    if (!isValidTimeZone(value)) {
      errors.push(`${label}: zona horaria IANA no válida (por ejemplo Europe/Madrid).`);
      return undefined;
    }
    return resolveSiteTimeZone(value);
  }

  if (LANGUAGE_FIELDS.has(field)) {
    if (!isSupportedSiteLanguage(value)) {
      errors.push(`${label}: idioma no admitido. Usa un código como es, en o fr.`);
      return undefined;
    }
    return normalizeSiteLanguage(value);
  }

  if (value.length > textLimitFor(field)) {
    errors.push(`${label}: supera el máximo de ${textLimitFor(field)} caracteres.`);
    return undefined;
  }

  return value;
}

function normalizeSection(
  section: string,
  input: unknown,
  errors: string[],
): Record<string, unknown> | undefined {
  if (!isPlainObject(input)) {
    errors.push(`Configuración global › ${section}: se esperaba un objeto.`);
    return undefined;
  }

  const stringFields = SECTION_STRING_FIELDS[section] ?? [];
  const booleanFields = SECTION_BOOLEAN_FIELDS[section] ?? [];
  const allowed = new Set([...stringFields, ...booleanFields]);

  for (const key of Object.keys(input)) {
    if (allowed.has(key)) continue;
    if (SERVER_MANAGED_FIELDS.has(`${section}.${key}`)) continue;
    errors.push(`Configuración global › ${section}.${key}: campo desconocido.`);
  }

  const result: Record<string, unknown> = {};

  for (const field of stringFields) {
    if (!(field in input)) continue;
    const normalized = normalizeField(section, field, input[field], errors);
    if (normalized !== undefined) result[field] = normalized;
  }

  for (const key of REQUIRED_STRING_FIELDS) {
    const [requiredSection, requiredField] = key.split(".");
    if (requiredSection !== section) continue;
    if (!(requiredField in input)) continue;
    if (String(input[requiredField]).trim() === "") {
      errors.push(`Configuración global › ${section}.${requiredField}: no puede quedar vacío.`);
    }
  }

  for (const field of booleanFields) {
    if (!(field in input)) continue;
    const raw = input[field];
    if (typeof raw !== "boolean") {
      errors.push(`Configuración global › ${section}.${field}: se esperaba true o false.`);
      continue;
    }
    result[field] = raw;
  }

  return Object.keys(result).length ? result : undefined;
}

/**
 * Valida el cuerpo de `PUT /api/admin/settings`.
 * Acepta el objeto de ajustes completo o un parche parcial por secciones.
 */
export function validateSettingsPayload(input: unknown): SettingsValidationResult {
  const errors: string[] = [];

  if (!isPlainObject(input)) {
    return { ok: false, errors: ["Configuración global: se esperaba un objeto de ajustes."] };
  }

  const known = new Set<string>(SETTINGS_SECTIONS);
  for (const key of Object.keys(input)) {
    if (!known.has(key)) errors.push(`Configuración global › ${key}: sección desconocida.`);
  }

  const value: Record<string, unknown> = {};
  for (const section of SETTINGS_SECTIONS) {
    if (!(section in input)) continue;
    const normalized = normalizeSection(section, input[section], errors);
    if (normalized) value[section] = normalized;
  }

  if (errors.length) return { ok: false, errors };
  return { ok: true, value: value as Partial<SiteSettings> };
}
