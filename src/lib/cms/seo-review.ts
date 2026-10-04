import { createAdminClient } from "../supabase/admin";
import { getSeoContentFields, getSeoWarnings, type SeoContentKind, type SeoContentSource, type SeoPeer } from "../seo/content";
import { canonicalMenuPath, offeringBase } from "./menu-routing";
import { isPastDueExpiration } from "./offering-expiration";
import { getPublicSectionRoutes } from "./public-section-routes";
import { getSettings } from "./settings";

export const SEO_DUPLICATES_UNVERIFIED = "No se pudieron verificar los duplicados SEO del contenido publicado. Vuelve a intentar la revision.";

export async function getPublishedSeoPeers(): Promise<SeoPeer[]> {
  // An anonymous/RLS-filtered empty result cannot verify all published peers.
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("No se puede verificar el SEO publicado sin acceso administrativo a Supabase.");
  }
  const supabase = createAdminClient();
  const [routes, settings] = await Promise.all([getPublicSectionRoutes(), getSettings()]);
  const site = { siteName: settings.site.site_name, defaultSeoDescription: settings.seo.default_seo_description };
  const sources = [
    { table: "blog_posts", kind: "blog_post", columns: "id,slug,title,excerpt,seo_title,seo_description", base: "/blog" },
    { table: "products", kind: "product", columns: "id,slug,name,excerpt,description,seo_title,seo_description", base: "/shop" },
    { table: "offerings", kind: "offering", columns: "id,slug,type,title,excerpt,seo_title,seo_description,expiration_enabled,expires_at", base: "" },
    { table: "landing_pages", kind: "landing_page", columns: "id,slug,title,hero_subtitle,intro_text,seo_title,seo_description", base: "/landing" },
  ] as const;
  const now = new Date();
  const groups = await Promise.all(sources.map(async (source) => {
    const peers: SeoPeer[] = [];
    const ids = new Set<string>();
    let offset = 0;
    let total: number | undefined;
    do {
      const { data, error, count } = await supabase.from(source.table)
        .select(source.columns, { count: "exact" })
        .eq("status", "published").is("deleted_at", null)
        .order("id", { ascending: true }).range(offset, offset + 999);
      if (error) throw new Error(`No se pudo verificar el SEO publicado de ${source.table}.`);
      if (count === null || count === undefined || (total !== undefined && total !== count)) {
        throw new Error(`No se pudo verificar el listado completo de ${source.table}.`);
      }
      total = count;
      const rows = (data ?? []) as unknown as Array<SeoContentSource & {
        id: string; slug: string; type?: string; expiration_enabled?: boolean; expires_at?: string | null;
      }>;
      if ((!rows.length && offset < total) || offset + rows.length > total) {
        throw new Error(`El listado SEO de ${source.table} esta incompleto. Reintenta la revision.`);
      }
      for (const row of rows) {
        if (ids.has(row.id)) throw new Error(`El listado SEO de ${source.table} cambio durante la revision.`);
        ids.add(row.id);
        if (source.kind === "offering" && row.expiration_enabled && (!row.expires_at || !Number.isFinite(Date.parse(row.expires_at)))) continue;
        if (source.kind === "offering" && isPastDueExpiration({
          expiration_enabled: row.expiration_enabled === true, expires_at: row.expires_at ?? null,
        }, now)) continue;
        const base = source.kind === "offering" ? offeringBase(row.type ?? "") : source.base;
        peers.push({
          ...getSeoContentFields(source.kind, row, site),
          id: row.id, kind: source.kind,
          label: (source.kind === "product" ? row.name : row.title) || row.slug,
          path: canonicalMenuPath(`${base}/${row.slug}`, routes),
        });
      }
      // Advance by the actual page size, even when Supabase caps it below 1000.
      offset += rows.length;
    } while (offset < total);
    return peers;
  }));
  return groups.flat();
}

export async function getSeoContentWarnings(kind: SeoContentKind, item: SeoContentSource | null | undefined): Promise<string[]> {
  if (!item) return [];
  const fields = getSeoContentFields(kind, item);
  try {
    const settings = await getSettings();
    return getSeoWarnings(getSeoContentFields(kind, item, {
      siteName: settings.site.site_name, defaultSeoDescription: settings.seo.default_seo_description,
    }), await getPublishedSeoPeers());
  } catch {
    return [...getSeoWarnings(fields), SEO_DUPLICATES_UNVERIFIED];
  }
}
