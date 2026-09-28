import { formatSiteDate, resolveSiteTimeZone } from "@/lib/seo/site-timezone";

/**
 * Formatea una fecha pública en la zona horaria global del sitio.
 * La zona se pasa explícitamente (nunca la del navegador) para que servidor y
 * cliente generen exactamente la misma cadena y no haya errores de hidratación.
 */
export function formatDate(value: string, timeZone?: string) {
  return formatSiteDate(value, resolveSiteTimeZone(timeZone));
}

export function classNames(
  ...values: Array<string | false | null | undefined>
) {
  return values.filter(Boolean).join(" ");
}
