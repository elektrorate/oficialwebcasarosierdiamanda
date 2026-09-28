/**
 * Idioma declarado del documento a partir de `site.default_language`.
 *
 * IMPORTANTE: este ajuste NO traduce el contenido del CMS. Solo declara el
 * idioma del documento y de los metadatos relacionados (html[lang], og:locale).
 */

export const DEFAULT_SITE_LANGUAGE = "es";

const LANGUAGE_TAGS = [
  "es",
  "en",
  "ca",
  "fr",
  "de",
  "it",
  "pt",
  "nl",
  "eu",
  "gl",
  "pl",
] as const;

/** Acepta `es`, `ES`, `es-ES`, `es_ES`; devuelve siempre minúsculas. */
export function normalizeSiteLanguage(value: unknown): string {
  if (typeof value !== "string") return DEFAULT_SITE_LANGUAGE;
  const [tag] = value.trim().toLowerCase().replace(/_/g, "-").split("-");
  if (!tag) return DEFAULT_SITE_LANGUAGE;
  if (!(LANGUAGE_TAGS as readonly string[]).includes(tag)) return DEFAULT_SITE_LANGUAGE;
  return tag;
}

export function isSupportedSiteLanguage(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const [tag] = value.trim().toLowerCase().replace(/_/g, "-").split("-");
  return Boolean(tag) && (LANGUAGE_TAGS as readonly string[]).includes(tag as string);
}

/** `es` → `es` (para el atributo html[lang]). */
export function siteHtmlLang(value: unknown): string {
  return normalizeSiteLanguage(value);
}

/** `es` → `es_ES` (para openGraph.locale). */
export function siteOpenGraphLocale(value: unknown): string {
  const language = normalizeSiteLanguage(value);
  const region: Record<string, string> = {
    es: "ES",
    en: "GB",
    ca: "ES",
    eu: "ES",
    gl: "ES",
    fr: "FR",
    de: "DE",
    it: "IT",
    pt: "PT",
    nl: "NL",
    pl: "PL",
  };
  return `${language}_${region[language] ?? "ES"}`;
}

/** `es` → `es-ES`, para formateadores `Intl`. */
export function siteIntlLocale(value: unknown): string {
  const language = normalizeSiteLanguage(value);
  const region: Record<string, string> = {
    es: "ES",
    en: "GB",
    ca: "ES",
    eu: "ES",
    gl: "ES",
    fr: "FR",
    de: "DE",
    it: "IT",
    pt: "PT",
    nl: "NL",
    pl: "PL",
  };
  return `${language}-${region[language] ?? "ES"}`;
}
