/**
 * Zona horaria global del sitio.
 * Módulo puro: valida y normaliza el valor guardado en Configuración global y
 * ofrece formateadores deterministas (misma zona en servidor y cliente, para no
 * provocar diferencias de hidratación).
 */

export const DEFAULT_SITE_TIME_ZONE = "Europe/Madrid";

const knownTimeZones = new Set<string>();

/** IANA admite `Area/Region`; también se cachean las que expone el runtime. */
function timeZoneExists(timeZone: string) {
  if (knownTimeZones.has(timeZone)) return true;
  try {
    new Intl.DateTimeFormat("es-ES", { timeZone }).format(new Date(0));
    knownTimeZones.add(timeZone);
    return true;
  } catch {
    return false;
  }
}

export function isValidTimeZone(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  return timeZoneExists(trimmed);
}

/** Devuelve una zona horaria válida o el respaldo, nunca un valor inservible. */
export function resolveSiteTimeZone(value: unknown): string {
  return isValidTimeZone(value) ? (value as string).trim() : DEFAULT_SITE_TIME_ZONE;
}

export function formatSiteDate(
  value: string | Date | null | undefined,
  timeZone: string,
  locale = "es-ES",
) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: resolveSiteTimeZone(timeZone),
  }).format(date);
}

export function formatSiteDateBadge(
  value: string | Date | null | undefined,
  timeZone: string,
  locale = "es-ES",
) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const zone = resolveSiteTimeZone(timeZone);
  const month = new Intl.DateTimeFormat(locale, { month: "long", timeZone: zone })
    .format(date)
    .replace(/\./g, "")
    .toUpperCase();
  const day = new Intl.DateTimeFormat(locale, { day: "numeric", timeZone: zone }).format(date);
  return `${month} ${day}`;
}
