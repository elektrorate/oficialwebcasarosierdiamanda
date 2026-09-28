import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data");
const PUBLIC_DIR = path.join(ROOT, "public");
const BUCKET = "media";

const SINGLETON_IDS = {
  site_settings: "00000000-0000-0000-0000-000000000001",
  marketing_settings: "00000000-0000-0000-0000-000000000002",
  legal_settings: "00000000-0000-0000-0000-000000000003",
};

const SIMPLE_FILES = {
  "coupons.json": "coupons",
  "faqs.json": "faqs",
  "footers.json": "footers",
  "form-submissions.json": "form_submissions",
  "headers.json": "headers",
  "history-logs.json": "history_logs",
  "media.json": "media_assets",
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

function loadEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    let value = rawValue.trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function readJson(fileName, fallback = []) {
  const filePath = path.join(DATA_DIR, fileName);
  if (!existsSync(filePath)) return fallback;
  const parsed = JSON.parse(readFileSync(filePath, "utf8"));
  return parsed ?? fallback;
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (!value || Object.keys(value).length === 0) return [];
  return [value];
}

function omit(record, keys) {
  const next = { ...record };
  for (const key of keys) delete next[key];
  return next;
}

function isUuid(value) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function stableUuid(value) {
  const hex = createHash("sha256").update(String(value)).digest("hex").slice(0, 32).split("");
  hex[12] = "5";
  hex[16] = ((Number.parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  return `${hex.slice(0, 8).join("")}-${hex.slice(8, 12).join("")}-${hex.slice(12, 16).join("")}-${hex.slice(16, 20).join("")}-${hex.slice(20, 32).join("")}`;
}

function sqlId(value) {
  if (!value) return value;
  return isUuid(value) ? value : stableUuid(value);
}

function normalizeSqlId(row) {
  if (!row?.id) return row;
  return { ...row, id: sqlId(row.id) };
}

function nilToNull(value) {
  if (value === "") return null;
  return value ?? null;
}

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    ".avif": "image/avif",
    ".gif": "image/gif",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
  }[ext] ?? "application/octet-stream";
}

function walkFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(absolutePath) : [absolutePath];
  });
}

async function ensureBucket(supabase) {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw listError;
  if (buckets.some((bucket) => bucket.name === BUCKET)) return;

  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: [
      "application/pdf",
      "image/avif",
      "image/gif",
      "image/jpeg",
      "image/png",
      "image/svg+xml",
      "image/webp",
    ],
  });
  if (error) throw error;
}

async function upsertRows(supabase, table, rows, options = {}) {
  if (!rows.length) return 0;
  const { error } = await supabase.from(table).upsert(rows, { onConflict: options.onConflict ?? "id" });
  if (error) throw new Error(`${table}: ${error.message}`);
  return rows.length;
}

async function replaceChildren(supabase, table, parentColumn, parentIds, rows) {
  if (parentIds.length) {
    const { error } = await supabase.from(table).delete().in(parentColumn, parentIds);
    if (error) throw new Error(`${table} delete: ${error.message}`);
  }
  return upsertRows(supabase, table, rows);
}

function flattenSettings(settings) {
  return {
    id: SINGLETON_IDS.site_settings,
    site_name: settings.site?.site_name ?? "Casa Rosier",
    site_description: nilToNull(settings.site?.site_description),
    logo_url: nilToNull(settings.site?.logo_url),
    favicon_url: nilToNull(settings.site?.favicon_url),
    header_logo_url: nilToNull(settings.menu?.header_logo_url),
    scroll_menu_background_color: settings.menu?.scroll_menu_background_color ?? "#f9f8f3",
    scroll_menu_text_color: settings.menu?.scroll_menu_text_color ?? "#3f3933",
    scroll_menu_icon_color: settings.menu?.scroll_menu_icon_color ?? settings.menu?.scroll_menu_text_color ?? "#3f3933",
    scroll_menu_logo_tint_enabled: settings.menu?.scroll_menu_logo_tint_enabled ?? false,
    scroll_menu_logo_tint_color: settings.menu?.scroll_menu_logo_tint_color ?? settings.menu?.scroll_menu_icon_color ?? "#3f3933",
    default_language: settings.site?.default_language ?? "es",
    timezone: settings.site?.timezone ?? "Europe/Madrid",
    email: nilToNull(settings.contact?.email),
    phone: nilToNull(settings.contact?.phone),
    whatsapp: nilToNull(settings.contact?.whatsapp),
    address: nilToNull(settings.contact?.address),
    city: settings.contact?.city ?? "Barcelona",
    country: settings.contact?.country ?? "España",
    map_url: nilToNull(settings.contact?.map_url),
    instagram_url: nilToNull(settings.social?.instagram_url),
    tiktok_url: nilToNull(settings.social?.tiktok_url),
    facebook_url: nilToNull(settings.social?.facebook_url),
    youtube_url: nilToNull(settings.social?.youtube_url),
    pinterest_url: nilToNull(settings.social?.pinterest_url),
    footer_logo_url: nilToNull(settings.footer?.footer_logo_url),
    footer_text: nilToNull(settings.footer?.footer_text),
    legal_text: nilToNull(settings.footer?.legal_text),
    show_social_links: settings.footer?.show_social_links ?? true,
    show_contact_info: settings.footer?.show_contact_info ?? true,
    maintenance_mode: settings.system?.maintenance_mode ?? false,
    default_seo_title: nilToNull(settings.seo?.default_seo_title),
    default_seo_description: nilToNull(settings.seo?.default_seo_description),
    default_og_image_url: nilToNull(settings.seo?.default_og_image_url),
    robots_index: settings.seo?.robots_index ?? true,
    robots_follow: settings.seo?.robots_follow ?? true,
    updated_at: settings.system?.updated_at || new Date().toISOString(),
  };
}

function flattenMarketing(settings) {
  return {
    id: SINGLETON_IDS.marketing_settings,
    analytics_enabled: settings.analytics_enabled ?? false,
    google_analytics_id: nilToNull(settings.ga4_measurement_id),
    gtm_container_id: nilToNull(settings.gtm_container_id),
    google_search_console_id: nilToNull(settings.google_search_console_id),
    microsoft_clarity_id: nilToNull(settings.microsoft_clarity_id),
    meta_pixel_enabled: settings.meta_pixel_enabled ?? false,
    meta_pixel_id: nilToNull(settings.meta_pixel_id),
    meta_conversion_api_enabled: settings.meta_conversion_api_enabled ?? false,
    meta_access_token: nilToNull(settings.meta_access_token),
    meta_dataset_id: nilToNull(settings.meta_dataset_id),
    tiktok_pixel_enabled: settings.tiktok_pixel_enabled ?? false,
    tiktok_pixel_id: nilToNull(settings.tiktok_pixel_id),
    pinterest_tag_enabled: settings.pinterest_tag_enabled ?? false,
    pinterest_tag_id: nilToNull(settings.pinterest_tag_id),
    linkedin_insight_enabled: settings.linkedin_insight_enabled ?? false,
    linkedin_partner_id: nilToNull(settings.linkedin_partner_id),
    seo_global_title: nilToNull(settings.seo_global_title),
    seo_global_description: nilToNull(settings.seo_global_description),
    seo_og_image: nilToNull(settings.seo_og_image),
    robots_enabled: settings.robots_enabled ?? true,
    sitemap_enabled: settings.sitemap_enabled ?? true,
    schema_enabled: settings.schema_enabled ?? true,
    events: settings.events ?? [],
    utm_builder_enabled: settings.utm_builder_enabled ?? false,
    automation_webhooks_enabled: settings.automation_webhooks_enabled ?? false,
    webhook_url: nilToNull(settings.webhook_url),
    updated_at: settings.updated_at || new Date().toISOString(),
  };
}

function flattenLegal(settings) {
  return {
    id: SINGLETON_IDS.legal_settings,
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
    updated_at: settings.updated_at || new Date().toISOString(),
  };
}

function dayOfWeek(scheduleText) {
  const lower = scheduleText.toLowerCase();
  if (lower.startsWith("domingo")) return 0;
  if (lower.startsWith("lunes")) return 1;
  if (lower.startsWith("martes")) return 2;
  if (lower.startsWith("miercoles") || lower.startsWith("miércoles")) return 3;
  if (lower.startsWith("jueves")) return 4;
  if (lower.startsWith("viernes")) return 5;
  if (lower.startsWith("sabado") || lower.startsWith("sábado")) return 6;
  return null;
}

function timeRange(scheduleText) {
  const match = scheduleText.match(/(\d{1,2}:\d{2})\s*a\s*(\d{1,2}:\d{2})/i);
  return match ? { start_time: match[1], end_time: match[2] } : { start_time: null, end_time: null };
}

async function seedSimpleTables(supabase) {
  let total = 0;
  for (const [fileName, table] of Object.entries(SIMPLE_FILES)) {
    const rows = asArray(readJson(fileName)).map((row) => normalizeSqlId({ ...row }));
    total += await upsertRows(supabase, table, rows);
    console.log(`${table}: ${rows.length}`);
  }
  return total;
}

async function seedPages(supabase) {
  const pagesSource = asArray(readJson("pages.json"));
  const pages = pagesSource.map((page) => normalizeSqlId(omit(page, ["blocks"])));
  const blocks = asArray(readJson("pages.json")).flatMap((page) =>
    (page.blocks ?? []).map((block, index) => normalizeSqlId({ ...block, page_id: sqlId(page.id), sort_order: block.sort_order ?? index })),
  );
  await upsertRows(supabase, "pages", pages);
  await replaceChildren(supabase, "page_blocks", "page_id", pages.map((page) => page.id), blocks);
  console.log(`pages: ${pages.length}; page_blocks: ${blocks.length}`);
  return pages.length + blocks.length;
}

async function seedLandingPages(supabase) {
  const landingPagesSource = asArray(readJson("landing-pages.json"));
  const landingPages = landingPagesSource.map((page) => normalizeSqlId(omit(page, ["blocks"])));
  const blocks = asArray(readJson("landing-pages.json")).flatMap((page) =>
    (page.blocks ?? []).map((block, index) => normalizeSqlId({ ...block, landing_page_id: sqlId(page.id), sort_order: block.sort_order ?? index })),
  );
  await upsertRows(supabase, "landing_pages", landingPages);
  await replaceChildren(supabase, "landing_page_blocks", "landing_page_id", landingPages.map((page) => page.id), blocks);
  console.log(`landing_pages: ${landingPages.length}; landing_page_blocks: ${blocks.length}`);
  return landingPages.length + blocks.length;
}

async function seedBlog(supabase) {
  const postsSource = asArray(readJson("blog-posts.json"));
  const posts = postsSource.map((post) => normalizeSqlId(omit(post, ["blocks"])));
  const blocks = postsSource.flatMap((post) =>
    (post.blocks ?? []).map((block, index) => normalizeSqlId({ ...block, blog_post_id: sqlId(post.id), sort_order: block.sort_order ?? index })),
  );
  await upsertRows(supabase, "blog_posts", posts);
  await replaceChildren(supabase, "blog_post_blocks", "blog_post_id", posts.map((post) => post.id), blocks);
  console.log(`blog_posts: ${posts.length}; blog_post_blocks: ${blocks.length}`);
  return posts.length + blocks.length;
}

async function seedForms(supabase) {
  const formsSource = asArray(readJson("forms.json"));
  const forms = formsSource.map((form) => normalizeSqlId(omit(form, ["fields"])));
  const fields = formsSource.flatMap((form) =>
    (form.fields ?? []).map((field, index) => normalizeSqlId({ ...field, form_id: sqlId(form.id), sort_order: field.sort_order ?? index })),
  );
  await upsertRows(supabase, "forms", forms);
  await replaceChildren(supabase, "form_fields", "form_id", forms.map((form) => form.id), fields);
  console.log(`forms: ${forms.length}; form_fields: ${fields.length}`);
  return forms.length + fields.length;
}

async function seedMenus(supabase) {
  const menusSource = asArray(readJson("menus.json"));
  const offerings = asArray(readJson("offerings.json")).filter((offering) => offering.status === "published");
  const menuItemIdMap = new Map();
  const menusWithItems = menusSource.map((menu) => ({
    ...menu,
    items: (menu.items?.length ? menu.items : defaultMenuItems(menu, offerings)),
  }));

  for (const menu of menusWithItems) {
    for (const item of menu.items ?? []) {
      if (item.id) menuItemIdMap.set(item.id, sqlId(item.id));
    }
  }
  const menus = menusWithItems.map((menu) => normalizeSqlId(omit(menu, ["items"])));
  const items = menusWithItems.flatMap((menu) =>
    (menu.items ?? []).map((item, index) => normalizeSqlId({
      ...item,
      menu_id: sqlId(menu.id),
      parent_id: item.parent_id ? menuItemIdMap.get(item.parent_id) ?? sqlId(item.parent_id) : null,
      sort_order: item.sort_order ?? index,
    })),
  );
  await upsertRows(supabase, "menus", menus);
  await replaceChildren(supabase, "menu_items", "menu_id", menus.map((menu) => menu.id), items);
  console.log(`menus: ${menus.length}; menu_items: ${items.length}`);
  return menus.length + items.length;
}

function routeForOffering(offering) {
  if (offering.type === "workshop") return `/workshops/${offering.slug}`;
  if (offering.type === "gift_card") return `/gift-card/${offering.slug}`;
  if (offering.type === "experience") return `/reservas-privadas/${offering.slug}`;
  return `/clases/${offering.slug}`;
}

function defaultMenuItems(menu, offerings) {
  const now = new Date().toISOString();
  const base = (key, label, url, order, parent_id = null) => ({
    id: `${menu.id}:${key}`,
    label,
    type: "internal",
    url,
    linked_entity_type: "none",
    linked_entity_id: "",
    parent_id,
    sort_order: order,
    is_visible: true,
    open_in_new_tab: false,
    created_at: now,
    updated_at: now,
  });
  const childrenFor = (parentKey, type, startOrder) =>
    offerings
      .filter((offering) => offering.type === type)
      .sort((a, b) => String(a.title).localeCompare(String(b.title)))
      .map((offering, index) => ({
        ...base(`${parentKey}:${offering.slug}`, offering.title, routeForOffering(offering), startOrder + index, `${menu.id}:${parentKey}`),
        linked_entity_type: "offering",
        linked_entity_id: sqlId(offering.id),
      }));

  if (menu.location === "footer") {
    return [
      base("inicio", "Inicio", "/#hero", 0),
      base("clases", "Clases", "/clases", 1),
      base("workshops", "Workshops", "/workshops", 2),
      base("experiencias", "Experiencias", "/reservas-privadas", 3),
      base("gift-card", "Gift Cards", "/gift-card", 4),
      base("estudio", "El Estudio", "/el-estudio", 5),
      base("shop", "Shop", "/shop", 6),
      base("privacidad", "Privacidad", "/politica-privacidad", 7),
    ];
  }

  const parents = [
    base("inicio", "Inicio", "/#hero", 0),
    base("clases", "Clases", "/clases", 1),
    base("workshops", "Workshops", "/workshops", 2),
    base("experiencias", "Experiencias", "/reservas-privadas", 3),
    base("gift-card", "Gift Cards", "/gift-card", 4),
    base("estudio", "El Estudio", "/el-estudio", 5),
    base("shop", "Shop", "/shop", 6),
  ];

  return [
    ...parents,
    ...childrenFor("clases", "class", 10),
    ...childrenFor("workshops", "workshop", 30),
    ...childrenFor("experiencias", "experience", 50),
    ...childrenFor("gift-card", "gift_card", 70),
    base("estudio:estudio", "El Estudio", "/el-estudio", 90, `${menu.id}:estudio`),
    base("estudio:bitacora", "Bitácora", "/blog", 91, `${menu.id}:estudio`),
  ];
}

async function seedSocialGalleries(supabase) {
  const galleriesSource = asArray(readJson("social-galleries.json"));
  const galleries = galleriesSource.map((gallery) => normalizeSqlId(omit(gallery, ["items"])));
  const items = galleriesSource.flatMap((gallery) =>
    (gallery.items ?? []).map((item, index) => {
      const { instagram_url, ...rest } = item;
      return normalizeSqlId({
        ...rest,
        url: rest.url ?? instagram_url ?? null,
        social_gallery_id: sqlId(gallery.id),
        sort_order: item.sort_order ?? index,
      });
    }),
  );
  await upsertRows(supabase, "social_galleries", galleries);
  await replaceChildren(supabase, "social_gallery_items", "social_gallery_id", galleries.map((gallery) => gallery.id), items);
  console.log(`social_galleries: ${galleries.length}; social_gallery_items: ${items.length}`);
  return galleries.length + items.length;
}

async function seedOfferings(supabase) {
  const offeringsSource = asArray(readJson("offerings.json"));
  const offerings = offeringsSource.map((offering) => normalizeSqlId({ ...offering }));
  const ids = offerings.map((offering) => offering.id);
  const schedules = [];
  const prices = [];
  const galleryItems = [];

  for (const offering of offeringsSource) {
    (offering.schedule ?? []).forEach((scheduleText) => {
      const dow = dayOfWeek(scheduleText);
      if (dow === null) return;
      schedules.push({
        offering_id: sqlId(offering.id),
        day_of_week: dow,
        ...timeRange(scheduleText),
      });
    });
    (offering.details?.pricing ?? []).forEach((price, index) => {
      prices.push({
        offering_id: sqlId(offering.id),
        label: price.description || `Precio ${index + 1}`,
        price: Number(price.price ?? offering.price ?? 0),
        currency: offering.currency ?? "EUR",
      });
    });
    (offering.gallery ?? []).forEach((image, index) => {
      galleryItems.push({
        offering_id: sqlId(offering.id),
        image_id: image,
        caption: null,
        sort_order: index,
      });
    });
  }

  await upsertRows(supabase, "offerings", offerings);
  await replaceChildren(supabase, "offering_schedules", "offering_id", ids, schedules);
  await replaceChildren(supabase, "offering_prices", "offering_id", ids, prices);
  await replaceChildren(supabase, "offering_gallery_items", "offering_id", ids, galleryItems);
  console.log(`offerings: ${offerings.length}; schedules: ${schedules.length}; prices: ${prices.length}; gallery_items: ${galleryItems.length}`);
  return offerings.length + schedules.length + prices.length + galleryItems.length;
}

async function seedOrders(supabase) {
  const ordersSource = asArray(readJson("orders.json"));
  const orders = ordersSource.map((order) => normalizeSqlId(omit(order, ["items"])));
  const items = ordersSource.flatMap((order) =>
    (order.items ?? []).map((item) => normalizeSqlId({ ...item, order_id: sqlId(order.id) })),
  );
  await upsertRows(supabase, "orders", orders);
  await replaceChildren(supabase, "order_items", "order_id", orders.map((order) => order.id), items);
  console.log(`orders: ${orders.length}; order_items: ${items.length}`);
  return orders.length + items.length;
}

async function seedSingletons(supabase) {
  const settings = flattenSettings(readJson("settings.json", {}));
  const marketing = flattenMarketing(readJson("marketing.json", {}));
  const legal = flattenLegal(readJson("legal-settings.json", {}));
  const menuVisualSettings = {
    id: "00000000-0000-0000-0000-000000000002",
    key: "default",
    header_logo_url: settings.header_logo_url,
    scroll_menu_background_color: settings.scroll_menu_background_color,
    scroll_menu_text_color: settings.scroll_menu_text_color,
    scroll_menu_icon_color: settings.scroll_menu_icon_color,
    scroll_menu_logo_tint_enabled: settings.scroll_menu_logo_tint_enabled,
    scroll_menu_logo_tint_color: settings.scroll_menu_logo_tint_color,
  };
  await upsertRows(supabase, "site_settings", [settings]);
  await upsertRows(supabase, "menu_visual_settings", [menuVisualSettings]);
  await upsertRows(supabase, "marketing_settings", [marketing]);
  await upsertRows(supabase, "legal_settings", [legal]);
  console.log("singletons: site_settings, menu_visual_settings, marketing_settings, legal_settings");
  return 4;
}

async function uploadPublicMedia(supabase) {
  const mediaRoots = ["img", "uploads"].map((dir) => path.join(PUBLIC_DIR, dir)).filter((dir) => existsSync(dir));
  const mediaFiles = mediaRoots.flatMap(walkFiles);
  let count = 0;
  const mediaRows = [];

  for (const file of mediaFiles) {
    const storagePath = path.relative(PUBLIC_DIR, file).replace(/\\/g, "/");
    const fileStat = statSync(file);
    if (fileStat.size > 10 * 1024 * 1024) continue;
    const mimeType = contentTypeFor(file);

    const { error } = await supabase.storage.from(BUCKET).upload(storagePath, readFileSync(file), {
      contentType: mimeType,
      upsert: true,
    });
    if (error) throw new Error(`storage ${storagePath}: ${error.message}`);

    const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    const originalName = path.basename(file);
    const folder = path.dirname(storagePath) === "." ? "general" : path.dirname(storagePath).replace(/\\/g, "/");
    mediaRows.push({
      id: sqlId(`storage:${storagePath}`),
      file_name: storagePath,
      original_name: originalName,
      file_url: publicUrlData.publicUrl,
      file_type: path.extname(file).replace(/^\./, "").toLowerCase() || "file",
      mime_type: mimeType,
      size: fileStat.size,
      alt_text: "",
      title: originalName,
      description: "",
      folder,
      tags: ["supabase-storage"],
      status: "active",
      created_at: new Date(fileStat.birthtimeMs || fileStat.mtimeMs).toISOString(),
      updated_at: new Date(fileStat.mtimeMs).toISOString(),
      deleted_at: null,
    });
    count += 1;
  }

  await upsertRows(supabase, "media_assets", mediaRows);
  console.log(`storage.${BUCKET}: ${count}`);
  return count;
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

await ensureBucket(supabase);

let total = 0;
total += await seedSingletons(supabase);
total += await seedPages(supabase);
total += await seedLandingPages(supabase);
total += await seedBlog(supabase);
total += await seedForms(supabase);
total += await seedMenus(supabase);
total += await seedSocialGalleries(supabase);
total += await seedOfferings(supabase);
total += await seedOrders(supabase);
total += await seedSimpleTables(supabase);
const storageCount = await uploadPublicMedia(supabase);

console.log(`Seed SQL completo: ${total} filas SQL normalizadas y ${storageCount} archivos en Storage.`);
