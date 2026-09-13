import { randomUUID } from "crypto";
import { createAdminClient } from "../supabase/admin";
import { addTrashItem, getCurrentUserEmail, getTrashItemByEntity, removeTrashItem } from "./trash";
import { readJsonFile, writeJsonFile } from "./local-storage";
import { errorMessageFromUnknown } from "./form-field-persistence";
import { isFooterStatus } from "./types";
import type { FooterComponent, SocialLink } from "./types";
import type { Json } from "../supabase/types";
import { logAction } from "./history-logs";

const TABLE = "footers";
const FILE_NAME = "footers.json";
const SUPABASE_READ_TIMEOUT_MS = 1_500;
const FOOTERS_CACHE_TTL_MS = 15_000;

let footersCache: { items: FooterComponent[]; expiresAt: number } | null = null;

export function invalidateFootersCache() {
  footersCache = null;
}

type Input = Partial<Omit<FooterComponent, "id" | "created_at" | "updated_at" | "deleted_at" | "social_links">> & {
  id?: string; deleted_at?: string | null; social_links?: SocialLink[];
};

function getCachedFooters() {
  if (!footersCache || footersCache.expiresAt <= Date.now()) return null;
  return footersCache.items;
}

function cacheFooters(items: FooterComponent[]) {
  footersCache = { items, expiresAt: Date.now() + FOOTERS_CACHE_TTL_MS };
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T) {
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

const DEFAULT_SOCIAL_LINKS: SocialLink[] = [
  {
    platform: "instagram",
    url: "https://www.instagram.com/casarosier",
    label: "Instagram",
    icon_url: "/img/icon-instagram.svg",
    icon_color: "#ffffff",
    button_color: "#2f2723",
  },
  {
    platform: "facebook",
    url: "https://www.facebook.com/casarosier",
    label: "Facebook",
    icon_url: "/img/icon-facebook.svg",
    icon_color: "#ffffff",
    button_color: "#2f2723",
  },
];

function normalizeSocialLinks(value: unknown): SocialLink[] {
  if (!Array.isArray(value)) return DEFAULT_SOCIAL_LINKS;
  const links = value
    .map((item) => item as Partial<SocialLink>)
    .map((item) => ({
      platform: String(item.platform ?? "").trim(),
      url: String(item.url ?? "").trim(),
      label: String(item.label ?? item.platform ?? "Red social").trim(),
      icon_url: String(item.icon_url ?? "").trim(),
      icon_color: String(item.icon_color ?? "").trim(),
      button_color: String(item.button_color ?? "").trim(),
    }))
    .filter((item) => item.url);
  return links.length ? links : DEFAULT_SOCIAL_LINKS;
}

function normalize(input: Input, existing?: FooterComponent) {
  const name = String(input.name ?? existing?.name ?? "").trim();
  const status = input.status ?? existing?.status ?? "draft";
  const now = new Date().toISOString();
  if (!name) throw new Error("El nombre es obligatorio.");
  if (!isFooterStatus(status)) throw new Error("Estado no válido.");
  return {
    id: existing?.id ?? input.id ?? randomUUID(), name, status,
    logo_id: String(input.logo_id ?? existing?.logo_id ?? "").trim(),
    contact_email: String(input.contact_email ?? existing?.contact_email ?? "").trim(),
    whatsapp: String(input.whatsapp ?? existing?.whatsapp ?? "").trim(),
    address: String(input.address ?? existing?.address ?? "").trim(),
    map_url: String(input.map_url ?? existing?.map_url ?? "").trim(),
    legal_text: String(input.legal_text ?? existing?.legal_text ?? "").trim(),
    contact_title: String(input.contact_title ?? existing?.contact_title ?? "Contacto").trim(),
    contact_text: String(input.contact_text ?? existing?.contact_text ?? "+34 600 000 000\nBarcelona, Espana\nLunes a Sabado - 10:00 a 20:00\nSiguenos en Nuestras Redes:").trim(),
    form_button_color: String(input.form_button_color ?? existing?.form_button_color ?? "#111111").trim(),
    form_button_text_color: String(input.form_button_text_color ?? existing?.form_button_text_color ?? "#ffffff").trim(),
    social_button_color: String(input.social_button_color ?? existing?.social_button_color ?? "#2f2723").trim(),
    social_icon_color: String(input.social_icon_color ?? existing?.social_icon_color ?? "#ffffff").trim(),
    social_links: normalizeSocialLinks(input.social_links ?? existing?.social_links),
    menu_id: input.menu_id !== undefined ? input.menu_id : (existing?.menu_id ?? null),
    newsletter_enabled: input.newsletter_enabled !== undefined ? input.newsletter_enabled : (existing?.newsletter_enabled ?? false),
    created_at: existing?.created_at ?? now, updated_at: now,
    deleted_at: input.status === "deleted" ? existing?.deleted_at ?? now : null,
  } satisfies FooterComponent;
}

function rowToFooter(row: Record<string, unknown>): FooterComponent {
  const normalized = normalize({
    ...(row as Partial<FooterComponent>),
    social_links: normalizeSocialLinks(row.social_links),
  }, row as unknown as FooterComponent);
  return {
    ...normalized,
    created_at: String(row.created_at ?? normalized.created_at),
    updated_at: String(row.updated_at ?? normalized.updated_at),
    deleted_at: row.deleted_at === null || row.deleted_at === undefined ? null : String(row.deleted_at),
  };
}

async function readAllFromSupabase(): Promise<FooterComponent[] | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from(TABLE).select("*");
    if (error) throw error;
    if (!data || data.length === 0) return null;
    return (data as unknown as Array<Record<string, unknown>>).map(rowToFooter);
  } catch {
    return null;
  }
}

async function upsertToSupabase(item: FooterComponent): Promise<void> {
  try {
    const supabase = createAdminClient();
    const record: Record<string, unknown> = { ...item, social_links: item.social_links as unknown as Json };
    const { error } = await supabase.from(TABLE).upsert(record, { onConflict: "id" });
    if (error) throw error;
  } catch (error) {
    throw error instanceof Error ? error : new Error(errorMessageFromUnknown(error, "No se pudo guardar el footer en Supabase."));
  }
}

async function deleteFromSupabase(id: string): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from(TABLE).delete().eq("id", id);
  } catch { /* best-effort */ }
}

export async function getFooters() {
  const cached = getCachedFooters();
  if (cached) return cached;

  const fromSupabase = await withTimeout(readAllFromSupabase(), SUPABASE_READ_TIMEOUT_MS, null);
  if (fromSupabase) {
    cacheFooters(fromSupabase);
    return fromSupabase;
  }

  const localFooters = await readJsonFile<FooterComponent[]>(FILE_NAME, []);
  cacheFooters(localFooters);
  return localFooters;
}

/** Pick the one site footer: published first, then most recently updated. */
export function selectCanonicalFooter(footers: FooterComponent[]): FooterComponent | null {
  const active = footers.filter((item) => item.deleted_at === null);
  if (!active.length) return null;

  return [...active].sort((a, b) => {
    const publishedScore = (item: FooterComponent) => (item.status === "published" ? 1 : 0);
    const pubDiff = publishedScore(b) - publishedScore(a);
    if (pubDiff !== 0) return pubDiff;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  })[0];
}

export async function getPublicFooter() {
  const footers = await getFooters();
  return selectCanonicalFooter(footers);
}

export async function getFooterById(id: string) {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
    if (!error && data) {
      return rowToFooter(data as Record<string, unknown>);
    }
  } catch { /* fall through */ }
  const all = await readJsonFile<FooterComponent[]>(FILE_NAME, []);
  return all.find((x) => x.id === id) ?? null;
}

export async function createFooter(data: Input) {
  invalidateFootersCache();
  const all = await getFooters();
  const next = normalize(data);
  await writeJsonFile(FILE_NAME, [next, ...all]);
  await upsertToSupabase(next);
  cacheFooters([next, ...all]);
  await logAction({ action: "create", entity_type: "footer", entity_id: next.id, entity_title: next.name, new_data: next });
  return next;
}

export async function updateFooter(id: string, data: Input) {
  invalidateFootersCache();
  const all = await getFooters();
  const idx = all.findIndex((x) => x.id === id);
  if (idx === -1) return null;
  const old = all[idx];
  const next = normalize(data, old);
  all[idx] = next;
  await writeJsonFile(FILE_NAME, all);
  await upsertToSupabase(next);
  cacheFooters(all);
  if (old.status !== next.status) {
    if (next.status === "published") await logAction({ action: "publish", entity_type: "footer", entity_id: next.id, entity_title: next.name, old_data: old, new_data: next });
    else if (old.status === "published") await logAction({ action: "unpublish", entity_type: "footer", entity_id: next.id, entity_title: next.name, old_data: old, new_data: next });
  }
  await logAction({ action: "update", entity_type: "footer", entity_id: next.id, entity_title: next.name, old_data: old, new_data: next });
  return next;
}

export async function duplicateFooter(id: string) {
  const all = await getFooters();
  const orig = all.find((x) => x.id === id);
  if (!orig) return null;
  const copy = normalize({ ...orig, name: `${orig.name} (copia)`, status: "draft" });
  await writeJsonFile(FILE_NAME, [copy, ...all]);
  await upsertToSupabase(copy);
  cacheFooters([copy, ...all]);
  await logAction({ action: "duplicate", entity_type: "footer", entity_id: orig.id, entity_title: orig.name, new_data: copy });
  return copy;
}

export async function moveFooterToTrash(id: string, deletedBy?: string) {
  const dBy = deletedBy ?? await getCurrentUserEmail();
  const all = await readJsonFile<FooterComponent[]>(FILE_NAME, []);
  const idx = all.findIndex((x) => x.id === id);
  if (idx === -1) return null;
  const d = new Date().toISOString();
  const t: FooterComponent = { ...all[idx], status: "deleted", deleted_at: d, updated_at: d };
  all[idx] = t;
  await writeJsonFile(FILE_NAME, all);
  await upsertToSupabase(t);
  cacheFooters(all);
  await addTrashItem({ id: randomUUID(), entity_type: "footer", entity_id: id, title: t.name, deleted_by: dBy, deleted_at: d, restore_data: all[idx] });
  await logAction({ action: "trash", entity_type: "footer", entity_id: id, entity_title: t.name, old_data: all[idx], user_email: dBy });
  return t;
}

export async function restoreFooter(id: string) {
  const all = await readJsonFile<FooterComponent[]>(FILE_NAME, []);
  const idx = all.findIndex((x) => x.id === id);
  const ti = await getTrashItemByEntity(id);
  if (idx === -1 && !ti) return null;
  const r = ti?.restore_data && typeof ti.restore_data === "object"
    ? { ...(ti.restore_data as FooterComponent), status: "draft" as const, deleted_at: null, updated_at: new Date().toISOString() }
    : { ...all[idx], status: "draft" as const, deleted_at: null, updated_at: new Date().toISOString() };
  if (idx === -1) { const a = await readJsonFile<FooterComponent[]>(FILE_NAME, []); a.unshift(r); await writeJsonFile(FILE_NAME, a); }
  else { all[idx] = r; await writeJsonFile(FILE_NAME, all); }
  await upsertToSupabase(r);
  cacheFooters(idx === -1 ? [r, ...all] : all);
  if (ti) await removeTrashItem(ti.id);
  await logAction({ action: "restore", entity_type: "footer", entity_id: r.id, entity_title: r.name });
  return r;
}

export async function deleteFooterPermanently(id: string) {
  const all = await readJsonFile<FooterComponent[]>(FILE_NAME, []);
  const item = all.find((x) => x.id === id);
  const next = all.filter((x) => x.id !== id);
  if (next.length === all.length) return false;
  await writeJsonFile(FILE_NAME, next);
  await deleteFromSupabase(id);
  cacheFooters(next);
  const ti = await getTrashItemByEntity(id);
  if (ti) await removeTrashItem(ti.id);
  if (item) await logAction({ action: "delete_permanently", entity_type: "footer", entity_id: id, entity_title: item.name, old_data: item });
  return true;
}
