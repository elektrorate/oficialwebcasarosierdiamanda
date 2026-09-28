import { formatSiteDateBadge, resolveSiteTimeZone } from "@/lib/seo/site-timezone";

/** Badge overlay on feed images, e.g. "JUNIO 21". */
export function formatBlogDateBadge(value: string, timeZone?: string) {
  return formatSiteDateBadge(value, resolveSiteTimeZone(timeZone));
}
