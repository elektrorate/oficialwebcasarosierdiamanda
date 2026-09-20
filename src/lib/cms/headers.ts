import { randomUUID } from "crypto";
import { createAdminClient } from "../supabase/admin";
import { addTrashItem, getCurrentUserEmail, getTrashItemByEntity, removeTrashItem } from "./trash";
import { readJsonFile, writeJsonFile } from "./local-storage";
import { isHeaderStatus, isHeaderType } from "./types";
import type { Header, HeaderOverlayImage } from "./types";
import { logAction } from "./history-logs";

const TABLE = "headers";
const FILE_NAME = "headers.json";

type HeaderInput = Partial<Omit<Header, "id" | "created_at" | "updated_at" | "deleted_at">> & {
  id?: string;
  deleted_at?: string | null;
};

function hasSupabaseAdminEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function uniqueSlug(items: Header[], baseSlug: string, currentId?: string) {
  const taken = new Set(items.filter((item) => item.id !== currentId).map((item) => item.slug));
  if (!taken.has(baseSlug)) return baseSlug;
  let counter = 2;
  while (taken.has(`${baseSlug}-${counter}`)) counter++;
  return `${baseSlug}-${counter}`;
}

function normalizeArray<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) ? value : fallback;
}

function normalizeOverlayImages(value: unknown): HeaderOverlayImage[] {
  const items = normalizeArray<Record<string, unknown>>(value, []).map((item, index) => ({
    id: String(item.id ?? `overlay-${index}`),
    image: String(item.image ?? ""),
    alt: String(item.alt ?? ""),
    width: String(item.width ?? ""),
    height: String(item.height ?? ""),
    positionX: String(item.positionX ?? ""),
    positionY: String(item.positionY ?? ""),
    desktopPositionX: String(item.desktopPositionX ?? ""),
    desktopPositionY: String(item.desktopPositionY ?? ""),
    mobilePositionX: String(item.mobilePositionX ?? ""),
    mobilePositionY: String(item.mobilePositionY ?? ""),
    zIndex: Number(item.zIndex ?? 1),
    opacity: Number(item.opacity ?? 1),
    rotation: String(item.rotation ?? "0deg"),
    visibleDesktop: Boolean(item.visibleDesktop ?? true),
    visibleMobile: Boolean(item.visibleMobile ?? true),
    animation: String(item.animation ?? "none"),
    order: Number(item.order ?? index),
  }));
  return items;
}

function normalizeHeader(input: HeaderInput, existing?: Header, allItems: Header[] = []) {
  const name = String(input.name ?? existing?.name ?? "").trim();
  const slugBase = String(input.slug ?? existing?.slug ?? "").trim() || toSlug(name);
  const slug = uniqueSlug(allItems, slugBase || toSlug(name), existing?.id);
  const now = new Date().toISOString();
  const type = input.type ?? existing?.type;
  const status = input.status ?? existing?.status ?? "draft";

  if (!name) throw new Error("El nombre es obligatorio.");
  if (!isHeaderType(type)) throw new Error("Tipo de header no válido.");
  if (!isHeaderStatus(status)) throw new Error("Estado de header no válido.");

  return {
    id: existing?.id ?? input.id ?? randomUUID(),
    name,
    slug,
    type,
    status,
    title: String(input.title ?? existing?.title ?? "").trim(),
    subtitle: String(input.subtitle ?? existing?.subtitle ?? "").trim(),
    eyebrow: String(input.eyebrow ?? existing?.eyebrow ?? "").trim(),
    desktop_image_url: String(input.desktop_image_url ?? existing?.desktop_image_url ?? "").trim(),
    mobile_image_url: String(input.mobile_image_url ?? existing?.mobile_image_url ?? "").trim(),
    overlay_enabled: Boolean(input.overlay_enabled ?? existing?.overlay_enabled ?? false),
    overlay_color: String(input.overlay_color ?? existing?.overlay_color ?? "#000000").trim(),
    overlay_opacity: input.overlay_opacity ?? existing?.overlay_opacity ?? 0,
    gradient_enabled: Boolean(input.gradient_enabled ?? existing?.gradient_enabled ?? false),
    gradient_css: String(input.gradient_css ?? existing?.gradient_css ?? "").trim(),
    desktop_height: String(input.desktop_height ?? existing?.desktop_height ?? "80vh").trim(),
    mobile_height: String(input.mobile_height ?? existing?.mobile_height ?? "60vh").trim(),
    content_position: String(input.content_position ?? existing?.content_position ?? "center").trim(),
    content_alignment: String(input.content_alignment ?? existing?.content_alignment ?? "center").trim(),
    menu_color: String(input.menu_color ?? existing?.menu_color ?? "light").trim(),
    logo_variant: String(input.logo_variant ?? existing?.logo_variant ?? "default").trim(),
    visual_variant: String(input.visual_variant ?? existing?.visual_variant ?? "minimal").trim(),
    cta_label: String(input.cta_label ?? existing?.cta_label ?? "").trim(),
    cta_url: String(input.cta_url ?? existing?.cta_url ?? "").trim(),
    logo: String(input.logo ?? existing?.logo ?? "").trim(),
    logoAlt: String(input.logoAlt ?? existing?.logoAlt ?? "").trim(),
    logoWidth: String(input.logoWidth ?? existing?.logoWidth ?? "120px").trim(),
    logoHeight: String(input.logoHeight ?? existing?.logoHeight ?? "auto").trim(),
    logoPositionX: String(input.logoPositionX ?? existing?.logoPositionX ?? "8%").trim(),
    logoPositionY: String(input.logoPositionY ?? existing?.logoPositionY ?? "40px").trim(),
    logoDesktopPositionX: String(input.logoDesktopPositionX ?? existing?.logoDesktopPositionX ?? "").trim(),
    logoDesktopPositionY: String(input.logoDesktopPositionY ?? existing?.logoDesktopPositionY ?? "").trim(),
    logoMobilePositionX: String(input.logoMobilePositionX ?? existing?.logoMobilePositionX ?? "").trim(),
    logoMobilePositionY: String(input.logoMobilePositionY ?? existing?.logoMobilePositionY ?? "").trim(),
    logoZIndex: input.logoZIndex ?? existing?.logoZIndex ?? 10,
    logoVisibleDesktop: Boolean(input.logoVisibleDesktop ?? existing?.logoVisibleDesktop ?? true),
    logoVisibleMobile: Boolean(input.logoVisibleMobile ?? existing?.logoVisibleMobile ?? true),
    menuId: input.menuId !== undefined ? (input.menuId || null) : existing?.menuId ?? null,
    showMenu: Boolean(input.showMenu ?? existing?.showMenu ?? true),
    menuPositionX: String(input.menuPositionX ?? existing?.menuPositionX ?? "50%").trim(),
    menuPositionY: String(input.menuPositionY ?? existing?.menuPositionY ?? "40px").trim(),
    menuDesktopPositionX: String(input.menuDesktopPositionX ?? existing?.menuDesktopPositionX ?? "").trim(),
    menuDesktopPositionY: String(input.menuDesktopPositionY ?? existing?.menuDesktopPositionY ?? "").trim(),
    menuMobilePositionX: String(input.menuMobilePositionX ?? existing?.menuMobilePositionX ?? "").trim(),
    menuMobilePositionY: String(input.menuMobilePositionY ?? existing?.menuMobilePositionY ?? "").trim(),
    menuAlign: String(input.menuAlign ?? existing?.menuAlign ?? "center").trim(),
    menuZIndex: input.menuZIndex ?? existing?.menuZIndex ?? 20,
    menuVisibleDesktop: Boolean(input.menuVisibleDesktop ?? existing?.menuVisibleDesktop ?? true),
    menuVisibleMobile: Boolean(input.menuVisibleMobile ?? existing?.menuVisibleMobile ?? true),
    menuTextColor: String(input.menuTextColor ?? existing?.menuTextColor ?? "#ffffff").trim(),
    menuHoverColor: String(input.menuHoverColor ?? existing?.menuHoverColor ?? "#cccccc").trim(),
    showMenuSeparators: Boolean(input.showMenuSeparators ?? existing?.showMenuSeparators ?? false),
    overlayImages: normalizeOverlayImages(input.overlayImages ?? existing?.overlayImages ?? []),
    assignedPages: normalizeArray<string>(input.assignedPages ?? existing?.assignedPages ?? [], []),
    isDefault: Boolean(input.isDefault ?? existing?.isDefault ?? false),
    created_at: existing?.created_at ?? now,
    updated_at: now,
    deleted_at: input.status === "deleted" ? existing?.deleted_at ?? now : null,
  } satisfies Header;
}

async function readAllFromSupabase(): Promise<Header[] | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from(TABLE).select("*");
    if (error) throw error;
    if (!data || data.length === 0) return null;
    return data as unknown as Header[];
  } catch {
    return null;
  }
}

async function upsertToSupabase(item: Header): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from(TABLE).upsert(item as unknown as Record<string, unknown>, { onConflict: "id" });
  } catch { /* best-effort */ }
}

async function deleteFromSupabase(id: string): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from(TABLE).delete().eq("id", id);
  } catch { /* best-effort */ }
}

async function readLocalHeaders() {
  return readJsonFile<Header[]>(FILE_NAME, []);
}

async function writeLocalHeaders(headers: Header[]) {
  await writeJsonFile(FILE_NAME, headers);
}

async function syncLocalHeaders(headers: Header[]) {
  try {
    await writeLocalHeaders(headers);
  } catch {
    if (!hasSupabaseAdminEnv()) throw new Error("No se pudo guardar el header en almacenamiento local.");
  }
}

export async function getHeaders() {
  const fromSupabase = await readAllFromSupabase();
  if (fromSupabase) return fromSupabase;
  return readLocalHeaders();
}

export async function getHeaderById(id: string) {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
    if (!error && data) return data as unknown as Header;
  } catch { /* fall through */ }
  const headers = await readJsonFile<Header[]>(FILE_NAME, []);
  return headers.find((h) => h.id === id) ?? null;
}

export async function getHeaderBySlug(slug: string) {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from(TABLE).select("*").eq("slug", slug).maybeSingle();
    if (!error && data) return data as unknown as Header;
  } catch { /* fall through */ }
  const headers = await readJsonFile<Header[]>(FILE_NAME, []);
  return headers.find((h) => h.slug === slug) ?? null;
}

export async function createHeader(data: HeaderInput) {
  const headers = await getHeaders();
  const next = normalizeHeader(data, undefined, headers);
  const allHeaders = [next, ...headers];

  if (hasSupabaseAdminEnv()) {
    await upsertToSupabase(next);
    await syncLocalHeaders(allHeaders);
  } else {
    await writeLocalHeaders(allHeaders);
  }

  await logAction({ action: "create", entity_type: "header", entity_id: next.id, entity_title: next.name, new_data: next });
  return next;
}

export async function updateHeader(id: string, data: HeaderInput) {
  const headers = await getHeaders();
  const index = headers.findIndex((h) => h.id === id);
  if (index === -1) return null;
  const old = headers[index];
  const next = normalizeHeader(data, old, headers);
  headers[index] = next;

  if (hasSupabaseAdminEnv()) {
    await upsertToSupabase(next);
    await syncLocalHeaders(headers);
  } else {
    await writeLocalHeaders(headers);
  }

  if (old.status !== next.status) {
    if (next.status === "published") await logAction({ action: "publish", entity_type: "header", entity_id: next.id, entity_title: next.name, old_data: old, new_data: next });
    else if (old.status === "published") await logAction({ action: "unpublish", entity_type: "header", entity_id: next.id, entity_title: next.name, old_data: old, new_data: next });
  }
  await logAction({ action: "update", entity_type: "header", entity_id: next.id, entity_title: next.name, old_data: old, new_data: next });
  return next;
}

export async function duplicateHeader(id: string) {
  const headers = await getHeaders();
  const original = headers.find((h) => h.id === id);
  if (!original) return null;
  const copy = normalizeHeader(
    { ...original, name: `${original.name} (copia)`, slug: "", status: "draft" },
    undefined,
    headers,
  );
  const allHeaders = [copy, ...headers];

  if (hasSupabaseAdminEnv()) {
    await upsertToSupabase(copy);
    await syncLocalHeaders(allHeaders);
  } else {
    await writeLocalHeaders(allHeaders);
  }

  await logAction({ action: "duplicate", entity_type: "header", entity_id: original.id, entity_title: original.name, new_data: copy });
  return copy;
}

export async function moveHeaderToTrash(id: string, deletedBy?: string) {
  const dBy = deletedBy ?? await getCurrentUserEmail();
  const headers = await getHeaders();
  const index = headers.findIndex((h) => h.id === id);
  if (index === -1) return null;
  const current = headers[index];
  const deletedAt = new Date().toISOString();
  const trashed: Header = { ...current, status: "deleted", deleted_at: deletedAt, updated_at: deletedAt };
  headers[index] = trashed;

  if (hasSupabaseAdminEnv()) {
    await upsertToSupabase(trashed);
    await syncLocalHeaders(headers);
  } else {
    await writeLocalHeaders(headers);
  }

  await addTrashItem({
    id: randomUUID(),
    entity_type: "header",
    entity_id: current.id,
    title: current.name,
    deleted_by: dBy,
    deleted_at: deletedAt,
    restore_data: current,
  });
  await logAction({ action: "trash", entity_type: "header", entity_id: current.id, entity_title: current.name, old_data: current, user_email: dBy });
  return trashed;
}

export async function restoreHeader(id: string) {
  const headers = await getHeaders();
  const index = headers.findIndex((h) => h.id === id);
  const trashItem = await getTrashItemByEntity(id);
  if (index === -1 && !trashItem) return null;
  const restored = trashItem?.restore_data && typeof trashItem.restore_data === "object"
    ? ({ ...(trashItem.restore_data as Header), status: "draft", deleted_at: null, updated_at: new Date().toISOString() } as Header)
    : ({ ...headers[index], status: "draft", deleted_at: null, updated_at: new Date().toISOString() } as Header);
  if (index === -1) {
    const all = await getHeaders();
    all.unshift(restored);
    if (hasSupabaseAdminEnv()) {
      await upsertToSupabase(restored);
      await syncLocalHeaders(all);
    } else {
      await writeLocalHeaders(all);
    }
  } else {
    headers[index] = restored;
    if (hasSupabaseAdminEnv()) {
      await upsertToSupabase(restored);
      await syncLocalHeaders(headers);
    } else {
      await writeLocalHeaders(headers);
    }
  }
  if (trashItem) await removeTrashItem(trashItem.id);
  await logAction({ action: "restore", entity_type: "header", entity_id: restored.id, entity_title: restored.name });
  return restored;
}

export async function deleteHeaderPermanently(id: string) {
  const headers = await getHeaders();
  const item = headers.find((h) => h.id === id);
  const next = headers.filter((h) => h.id !== id);
  if (next.length === headers.length) return false;

  if (hasSupabaseAdminEnv()) {
    await deleteFromSupabase(id);
    await syncLocalHeaders(next);
  } else {
    await writeLocalHeaders(next);
  }

  const trashItem = await getTrashItemByEntity(id);
  if (trashItem) await removeTrashItem(trashItem.id);
  if (item) await logAction({ action: "delete_permanently", entity_type: "header", entity_id: id, entity_title: item.name, old_data: item });
  return true;
}
