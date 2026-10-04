import { createAdminClient } from "../supabase/admin";
import { getBlogPosts } from "./blog";
import { getLandingPages } from "./landing-pages";
import { getOfferings, isPubliclyVisibleOffering } from "./offerings";
import { getProducts } from "./products";
import { readJsonFile, writeJsonFile } from "./local-storage";
import { getSettings, updateSettings } from "./settings";
import type { SiteSettings } from "./settings-types";
import { defaultMarketingSettings } from "./types";
import type {
  BlogPost,
  LandingPage,
  MarketingCampaign, MarketingConversion, MarketingEventLog, MarketingEventType,
  MarketingPageMetric, MarketingReport, MarketingSearchConsolePage,
  MarketingSearchConsoleQuery, MarketingSearchConsoleSummary, MarketingSeoAudit,
  MarketingSettings, MarketingTrafficSource, Offering, Product,
} from "./types";

const SETTINGS_ID = "00000000-0000-0000-0000-000000000002";
const SEO_AUDIT_FILE = "marketing-seo-audit.json";
const EVENT_LOGS_FILE = "marketing-event-logs.json";
const EVENT_TYPES_FILE = "marketing-event-types.json";
const REPORTS_FILE = "marketing-reports.json";

const MARKETING_CACHE_TTL_MS = 15_000;
const MARKETING_READ_TIMEOUT_MS = 1_500;
let marketingSettingsCache: { item: MarketingSettings; expiresAt: number } | null = null;

function getCachedMarketingSettings(): MarketingSettings | null {
  if (!marketingSettingsCache || marketingSettingsCache.expiresAt <= Date.now()) return null;
  return marketingSettingsCache.item;
}

function cacheMarketingSettings(settings: MarketingSettings) {
  marketingSettingsCache = { item: settings, expiresAt: Date.now() + MARKETING_CACHE_TTL_MS };
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise.catch(() => fallback).finally(() => {
        if (timeout) clearTimeout(timeout);
      }),
      new Promise<T>((resolve) => {
        timeout = setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

/* ── Settings (existing) ── */

function flattenMarketing(s: MarketingSettings): Record<string, unknown> {
  return {
    analytics_enabled: s.analytics_enabled,
    google_analytics_id: s.ga4_measurement_id || null,
    gtm_container_id: s.gtm_container_id || null,
    google_search_console_id: s.google_search_console_id || null,
    microsoft_clarity_id: s.microsoft_clarity_id || null,
    meta_pixel_enabled: s.meta_pixel_enabled,
    meta_pixel_id: s.meta_pixel_id || null,
    meta_conversion_api_enabled: s.meta_conversion_api_enabled,
    meta_access_token: s.meta_access_token || null,
    meta_dataset_id: s.meta_dataset_id || null,
    tiktok_pixel_enabled: s.tiktok_pixel_enabled,
    tiktok_pixel_id: s.tiktok_pixel_id || null,
    pinterest_tag_enabled: s.pinterest_tag_enabled,
    pinterest_tag_id: s.pinterest_tag_id || null,
    linkedin_insight_enabled: s.linkedin_insight_enabled,
    linkedin_partner_id: s.linkedin_partner_id || null,
    seo_global_title: s.seo_global_title || null,
    seo_global_description: s.seo_global_description || null,
    seo_og_image: s.seo_og_image || null,
    robots_enabled: s.robots_enabled,
    sitemap_enabled: s.sitemap_enabled,
    schema_enabled: s.schema_enabled,
    events: s.events as unknown[],
    utm_builder_enabled: s.utm_builder_enabled,
    automation_webhooks_enabled: s.automation_webhooks_enabled,
    webhook_url: s.webhook_url || null,
    whatsapp_button_url: s.whatsapp_button_url || null,
    instagram_button_url: s.instagram_button_url || null,
    public_button_links: s.public_button_links as unknown[],
  };
}

function rowToMarketing(row: Record<string, unknown>): MarketingSettings {
  const defaultSettings = defaultMarketingSettings();
  const publicButtonLinks = Array.isArray(row.public_button_links)
    ? (row.public_button_links as MarketingSettings["public_button_links"])
    : defaultSettings.public_button_links.map((button) => ({
      ...button,
      url: button.eventName === "click_whatsapp"
        ? String((row as Record<string, unknown>).whatsapp_button_url ?? "")
        : button.eventName === "click_instagram"
          ? String((row as Record<string, unknown>).instagram_button_url ?? "")
          : button.url,
    }));

  return {
    analytics_enabled: Boolean(row.analytics_enabled),
    ga4_measurement_id: String(row.google_analytics_id ?? ""),
    gtm_container_id: String(row.gtm_container_id ?? ""),
    google_search_console_id: String(row.google_search_console_id ?? ""),
    microsoft_clarity_id: String(row.microsoft_clarity_id ?? ""),
    meta_pixel_enabled: Boolean(row.meta_pixel_enabled),
    meta_pixel_id: String(row.meta_pixel_id ?? ""),
    meta_conversion_api_enabled: Boolean(row.meta_conversion_api_enabled),
    meta_access_token: String(row.meta_access_token ?? ""),
    meta_dataset_id: String(row.meta_dataset_id ?? ""),
    tiktok_pixel_enabled: Boolean(row.tiktok_pixel_enabled),
    tiktok_pixel_id: String(row.tiktok_pixel_id ?? ""),
    pinterest_tag_enabled: Boolean(row.pinterest_tag_enabled),
    pinterest_tag_id: String(row.pinterest_tag_id ?? ""),
    linkedin_insight_enabled: Boolean(row.linkedin_insight_enabled),
    linkedin_partner_id: String(row.linkedin_partner_id ?? ""),
    seo_global_title: String(row.seo_global_title ?? ""),
    seo_global_description: String(row.seo_global_description ?? ""),
    seo_og_image: String(row.seo_og_image ?? ""),
    robots_enabled: Boolean(row.robots_enabled),
    sitemap_enabled: Boolean(row.sitemap_enabled),
    schema_enabled: Boolean(row.schema_enabled),
    events: Array.isArray(row.events) ? row.events as MarketingSettings["events"] : [],
    utm_builder_enabled: Boolean(row.utm_builder_enabled),
    automation_webhooks_enabled: Boolean(row.automation_webhooks_enabled),
    webhook_url: String(row.webhook_url ?? ""),
    whatsapp_button_url: String((row as Record<string, unknown>).whatsapp_button_url ?? ""),
    instagram_button_url: String((row as Record<string, unknown>).instagram_button_url ?? ""),
    public_button_links: publicButtonLinks,
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  };
}

async function readSettingsFromSupabase(): Promise<MarketingSettings | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("marketing_settings").select("*").limit(1).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return rowToMarketing(data as Record<string, unknown>);
  } catch { return null; }
}

async function writeSettingsToSupabase(settings: MarketingSettings): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const flat = flattenMarketing(settings);
    flat.updated_at = new Date().toISOString();
    const { data: existing } = await supabase.from("marketing_settings").select("id").limit(1).maybeSingle();
    if (existing) {
      const { error } = await supabase.from("marketing_settings").update(flat).eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("marketing_settings").insert({ id: SETTINGS_ID, ...flat });
      if (error) throw error;
    }
    return true;
  } catch { return false; }
}

export async function getMarketingSettings(): Promise<MarketingSettings> {
  const cached = getCachedMarketingSettings();
  if (cached) return cached;

  const fromSupabase = await withTimeout(readSettingsFromSupabase(), MARKETING_READ_TIMEOUT_MS, null);
  const data = await readJsonFile<Partial<MarketingSettings>>("marketing.json", {});
  const stored = fromSupabase
    ? { ...fromSupabase, ...(Array.isArray(data.public_button_links) ? { public_button_links: data.public_button_links } : {}) }
    : { ...defaultMarketingSettings(), ...data };
  const siteSettings = await getSettings();
  const result: MarketingSettings = {
    ...stored,
    // The public site reads site_settings. Keep this legacy marketing view in
    // sync so the admin panel edits the values that reach the frontend.
    seo_global_title: siteSettings.seo.default_seo_title || stored.seo_global_title,
    seo_global_description: siteSettings.seo.default_seo_description || stored.seo_global_description,
    seo_og_image: siteSettings.seo.default_og_image_url || stored.seo_og_image,
    robots_enabled: siteSettings.seo.robots_index,
    sitemap_enabled: siteSettings.seo.sitemap_enabled,
  };

  cacheMarketingSettings(result);
  return result;
}

export async function updateMarketingSettings(input: Partial<MarketingSettings>): Promise<MarketingSettings> {
  const current = await getMarketingSettings();
  const next: MarketingSettings = { ...current, ...input, updated_at: new Date().toISOString() };
  if (input.meta_access_token === undefined) next.meta_access_token = current.meta_access_token;

  const seoPatch: Partial<SiteSettings["seo"]> = {};
  if (input.seo_global_title !== undefined) seoPatch.default_seo_title = String(input.seo_global_title).trim();
  if (input.seo_global_description !== undefined) {
    seoPatch.default_seo_description = String(input.seo_global_description).trim();
  }
  if (input.seo_og_image !== undefined) seoPatch.default_og_image_url = String(input.seo_og_image).trim();
  if (input.robots_enabled !== undefined) seoPatch.robots_index = input.robots_enabled;
  if (input.sitemap_enabled !== undefined) seoPatch.sitemap_enabled = input.sitemap_enabled;
  if (Object.keys(seoPatch).length > 0) {
    await updateSettings({ seo: seoPatch as SiteSettings["seo"] });
  }

  await writeSettingsToSupabase(next);
  await writeJsonFile("marketing.json", next);
  cacheMarketingSettings(next);
  return next;
}

/* ── Helper: Supabase client ── */
function sb() { return createAdminClient(); }

function defaultMarketingEventTypes(): MarketingEventType[] {
  const now = new Date().toISOString();
  return [
    { id: "00000000-0000-0000-0000-000000000100", name: "page_view", label: "Vista de página", description: "Usuario visitó una página del sitio", category: "navigation", is_active: true, last_triggered_at: "", created_at: now, updated_at: now },
    { id: "00000000-0000-0000-0000-000000000101", name: "click_whatsapp", label: "Click WhatsApp", description: "Usuario hizo clic en un botón de WhatsApp", category: "conversion", is_active: true, last_triggered_at: "", created_at: now, updated_at: now },
    { id: "00000000-0000-0000-0000-000000000102", name: "click_reservar", label: "Click Reservar", description: "Usuario hizo clic en botón de reserva", category: "conversion", is_active: true, last_triggered_at: "", created_at: now, updated_at: now },
    { id: "00000000-0000-0000-0000-000000000103", name: "click_comprar", label: "Click Comprar", description: "Usuario hizo clic en botón de compra", category: "conversion", is_active: true, last_triggered_at: "", created_at: now, updated_at: now },
    { id: "00000000-0000-0000-0000-000000000104", name: "submit_formulario", label: "Envío de formulario", description: "Usuario envió un formulario", category: "conversion", is_active: true, last_triggered_at: "", created_at: now, updated_at: now },
    { id: "00000000-0000-0000-0000-000000000105", name: "click_instagram", label: "Click Instagram", description: "Usuario hizo clic en enlace a Instagram", category: "engagement", is_active: true, last_triggered_at: "", created_at: now, updated_at: now },
    { id: "00000000-0000-0000-0000-000000000106", name: "click_email", label: "Click Email", description: "Usuario hizo clic en dirección de email", category: "engagement", is_active: true, last_triggered_at: "", created_at: now, updated_at: now },
    { id: "00000000-0000-0000-0000-000000000107", name: "click_external_link", label: "Click Enlace Externo", description: "Usuario hizo clic en un enlace externo", category: "navigation", is_active: true, last_triggered_at: "", created_at: now, updated_at: now },
    { id: "00000000-0000-0000-0000-000000000108", name: "view_workshop", label: "Vista Workshop", description: "Usuario visitó página de workshop", category: "content", is_active: true, last_triggered_at: "", created_at: now, updated_at: now },
    { id: "00000000-0000-0000-0000-000000000109", name: "view_class", label: "Vista Clase", description: "Usuario visitó página de clase", category: "content", is_active: true, last_triggered_at: "", created_at: now, updated_at: now },
    { id: "00000000-0000-0000-0000-000000000110", name: "view_gift_card", label: "Vista Gift Card", description: "Usuario visitó página de gift card", category: "content", is_active: true, last_triggered_at: "", created_at: now, updated_at: now },
    { id: "00000000-0000-0000-0000-000000000111", name: "view_product", label: "Vista Producto", description: "Usuario visitó página de producto", category: "commerce", is_active: true, last_triggered_at: "", created_at: now, updated_at: now },
    { id: "00000000-0000-0000-0000-000000000112", name: "view_blog_post", label: "Vista Blog Post", description: "Usuario visitó un post de la bitácora", category: "content", is_active: true, last_triggered_at: "", created_at: now, updated_at: now },
  ];
}

async function readEventTypesFromLocal(): Promise<MarketingEventType[]> {
  return readJsonFile<MarketingEventType[]>(EVENT_TYPES_FILE, defaultMarketingEventTypes());
}

async function writeEventTypesToLocal(rows: MarketingEventType[]): Promise<void> {
  await writeJsonFile(EVENT_TYPES_FILE, rows);
}

/* ── Campaigns ── */
export async function getCampaigns(): Promise<MarketingCampaign[]> {
  try {
    const { data, error } = await sb().from("marketing_campaigns").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data as MarketingCampaign[];
  } catch { return []; }
}

export async function getCampaignById(id: string): Promise<MarketingCampaign | null> {
  try {
    const { data, error } = await sb().from("marketing_campaigns").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data as MarketingCampaign;
  } catch { return null; }
}

export async function createCampaign(data: Partial<MarketingCampaign>): Promise<MarketingCampaign> {
  const { data: inserted, error } = await sb().from("marketing_campaigns").insert(data).select().single();
  if (error) throw new Error(error.message);
  return inserted as MarketingCampaign;
}

export async function updateCampaign(id: string, data: Partial<MarketingCampaign>): Promise<MarketingCampaign> {
  const { data: updated, error } = await sb().from("marketing_campaigns").update(data).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return updated as MarketingCampaign;
}

export async function deleteCampaign(id: string): Promise<void> {
  const { error } = await sb().from("marketing_campaigns").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function duplicateCampaign(id: string): Promise<MarketingCampaign> {
  const original = await getCampaignById(id);
  if (!original) throw new Error("Campaña no encontrada");
  const { name, utm_source, utm_medium, utm_campaign, utm_content, utm_term, destination_url, generated_url, notes } = original;
  return createCampaign({
    name: `${name} (copia)`, slug: `${original.slug}-copy`,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term,
    destination_url, generated_url, notes, status: "draft",
  });
}

export function generateCampaignUrl(destination: string, source: string, medium: string, campaign: string, content?: string, term?: string): string {
  const params = new URLSearchParams({ utm_source: source, utm_medium: medium, utm_campaign: campaign });
  if (content) params.set("utm_content", content);
  if (term) params.set("utm_term", term);
  const sep = destination.includes("?") ? "&" : "?";
  return `${destination}${sep}${params.toString()}`;
}

/* ── Event Types ── */
export async function getEventTypes(): Promise<MarketingEventType[]> {
  try {
    const { data, error } = await sb().from("marketing_event_types").select("*").order("name");
    if (error) throw error;
    if (data && data.length > 0) return data as MarketingEventType[];
  } catch {
    // fall back to local seed
  }

  const local = await readEventTypesFromLocal();
  if (local.length > 0) return local;

  const defaults = defaultMarketingEventTypes();
  await writeEventTypesToLocal(defaults);
  return defaults;
}

export async function updateEventType(id: string, data: Partial<MarketingEventType>): Promise<MarketingEventType> {
  try {
    const { data: updated, error } = await sb().from("marketing_event_types").update(data).eq("id", id).select().single();
    if (error) throw error;
    return updated as MarketingEventType;
  } catch (error) {
    const message = errorMessage(error);
    if (!message.includes("marketing_event_types") && !message.includes("schema cache") && !message.includes("relation")) {
      throw new Error(message);
    }

    const local = await readEventTypesFromLocal();
    const index = local.findIndex((item) => item.id === id);
    if (index === -1) throw new Error("Evento no encontrado.");

    const updated = { ...local[index], ...data, updated_at: new Date().toISOString() };
    local[index] = updated;
    await writeEventTypesToLocal(local);
    return updated;
  }
}

async function readEventLogsFromLocal(): Promise<MarketingEventLog[]> {
  return readJsonFile<MarketingEventLog[]>(EVENT_LOGS_FILE, []);
}

async function writeEventLogsToLocal(rows: MarketingEventLog[]): Promise<void> {
  await writeJsonFile(EVENT_LOGS_FILE, rows);
}

export async function recordMarketingEvent(input: {
  eventName: string;
  pageUrl?: string;
  pageTitle?: string;
  contentType?: string;
  contentId?: string;
  campaignId?: string;
  source?: string;
  medium?: string;
  device?: string;
  country?: string;
  city?: string;
  metadata?: Record<string, unknown>;
  occurredAt?: string;
}): Promise<MarketingEventLog | null> {
  const settings = await getMarketingSettings();
  if (!settings.analytics_enabled) {
    return null;
  }

  const now = input.occurredAt ?? new Date().toISOString();
  const row: MarketingEventLog = {
    id: "",
    event_id: "",
    event_name: input.eventName,
    page_url: input.pageUrl ?? "",
    page_title: input.pageTitle ?? "",
    content_type: input.contentType ?? "",
    content_id: input.contentId ?? "",
    campaign_id: input.campaignId ?? "",
    source: input.source ?? "",
    medium: input.medium ?? "",
    device: input.device ?? "",
    country: input.country ?? "",
    city: input.city ?? "",
    metadata: input.metadata ?? {},
    occurred_at: now,
    created_at: now,
  };

  try {
    const eventTypes = await getEventTypes();
    const matchedEvent = eventTypes.find((event) => event.name === input.eventName);
    if (matchedEvent && !matchedEvent.is_active) {
      return null;
    }

    const supabase = sb();

    const payload = {
      event_id: matchedEvent?.id ?? null,
      event_name: row.event_name,
      page_url: row.page_url || null,
      page_title: row.page_title || null,
      content_type: row.content_type || null,
      content_id: row.content_id || null,
      campaign_id: row.campaign_id || null,
      source: row.source || null,
      medium: row.medium || null,
      device: row.device || null,
      country: row.country || null,
      city: row.city || null,
      metadata: row.metadata,
      occurred_at: row.occurred_at,
    };

    const { data, error } = await supabase.from("marketing_event_logs").insert(payload).select().single();
    if (error) throw error;

    if (matchedEvent) {
      await supabase.from("marketing_event_types").update({ last_triggered_at: now }).eq("id", matchedEvent.id);
    }

    return data as MarketingEventLog;
  } catch (error) {
    const message = errorMessage(error);
    if (!message.includes("marketing_event_logs") && !message.includes("schema cache") && !message.includes("relation")) {
      throw new Error(message);
    }

    const eventTypes = await getEventTypes();
    const matchedEvent = eventTypes.find((event) => event.name === input.eventName);
    if (matchedEvent && !matchedEvent.is_active) {
      return null;
    }

    const local = await readEventLogsFromLocal();
    const next = [{ ...row, id: crypto.randomUUID() }, ...local];
    await writeEventLogsToLocal(next);

    if (matchedEvent) {
      await updateEventType(matchedEvent.id, { last_triggered_at: now });
    }

    return next[0];
  }
}

/* ── Event Logs ── */
export async function getEventLogs(limit = 100): Promise<MarketingEventLog[]> {
  try {
    const { data, error } = await sb().from("marketing_event_logs").select("*").order("occurred_at", { ascending: false }).limit(limit);
    if (error) throw error;
    return data as MarketingEventLog[];
  } catch {
    return (await readEventLogsFromLocal()).slice(0, limit);
  }
}

/* ── Page Metrics ── */
export async function getPageMetrics(dateFrom?: string, dateTo?: string): Promise<MarketingPageMetric[]> {
  try {
    let query = sb().from("marketing_page_metrics").select("*");
    if (dateFrom) query = query.gte("date", dateFrom);
    if (dateTo) query = query.lte("date", dateTo);
    const { data, error } = await query.order("date", { ascending: false }).limit(200);
    if (error) throw error;
    return data as MarketingPageMetric[];
  } catch { return []; }
}

/* ── Traffic Sources ── */
export async function getTrafficSources(dateFrom?: string, dateTo?: string): Promise<MarketingTrafficSource[]> {
  try {
    let query = sb().from("marketing_traffic_sources").select("*");
    if (dateFrom) query = query.gte("date", dateFrom);
    if (dateTo) query = query.lte("date", dateTo);
    const { data, error } = await query.order("date", { ascending: false }).limit(200);
    if (error) throw error;
    return data as MarketingTrafficSource[];
  } catch { return []; }
}

/* ── Conversions ── */
export async function getConversions(dateFrom?: string, dateTo?: string): Promise<MarketingConversion[]> {
  try {
    let query = sb().from("marketing_conversions").select("*");
    if (dateFrom) query = query.gte("occurred_at", dateFrom);
    if (dateTo) query = query.lte("occurred_at", dateTo);
    const { data, error } = await query.order("occurred_at", { ascending: false }).limit(200);
    if (error) throw error;
    return data as MarketingConversion[];
  } catch { return []; }
}

/* ── Reports ── */
export async function getReports(): Promise<MarketingReport[]> {
  try {
    const { data, error } = await sb().from("marketing_reports").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data as MarketingReport[];
  } catch {
    return readJsonFile<MarketingReport[]>(REPORTS_FILE, []);
  }
}

export async function createReport(data: Partial<MarketingReport>): Promise<MarketingReport> {
  const now = new Date().toISOString();
  const type = data.type ?? "weekly";
  const dateFrom = data.date_from ?? "";
  const dateTo = data.date_to ?? "";
  const snapshot = await buildReportSnapshot(dateFrom, dateTo);
  const name = data.name?.trim() || reportName(type, dateFrom, dateTo);
  const fileUrl = data.file_url || buildReportDataUrl({ name, type, dateFrom, dateTo, generatedAt: now, snapshot });
  const payload: Partial<MarketingReport> = {
    name,
    type,
    date_from: dateFrom,
    date_to: dateTo,
    file_url: fileUrl,
    status: "ready",
    generated_at: now,
  };

  try {
    const { data: inserted, error } = await sb().from("marketing_reports").insert(payload).select().single();
    if (error) throw error;
    return inserted as MarketingReport;
  } catch {
    const local = await readJsonFile<MarketingReport[]>(REPORTS_FILE, []);
    const report: MarketingReport = {
      id: crypto.randomUUID(),
      name,
      type,
      date_from: dateFrom,
      date_to: dateTo,
      file_url: fileUrl,
      status: "ready",
      generated_at: now,
      created_at: now,
      updated_at: now,
    };
    await writeJsonFile(REPORTS_FILE, [report, ...local]);
    return report;
  }
}

function reportName(type: MarketingReport["type"], dateFrom: string, dateTo: string): string {
  const label = {
    weekly: "Reporte semanal",
    monthly: "Reporte mensual",
    campaign: "Reporte de campaña",
    page: "Reporte de páginas",
    seo: "Reporte SEO",
    conversion: "Reporte de conversiones",
  }[type];
  const range = dateFrom && dateTo ? ` (${dateFrom} a ${dateTo})` : "";
  return `${label}${range}`;
}

async function buildReportSnapshot(dateFrom: string, dateTo: string) {
  const [settings, campaigns, events, eventLogs, seoAudit, pageMetrics, conversions, trafficSources] = await Promise.all([
    getMarketingSettings(),
    getCampaigns(),
    getEventTypes(),
    getEventLogs(500),
    getSeoAudit(),
    getPageMetrics(dateFrom || undefined, dateTo || undefined),
    getConversions(dateFrom || undefined, dateTo || undefined),
    getTrafficSources(dateFrom || undefined, dateTo || undefined),
  ]);

  const inRange = (date: string) => {
    if (!date) return true;
    const day = date.slice(0, 10);
    if (dateFrom && day < dateFrom) return false;
    if (dateTo && day > dateTo) return false;
    return true;
  };

  const filteredLogs = eventLogs.filter((event) => inRange(event.occurred_at));
  return {
    settings,
    campaigns,
    events,
    eventLogs: filteredLogs,
    seoAudit,
    pageMetrics,
    conversions,
    trafficSources,
  };
}

function buildReportDataUrl(input: {
  name: string;
  type: MarketingReport["type"];
  dateFrom: string;
  dateTo: string;
  generatedAt: string;
  snapshot: Awaited<ReturnType<typeof buildReportSnapshot>>;
}): string {
  const activeEvents = input.snapshot.events.filter((event) => event.is_active).length;
  const seoOk = input.snapshot.seoAudit.filter((page) => page.seo_status === "ok").length;
  const seoIssues = input.snapshot.seoAudit.length - seoOk;
  const markdown = [
    `# ${input.name}`,
    "",
    `- Tipo: ${input.type}`,
    `- Rango: ${input.dateFrom || "sin inicio"} a ${input.dateTo || "sin fin"}`,
    `- Generado: ${input.generatedAt}`,
    "",
    "## Estado de configuración",
    "",
    `- Analítica interna: ${input.snapshot.settings.analytics_enabled ? "activa" : "inactiva"}`,
    `- GA4 ID: ${input.snapshot.settings.ga4_measurement_id || "sin configurar"}`,
    `- Search Console: ${input.snapshot.settings.google_search_console_id || "sin configurar"}`,
    `- Eventos activos: ${activeEvents} de ${input.snapshot.events.length}`,
    "",
    "## Actividad registrada",
    "",
    `- Eventos capturados: ${input.snapshot.eventLogs.length}`,
    `- Conversiones: ${input.snapshot.conversions.length}`,
    `- Campañas UTM: ${input.snapshot.campaigns.length}`,
    `- Métricas de páginas: ${input.snapshot.pageMetrics.length}`,
    `- Fuentes de tráfico: ${input.snapshot.trafficSources.length}`,
    "",
    "## SEO",
    "",
    `- Páginas auditadas: ${input.snapshot.seoAudit.length}`,
    `- Páginas correctas: ${seoOk}`,
    `- Páginas con pendientes: ${seoIssues}`,
    "",
    "## Siguientes acciones recomendadas",
    "",
    "- Activar Analítica interna antes de publicar campañas.",
    "- Mantener activos los eventos de conversión críticos.",
    "- Ejecutar auditoría SEO después de crear o editar páginas.",
    "- Usar URLs UTM para newsletters, redes sociales y colaboraciones.",
    "",
  ].join("\n");

  return `data:text/markdown;charset=utf-8,${encodeURIComponent(markdown)}`;
}

/* ── Search Console ── */
export async function getSearchConsoleSummary(dateFrom?: string, dateTo?: string): Promise<MarketingSearchConsoleSummary[]> {
  try {
    let query = sb().from("marketing_search_console_summary").select("*");
    if (dateFrom) query = query.gte("date", dateFrom);
    if (dateTo) query = query.lte("date", dateTo);
    const { data, error } = await query.order("date", { ascending: false }).limit(90);
    if (error) throw error;
    return data as MarketingSearchConsoleSummary[];
  } catch { return []; }
}

export async function getSearchConsoleQueries(dateFrom?: string, dateTo?: string): Promise<MarketingSearchConsoleQuery[]> {
  try {
    let query = sb().from("marketing_search_console_queries").select("*");
    if (dateFrom) query = query.gte("date", dateFrom);
    if (dateTo) query = query.lte("date", dateTo);
    const { data, error } = await query.order("clicks", { ascending: false }).limit(50);
    if (error) throw error;
    return data as MarketingSearchConsoleQuery[];
  } catch { return []; }
}

export async function getSearchConsolePages(dateFrom?: string, dateTo?: string): Promise<MarketingSearchConsolePage[]> {
  try {
    let query = sb().from("marketing_search_console_pages").select("*");
    if (dateFrom) query = query.gte("date", dateFrom);
    if (dateTo) query = query.lte("date", dateTo);
    const { data, error } = await query.order("clicks", { ascending: false }).limit(50);
    if (error) throw error;
    return data as MarketingSearchConsolePage[];
  } catch { return []; }
}

/* ── SEO Audit ── */
export async function getSeoAudit(): Promise<MarketingSeoAudit[]> {
  const fromSupabase = await readSeoAuditFromSupabase();
  const fromLocal = await readJsonFile<MarketingSeoAudit[]>(SEO_AUDIT_FILE, []);

  if (fromSupabase !== null && fromSupabase.length > 0) return fromSupabase;
  if (fromLocal.length > 0) return fromLocal;
  return fromSupabase ?? fromLocal;
}

async function readSeoAuditFromSupabase(): Promise<MarketingSeoAudit[] | null> {
  try {
    const { data, error } = await sb().from("marketing_seo_audit").select("*").order("seo_status");
    if (error) throw error;
    return (data ?? []) as MarketingSeoAudit[];
  } catch {
    return null;
  }
}

async function writeSeoAuditToLocal(rows: MarketingSeoAudit[]): Promise<void> {
  await writeJsonFile(SEO_AUDIT_FILE, rows);
}

function isMissingSeoAuditTable(errorMessage: string): boolean {
  return errorMessage.includes("marketing_seo_audit") || errorMessage.includes("schema cache") || errorMessage.includes("relation");
}

function errorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const candidate = error as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
    const parts = [candidate.message, candidate.details, candidate.hint, candidate.code]
      .filter((part): part is string => typeof part === "string" && part.trim().length > 0);
    if (parts.length > 0) return parts.join(" | ");
    try {
      return JSON.stringify(error);
    } catch {
      return "[unknown error]";
    }
  }
  return String(error);
}

function normalizeSeoValue(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function buildSlugStatus(slug: string): MarketingSeoAudit["slug_status"] {
  const cleaned = normalizeSeoValue(slug);
  if (!cleaned) return "missing";
  if (cleaned.length > 80) return "too_long";
  if (/\s/.test(cleaned) || /[^a-z0-9\-_/]/i.test(cleaned)) return "review";
  return "ok";
}

function buildSeoStatus(params: {
  isIndexable: boolean;
  hasMetaTitle: boolean;
  hasMetaDescription: boolean;
  hasOgImage: boolean;
  slugStatus: MarketingSeoAudit["slug_status"];
}): MarketingSeoAudit["seo_status"] {
  if (!params.isIndexable) return "pending";
  if (params.slugStatus !== "ok") return "review";
  if (!params.hasMetaTitle || !params.hasMetaDescription || !params.hasOgImage) return "incomplete";
  return "ok";
}

function buildSeoIssues(params: {
  titleLabel: string;
  isIndexable: boolean;
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  canonicalUrl: string;
  slugStatus: MarketingSeoAudit["slug_status"];
}): string[] {
  const issues: string[] = [];
  if (!params.isIndexable) issues.push(`${params.titleLabel} no es indexable`);
  if (!params.metaTitle) issues.push("Falta meta title");
  if (!params.metaDescription) issues.push("Falta meta description");
  if (!params.ogImage) issues.push("Falta imagen OG");
  if (!params.canonicalUrl) issues.push("Falta canonical");
  if (params.slugStatus === "missing") issues.push("Falta slug");
  if (params.slugStatus === "too_long") issues.push("Slug demasiado largo");
  if (params.slugStatus === "review") issues.push("Slug requiere revisión");
  return issues;
}

function buildSeoRecommendations(issues: string[]): string[] {
  const recommendations: string[] = [];
  if (issues.some((issue) => issue.includes("meta title"))) recommendations.push("Añade un meta title descriptivo y breve.");
  if (issues.some((issue) => issue.includes("meta description"))) recommendations.push("Completa la meta description con una propuesta clara.");
  if (issues.some((issue) => issue.includes("imagen OG"))) recommendations.push("Define una imagen Open Graph para compartir en redes.");
  if (issues.some((issue) => issue.includes("slug"))) recommendations.push("Usa slugs cortos, en minúsculas y sin espacios.");
  if (issues.some((issue) => issue.includes("indexable"))) recommendations.push("Publica la página si debe aparecer en buscadores.");
  return recommendations;
}

function buildAuditRow(input: {
  pageUrl: string;
  pageTitle: string;
  contentType: MarketingSeoAudit["content_type"];
  contentId: string;
  editUrl: string;
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  canonicalUrl: string;
  isIndexable: boolean;
  slug: string;
}): MarketingSeoAudit {
  const hasMetaTitle = Boolean(normalizeSeoValue(input.metaTitle));
  const hasMetaDescription = Boolean(normalizeSeoValue(input.metaDescription));
  const hasOgImage = Boolean(normalizeSeoValue(input.ogImage));
  const hasCanonical = Boolean(normalizeSeoValue(input.canonicalUrl));
  const slugStatus = buildSlugStatus(input.slug);
  const issues = buildSeoIssues({
    titleLabel: input.pageTitle,
    isIndexable: input.isIndexable,
    metaTitle: normalizeSeoValue(input.metaTitle),
    metaDescription: normalizeSeoValue(input.metaDescription),
    ogImage: normalizeSeoValue(input.ogImage),
    canonicalUrl: normalizeSeoValue(input.canonicalUrl),
    slugStatus,
  });
  return {
    id: "",
    content_id: input.contentId,
    edit_url: input.editUrl,
    page_url: input.pageUrl,
    page_title: input.pageTitle,
    content_type: input.contentType,
    meta_title: normalizeSeoValue(input.metaTitle),
    meta_description: normalizeSeoValue(input.metaDescription),
    og_image: normalizeSeoValue(input.ogImage),
    canonical_url: normalizeSeoValue(input.canonicalUrl),
    is_indexable: input.isIndexable,
    has_meta_title: hasMetaTitle,
    has_meta_description: hasMetaDescription,
    has_og_image: hasOgImage,
    has_canonical: hasCanonical,
    slug_status: slugStatus,
    seo_status: buildSeoStatus({
      isIndexable: input.isIndexable,
      hasMetaTitle,
      hasMetaDescription,
      hasOgImage,
      slugStatus,
    }),
    issues,
    recommendations: buildSeoRecommendations(issues),
    last_checked_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function pagePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

function offeringPath(type: Offering["type"], slug: string): string {
  const prefix = {
    class: "clases",
    workshop: "workshops",
    experience: "experiencias",
    gift_card: "gift-cards",
  }[type];
  return pagePath(`${prefix}/${slug}`);
}

function offeringEditPath(type: Offering["type"], id: string): string {
  const prefix = {
    class: "clases",
    workshop: "workshops",
    experience: "experiencias",
    gift_card: "gift-cards",
  }[type];
  return `/admin/${prefix}/${id}/edit`;
}

function offeringSeoImage(offering: Offering) {
  const classSeoImage = offering.details.class?.seoImage;
  return classSeoImage || offering.cover_image_url || offering.gallery[0] || "";
}

async function collectSeoTargets() {
  const [landingPages, blogPosts, offerings, products] = await Promise.all([
    getLandingPages(),
    getBlogPosts(),
    getOfferings(),
    getProducts(),
  ]);

  const targets: MarketingSeoAudit[] = [];

  for (const landingPage of landingPages.filter((item): item is LandingPage => item.status === "published" && !item.deleted_at)) {
    targets.push(buildAuditRow({
      contentId: landingPage.id,
      editUrl: `/admin/landing-pages/${landingPage.id}/edit`,
      pageUrl: pagePath(`landing/${landingPage.slug}`),
      pageTitle: landingPage.title,
      contentType: "page",
      metaTitle: landingPage.seo_title || landingPage.title,
      metaDescription: landingPage.seo_description || landingPage.hero_subtitle || landingPage.intro_text,
      ogImage: landingPage.seo_image,
      canonicalUrl: pagePath(`landing/${landingPage.slug}`),
      isIndexable: true,
      slug: landingPage.slug,
    }));
  }

  for (const post of blogPosts.filter((item): item is BlogPost => item.status === "published" && !item.deleted_at)) {
    targets.push(buildAuditRow({
      contentId: post.id,
      editUrl: `/admin/bitacora/${post.id}/edit`,
      pageUrl: pagePath(`blog/${post.slug}`),
      pageTitle: post.title,
      contentType: "blog_post",
      metaTitle: post.seo_title || post.title,
      metaDescription: post.seo_description || post.excerpt,
      ogImage: post.seo_image || post.featured_image_id || "img/social-2.jpg",
      canonicalUrl: pagePath(`blog/${post.slug}`),
      isIndexable: true,
      slug: post.slug,
    }));
  }

  for (const offering of offerings.filter((item): item is Offering => isPubliclyVisibleOffering(item))) {
    targets.push(buildAuditRow({
      contentId: offering.id,
      editUrl: offeringEditPath(offering.type, offering.id),
      pageUrl: offeringPath(offering.type, offering.slug),
      pageTitle: offering.title,
      contentType: offering.type,
      metaTitle: offering.seo_title || offering.title,
      metaDescription: offering.seo_description || offering.excerpt,
      ogImage: offeringSeoImage(offering),
      canonicalUrl: offeringPath(offering.type, offering.slug),
      isIndexable: true,
      slug: offering.slug,
    }));
  }

  for (const product of products.filter((item): item is Product => item.status === "published" && !item.deleted_at)) {
    targets.push(buildAuditRow({
      contentId: product.id,
      editUrl: `/admin/shop/products/${product.id}/edit`,
      pageUrl: pagePath(`shop/${product.slug}`),
      pageTitle: product.name,
      contentType: "product",
      metaTitle: product.seo_title || product.name,
      metaDescription: product.seo_description || product.excerpt || product.description,
      ogImage: product.seo_image || product.main_image_id || product.gallery[0] || "/img/social-2.jpg",
      canonicalUrl: pagePath(`shop/${product.slug}`),
      isIndexable: true,
      slug: product.slug,
    }));
  }

  return targets;
}

export async function runSeoAudit(): Promise<{ success: boolean; count: number; message: string }> {
  const audits = await collectSeoTargets();

  const rows = audits.map((audit) => ({
    page_url: audit.page_url,
    page_title: audit.page_title,
    content_type: audit.content_type,
    meta_title: audit.meta_title,
    meta_description: audit.meta_description,
    og_image: audit.og_image,
    canonical_url: audit.canonical_url,
    is_indexable: audit.is_indexable,
    has_meta_title: audit.has_meta_title,
    has_meta_description: audit.has_meta_description,
    has_og_image: audit.has_og_image,
    has_canonical: audit.has_canonical,
    slug_status: audit.slug_status,
    seo_status: audit.seo_status,
    issues: audit.issues,
    recommendations: audit.recommendations,
    last_checked_at: audit.last_checked_at,
  }));

  try {
    const supabase = sb();
    const { error: deleteError } = await supabase
      .from("marketing_seo_audit")
      .delete()
      .neq("page_url", "__seo_audit_never_delete__");

    if (deleteError) throw deleteError;

    if (rows.length > 0) {
      const { error: insertError } = await supabase.from("marketing_seo_audit").insert(rows);
      if (insertError) throw insertError;
    }

    return {
      success: true,
      count: audits.length,
      message:
        audits.length > 0
          ? `Auditoría completada: ${audits.length} páginas analizadas.`
          : "No se encontraron páginas para auditar. Crea contenido publicado o borradores en el CMS y vuelve a ejecutar la auditoría.",
    };
  } catch (error) {
    const message = errorMessage(error);
    if (!isMissingSeoAuditTable(message)) {
      throw new Error(message);
    }

    await writeSeoAuditToLocal(audits);
    return {
      success: true,
      count: audits.length,
      message:
        audits.length > 0
          ? `Auditoría completada en modo local: ${audits.length} páginas analizadas.`
          : "No se encontraron páginas para auditar. Crea contenido en el CMS y vuelve a ejecutar la auditoría.",
    };
  }
}

/* ── Google Analytics sync (placeholder) ── */
export async function syncAnalyticsData(dateFrom?: string, dateTo?: string): Promise<{ success: boolean; message: string }> {
  void dateFrom;
  void dateTo;
  return { success: false, message: "La integración con Google Analytics no está configurada todavía." };
}

/* ── Google Search Console sync (placeholder) ── */
export async function syncSearchConsoleData(dateFrom?: string, dateTo?: string): Promise<{ success: boolean; message: string }> {
  void dateFrom;
  void dateTo;
  return { success: false, message: "La integración con Google Search Console no está configurada todavía." };
}
