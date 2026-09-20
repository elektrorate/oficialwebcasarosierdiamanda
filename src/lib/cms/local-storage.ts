import { createAdminClient } from "../supabase/admin";

type JsonRecord = Record<string, unknown>;

const SIMPLE_FILES: Record<string, string> = {
  "coupons.json": "coupons",
  "faqs.json": "faqs",
  "footers.json": "footers",
  "form-submissions.json": "form_submissions",
  "headers.json": "headers",
  "history-logs.json": "history_logs",
  "internal-links.json": "internal_links",
  "media.json": "media_assets",
  "offerings.json": "offerings",
  "pages.json": "pages",
  "product-categories.json": "product_categories",
  "products.json": "products",
  "promo-banners.json": "promo_banners",
  "redirects.json": "redirects",
  "reservations.json": "reservations",
  "shipping-methods.json": "shipping_methods",
  "teachers.json": "teachers",
  "testimonials.json": "testimonials",
  "trash.json": "trash_items",
};

const SINGLETON_IDS = {
  settings: "00000000-0000-0000-0000-000000000001",
  legal: "00000000-0000-0000-0000-000000000003",
};

const READ_CACHE_TTL_MS = 10_000;
const readCache = new Map<string, { value: unknown; expiresAt: number }>();

function getCachedRead<T>(filename: string) {
  const cached = readCache.get(filename);
  if (!cached || cached.expiresAt <= Date.now()) return null;
  return cached.value as T;
}

function setCachedRead(filename: string, value: unknown) {
  readCache.set(filename, { value, expiresAt: Date.now() + READ_CACHE_TTL_MS });
}

export function resolveDataPath(filename: string) {
  return `supabase:${filename}`;
}

function omit<T extends JsonRecord>(record: T, keys: string[]) {
  const next = { ...record };
  for (const key of keys) delete next[key];
  return next;
}

function asRows(value: unknown): JsonRecord[] {
  if (Array.isArray(value)) return value as JsonRecord[];
  if (value && typeof value === "object") return [value as JsonRecord];
  return [];
}

function cleanRows(value: unknown, nestedKeys: string[] = []) {
  return asRows(value).map((row) => omit(row, nestedKeys));
}

function nilToNull(value: unknown) {
  return value === "" || value === undefined ? null : value;
}

async function selectAll(table: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from(table).select("*");
  if (error) throw error;
  return (data ?? []) as JsonRecord[];
}

async function upsertRows(table: string, rows: JsonRecord[]) {
  if (!rows.length) return;
  const supabase = createAdminClient();
  const { error } = await supabase.from(table).upsert(rows, { onConflict: "id" });
  if (error) throw error;
}

async function replaceChildren(table: string, parentColumn: string, parentIds: string[], rows: JsonRecord[]) {
  const supabase = createAdminClient();
  if (parentIds.length) {
    const { error } = await supabase.from(table).delete().in(parentColumn, parentIds);
    if (error) throw error;
  }
  await upsertRows(table, rows);
}

async function readWithChildren(parentTable: string, childTable: string, parentColumn: string, childKey: string) {
  const supabase = createAdminClient();
  const [{ data: parents, error: parentError }, { data: children, error: childError }] = await Promise.all([
    supabase.from(parentTable).select("*"),
    supabase.from(childTable).select("*").order("sort_order", { ascending: true }),
  ]);
  if (parentError) throw parentError;
  if (childError) throw childError;

  const byParent = new Map<string, JsonRecord[]>();
  for (const child of (children ?? []) as JsonRecord[]) {
    const parentId = String(child[parentColumn] ?? "");
    const rest = { ...child };
    delete rest[parentColumn];
    const list = byParent.get(parentId) ?? [];
    list.push(rest);
    byParent.set(parentId, list);
  }

  return ((parents ?? []) as JsonRecord[]).map((parent) => ({
    ...parent,
    [childKey]: byParent.get(String(parent.id)) ?? [],
  }));
}

async function writeWithChildren(
  parentTable: string,
  childTable: string,
  parentColumn: string,
  childKey: string,
  value: unknown,
) {
  const parents = cleanRows(value, [childKey]);
  const children = asRows(value).flatMap((parent) =>
    asRows(parent[childKey]).map((child, index) => ({
      ...child,
      [parentColumn]: parent.id,
      sort_order: child.sort_order ?? index,
    })),
  );
  await upsertRows(parentTable, parents);
  await replaceChildren(childTable, parentColumn, parents.map((parent) => String(parent.id)), children);
}

function settingsToRow(settings: JsonRecord) {
  const site = (settings.site ?? {}) as JsonRecord;
  const contact = (settings.contact ?? {}) as JsonRecord;
  const menu = (settings.menu ?? {}) as JsonRecord;
  const social = (settings.social ?? {}) as JsonRecord;
  const footer = (settings.footer ?? {}) as JsonRecord;
  const seo = (settings.seo ?? {}) as JsonRecord;
  const system = (settings.system ?? {}) as JsonRecord;

  return {
    id: SINGLETON_IDS.settings,
    site_name: site.site_name ?? "Casa Rosier",
    site_description: nilToNull(site.site_description),
    logo_url: nilToNull(site.logo_url),
    favicon_url: nilToNull(site.favicon_url),
    header_logo_url: nilToNull(menu.header_logo_url),
    scroll_menu_background_color: menu.scroll_menu_background_color ?? "#8c7457",
    scroll_menu_text_color: menu.scroll_menu_text_color ?? "#fff9f1",
    scroll_menu_icon_color: menu.scroll_menu_icon_color ?? "#fff9f1",
    scroll_menu_logo_tint_enabled: menu.scroll_menu_logo_tint_enabled ?? false,
    scroll_menu_logo_tint_color: menu.scroll_menu_logo_tint_color ?? "#fff9f1",
    default_language: site.default_language ?? "es",
    timezone: site.timezone ?? "Europe/Madrid",
    email: nilToNull(contact.email),
    phone: nilToNull(contact.phone),
    whatsapp: nilToNull(contact.whatsapp),
    address: nilToNull(contact.address),
    city: contact.city ?? "Barcelona",
    country: contact.country ?? "España",
    map_url: nilToNull(contact.map_url),
    instagram_url: nilToNull(social.instagram_url),
    tiktok_url: nilToNull(social.tiktok_url),
    facebook_url: nilToNull(social.facebook_url),
    youtube_url: nilToNull(social.youtube_url),
    pinterest_url: nilToNull(social.pinterest_url),
    footer_logo_url: nilToNull(footer.footer_logo_url),
    footer_text: nilToNull(footer.footer_text),
    legal_text: nilToNull(footer.legal_text),
    show_social_links: footer.show_social_links ?? true,
    show_contact_info: footer.show_contact_info ?? true,
    default_seo_title: nilToNull(seo.default_seo_title),
    default_seo_description: nilToNull(seo.default_seo_description),
    default_og_image_url: nilToNull(seo.default_og_image_url),
    robots_index: seo.robots_index ?? true,
    robots_follow: seo.robots_follow ?? true,
    maintenance_mode: system.maintenance_mode ?? false,
    updated_at: system.updated_at ?? new Date().toISOString(),
  };
}

function legalToRow(settings: JsonRecord) {
  return {
    id: SINGLETON_IDS.legal,
    banner_enabled: settings.cookies_banner_enabled ?? true,
    banner_text: nilToNull(settings.cookies_banner_text),
    cookies_banner_title: nilToNull(settings.cookies_banner_title),
    cookies_banner_text: nilToNull(settings.cookies_banner_text),
    accept_button_text: settings.accept_button_text ?? "Aceptar todas",
    reject_button_text: settings.reject_button_text ?? "Rechazar",
    preferences_button_text: settings.preferences_button_text ?? "Preferencias",
    consent_categories: [],
    analytics_consent_required: settings.analytics_consent_required ?? true,
    marketing_consent_required: settings.marketing_consent_required ?? true,
    functional_consent_required: settings.functional_consent_required ?? false,
    privacy_policy_title: nilToNull(settings.privacy_policy_title),
    privacy_policy_content: nilToNull(settings.privacy_policy_content),
    cookies_policy_title: nilToNull(settings.cookies_policy_title),
    cookies_policy_content: nilToNull(settings.cookies_policy_content),
    legal_notice_title: nilToNull(settings.legal_notice_title),
    legal_notice_content: nilToNull(settings.legal_notice_content),
    terms_title: nilToNull(settings.terms_title),
    terms_content: nilToNull(settings.terms_content),
    purchase_terms_content: nilToNull(settings.purchase_terms_content),
    consent_mode_enabled: settings.consent_mode_enabled ?? false,
    google_consent_mode_enabled: settings.google_consent_mode_enabled ?? false,
    meta_consent_mode_enabled: settings.meta_consent_mode_enabled ?? false,
    updated_at: settings.updated_at ?? new Date().toISOString(),
  };
}

export async function readJsonFile<T>(filename: string, fallback: T): Promise<T> {
  const cached = getCachedRead<T>(filename);
  if (cached) return cached;

  try {
    let value: T;
    if (filename === "blog-posts.json") value = await readWithChildren("blog_posts", "blog_post_blocks", "blog_post_id", "blocks") as T;
    else if (filename === "forms.json") value = await readWithChildren("forms", "form_fields", "form_id", "fields") as T;
    else if (filename === "landing-pages.json") value = await readWithChildren("landing_pages", "landing_page_blocks", "landing_page_id", "blocks") as T;
    else if (filename === "menus.json") value = await readWithChildren("menus", "menu_items", "menu_id", "items") as T;
    else if (filename === "social-galleries.json") value = await readWithChildren("social_galleries", "social_gallery_items", "social_gallery_id", "items") as T;
    else if (filename === "orders.json") value = await readWithChildren("orders", "order_items", "order_id", "items") as T;
    else {
      const table = SIMPLE_FILES[filename];
      if (!table) return fallback;
      value = await selectAll(table) as T;
    }

    setCachedRead(filename, value);
    return value;
  } catch {
    return fallback;
  }
}

/** Drop cached CMS JSON reads so the next `readJsonFile` hits Supabase again. */
export function invalidateJsonCache(filename?: string) {
  if (filename) {
    readCache.delete(filename);
    return;
  }
  readCache.clear();
}

/** Keep list caches warm after a single-row insert without rewriting the whole table. */
export function prependJsonCacheItem<T extends { id: string }>(filename: string, item: T) {
  const cached = getCachedRead<T[]>(filename);
  if (!Array.isArray(cached)) {
    invalidateJsonCache(filename);
    return;
  }
  setCachedRead(
    filename,
    [item, ...cached.filter((row) => row.id !== item.id)],
  );
}

export async function writeJsonFile<T>(filename: string, value: T) {
  setCachedRead(filename, value);

  if (filename === "blog-posts.json") return writeWithChildren("blog_posts", "blog_post_blocks", "blog_post_id", "blocks", value);
  if (filename === "forms.json") return writeWithChildren("forms", "form_fields", "form_id", "fields", value);
  if (filename === "landing-pages.json") return writeWithChildren("landing_pages", "landing_page_blocks", "landing_page_id", "blocks", value);
  if (filename === "menus.json") return writeWithChildren("menus", "menu_items", "menu_id", "items", value);
  if (filename === "social-galleries.json") return writeWithChildren("social_galleries", "social_gallery_items", "social_gallery_id", "items", value);
  if (filename === "orders.json") return writeWithChildren("orders", "order_items", "order_id", "items", value);
  if (filename === "settings.json") return upsertRows("site_settings", [settingsToRow(value as JsonRecord)]);
  if (filename === "legal-settings.json") return upsertRows("legal_settings", [legalToRow(value as JsonRecord)]);

  const table = SIMPLE_FILES[filename];
  if (!table) {
    throw new Error(`No SQL table mapping configured for ${filename}.`);
  }
  await upsertRows(table, cleanRows(value));
}
