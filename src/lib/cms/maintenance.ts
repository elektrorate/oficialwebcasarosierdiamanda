/**
 * Modo mantenimiento.
 *
 * Decisión (pura y testeable) de qué rutas se bloquean y cómo se responde.
 *
 * Decisiones explícitas:
 * - Se bloquean SOLO las páginas públicas.
 * - Quedan siempre accesibles: `/admin` (CMS), `/auth` (inicio de sesión),
 *   `/api` (integraciones, formularios, webhooks) y los recursos estáticos.
 * - APIs e integraciones NO se interrumpen: el matcher del proxy ya excluye
 *   `/api` y los ficheros estáticos, y aquí se mantienen esos Huecos.
 * - Si no se puede leer el ajuste, se deja pasar la petición (fail-open): un
 *   fallo de red nunca debe tumbar el sitio.
 */

export const MAINTENANCE_STATUS = 503;

export const MAINTENANCE_EXEMPT_PREFIXES = [
  "/admin",
  "/auth",
  "/api",
  "/_next",
] as const;

/** Recursos que deben seguir cargándose durante el mantenimiento. */
export const MAINTENANCE_EXEMPT_FILES = [
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.json",
  "/sw.js",
] as const;

const STATIC_ASSET = /\.(?:svg|png|jpe?g|gif|webp|ico|css|js|mjs|map|woff2?|ttf|pdf|xml|txt|webmanifest)$/i;

export function isMaintenanceExemptPath(pathname: string): boolean {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (STATIC_ASSET.test(path)) return true;
  if (MAINTENANCE_EXEMPT_FILES.includes(path as (typeof MAINTENANCE_EXEMPT_FILES)[number])) {
    return true;
  }
  return MAINTENANCE_EXEMPT_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

export type MaintenanceDecision = "allow" | "block";

export function resolveMaintenanceDecision(input: {
  maintenanceMode: boolean;
  pathname: string;
}): MaintenanceDecision {
  if (!input.maintenanceMode) return "allow";
  if (isMaintenanceExemptPath(input.pathname)) return "allow";
  return "block";
}

const MAINTENANCE_PAGE_STYLE = `body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#faf9f6;color:#1a1a1a;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0}main{max-width:34rem;padding:2.5rem;text-align:center}h1{font-size:1.5rem;font-weight:600;margin:0 0 .75rem}p{line-height:1.6;color:#57534e;margin:0 0 1rem}`;

export function maintenancePageHtml(siteName: string, locale = "es") {
  const escape = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const copy =
    locale === "es"
      ? {
          title: "Estamos Actualizando",
          body: "Este taller está en mantenimiento. Vuelve en unos minutos.",
        }
      : {
          title: "We are updating",
          body: "This site is under maintenance. Please come back in a few minutes.",
        };

  return `<!DOCTYPE html>
<html lang="${escape(locale)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${escape(copy.title)} | ${escape(siteName)}</title>
<style>${MAINTENANCE_PAGE_STYLE}</style>
</head>
<body><main><h1>${escape(copy.title)}</h1><p>${escape(copy.body)}</p></main></body>
</html>`;
}

export const MAINTENANCE_RESPONSE_HEADERS: Record<string, string> = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-store, no-cache, must-revalidate",
  "Retry-After": "300",
  "X-Robots-Tag": "noindex, nofollow",
};
