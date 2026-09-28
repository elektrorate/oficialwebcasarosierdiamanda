/**
 * Lectura del flag de mantenimiento para el proxy (Edge runtime).
 *
 * Usa `fetch` directo contra la API REST de Supabase con la clave anónima
 * (`site_settings` tiene política de lectura pública) en lugar del cliente admin,
 * para no arrastrar el SDK a Edge. Ante cualquier error devuelve `false`:
 * nunca se bloquea el sitio por un fallo de lectura.
 */

import { normalizeSiteLanguage } from "@/lib/seo/site-language";

const READ_TIMEOUT_MS = 1_500;

export type MaintenanceSnapshot = {
  maintenanceMode: boolean;
  siteName: string;
  language: string;
};

const DISABLED: MaintenanceSnapshot = {
  maintenanceMode: false,
  siteName: "Casa Rosier",
  language: "es",
};

export async function readMaintenanceSnapshot(): Promise<MaintenanceSnapshot> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return DISABLED;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), READ_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${url.replace(/\/+$/, "")}/rest/v1/site_settings?select=maintenance_mode,site_name,default_language&order=updated_at.desc&limit=1`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          Accept: "application/json",
        },
        cache: "no-store",
        signal: controller.signal,
      },
    );
    if (!response.ok) return DISABLED;
    const rows = (await response.json()) as Array<{
      maintenance_mode?: unknown;
      site_name?: unknown;
      default_language?: unknown;
    }>;
    const row = rows[0];
    if (!row) return DISABLED;
    return {
      maintenanceMode: row.maintenance_mode === true,
      siteName:
        typeof row.site_name === "string" && row.site_name.trim()
          ? row.site_name.trim()
          : DISABLED.siteName,
      language: normalizeSiteLanguage(row.default_language),
    };
  } catch {
    return DISABLED;
  } finally {
    clearTimeout(timeout);
  }
}

/** Idioma del sitio para la página de mantenimiento. */
export function maintenanceLocale(language: unknown) {
  return normalizeSiteLanguage(language);
}
