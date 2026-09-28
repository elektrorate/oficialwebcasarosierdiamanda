/**
 * Directivas robots del sitio.
 *
 * `robots_index` y `robots_follow` se aplican de forma INDEPENDIENTE:
 * - index:false  → `<meta name="robots" content="noindex">` (+ robots.txt bloquea)
 * - follow:false → `<meta name="robots" content="nofollow">` (robots.txt no puede
 *   expresar `nofollow`, por eso no se usa como equivalente).
 *
 * El SEO específico de cada página puede sobrescribir este valor por completo
 * (Next.js reemplaza el objeto `robots` del layout padre, no lo fusiona).
 */

export type SiteRobotsSettings = {
  robots_index: boolean;
  robots_follow: boolean;
};

export type ResolvedRobots = {
  index: boolean;
  follow: boolean;
};

export const DEFAULT_SITE_ROBOTS: ResolvedRobots = {
  index: true,
  follow: true,
};

/** Normaliza valores que puedan venir como string/boolean desde el cuerpo JSON. */
export function resolveSiteRobots(value: Partial<SiteRobotsSettings> | null | undefined): ResolvedRobots {
  return {
    index: value?.robots_index !== false,
    follow: value?.robots_follow !== false,
  };
}

/** Ambos por defecto (index+follow) o solo una restricción explícita. */
export function robotsContent(robots: ResolvedRobots): string {
  const directives: string[] = [];
  if (!robots.index) directives.push("noindex");
  if (!robots.follow) directives.push("nofollow");
  if (directives.length === 0) return "index, follow";
  if (directives.length === 2) return "noindex, nofollow";
  return directives[0];
}

/** Objeto `robots` para `generateMetadata`; `null` cuando no hay restricción. */
export function resolveRobotsMetadata(
  value: Partial<SiteRobotsSettings> | null | undefined,
): { index: boolean; follow: boolean } | null {
  const robots = resolveSiteRobots(value);
  if (robots.index && robots.follow) return null;
  return robots;
}
