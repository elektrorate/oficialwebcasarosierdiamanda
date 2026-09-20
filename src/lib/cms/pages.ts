import { randomUUID } from "crypto";
import { createAdminClient } from "../supabase/admin";
import { addTrashItem, getCurrentUserEmail, getTrashItemByEntity, removeTrashItem } from "./trash";
import { readJsonFile, writeJsonFile } from "./local-storage";
import { isPageStatus, isPageType } from "./types";
import type { Page } from "./types";
import { logAction } from "./history-logs";

const TABLE = "pages";
const FILE_NAME = "pages.json";

type PageInput = Partial<Omit<Page, "id" | "created_at" | "updated_at" | "deleted_at">> & {
  id?: string;
  deleted_at?: string | null;
};

function toSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function uniqueSlug(items: Page[], baseSlug: string, currentId?: string) {
  const taken = new Set(items.filter((item) => item.id !== currentId).map((item) => item.slug));
  if (!taken.has(baseSlug)) return baseSlug;
  let counter = 2;
  while (taken.has(`${baseSlug}-${counter}`)) counter++;
  return `${baseSlug}-${counter}`;
}

function normalizePage(input: PageInput, existing?: Page, allItems: Page[] = []) {
  const title = String(input.title ?? existing?.title ?? "").trim();
  const slugBase = String(input.slug ?? existing?.slug ?? "").trim() || toSlug(title);
  const slug = uniqueSlug(allItems, slugBase || toSlug(title), existing?.id);
  const now = new Date().toISOString();
  const type = input.type ?? existing?.type;
  const status = input.status ?? existing?.status ?? "draft";

  if (!title) throw new Error("El título es obligatorio.");
  if (!isPageType(type)) throw new Error("Tipo de página no válido.");
  if (!isPageStatus(status)) throw new Error("Estado de página no válido.");

  return {
    id: existing?.id ?? input.id ?? randomUUID(),
    title,
    slug,
    type,
    status,
    header_id: input.header_id !== undefined ? input.header_id : (existing?.header_id ?? null),
    social_gallery_id: input.social_gallery_id !== undefined ? input.social_gallery_id : (existing?.social_gallery_id ?? null),
    testimonials_id: input.testimonials_id !== undefined ? input.testimonials_id : (existing?.testimonials_id ?? null),
    footer_id: input.footer_id !== undefined ? input.footer_id : (existing?.footer_id ?? null),
    seo_title: String(input.seo_title ?? existing?.seo_title ?? "").trim(),
    seo_description: String(input.seo_description ?? existing?.seo_description ?? "").trim(),
    seo_image: String(input.seo_image ?? existing?.seo_image ?? "").trim(),
    created_at: existing?.created_at ?? now,
    updated_at: now,
    deleted_at: input.status === "deleted" ? existing?.deleted_at ?? now : null,
  } satisfies Page;
}

async function readAllFromSupabase(): Promise<Page[] | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from(TABLE).select("*");
    if (error) throw error;
    if (!data || data.length === 0) return null;
    return data as unknown as Page[];
  } catch {
    return null;
  }
}

async function upsertToSupabase(item: Page): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from(TABLE).upsert(item as unknown as Record<string, unknown>, { onConflict: "id" });
  } catch { /* best-effort */ }
}

async function seedSupabase(items: Page[]): Promise<void> {
  if (items.length === 0) return;
  try {
    const supabase = createAdminClient();
    await supabase.from(TABLE).upsert(items as unknown as Record<string, unknown>[], { onConflict: "id" });
  } catch { /* best-effort */ }
}

async function deleteFromSupabase(id: string): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from(TABLE).delete().eq("id", id);
  } catch { /* best-effort */ }
}

export async function getPages() {
  const fromSupabase = await readAllFromSupabase();
  if (fromSupabase) return fromSupabase;
  const localPages = await readJsonFile<Page[]>(FILE_NAME, []);
  await seedSupabase(localPages);
  return localPages;
}

export async function getPageById(id: string) {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
    if (!error && data) return data as unknown as Page;
  } catch { /* fall through */ }
  const pages = await readJsonFile<Page[]>(FILE_NAME, []);
  return pages.find((p) => p.id === id) ?? null;
}

export async function getPageBySlug(slug: string) {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from(TABLE).select("*").eq("slug", slug).maybeSingle();
    if (!error && data) return data as unknown as Page;
  } catch { /* fall through */ }
  const pages = await readJsonFile<Page[]>(FILE_NAME, []);
  return pages.find((p) => p.slug === slug) ?? null;
}

export async function createPage(data: PageInput) {
  const pages = await readJsonFile<Page[]>(FILE_NAME, []);
  const next = normalizePage(data, undefined, pages);
  await writeJsonFile(FILE_NAME, [next, ...pages]);
  await upsertToSupabase(next);
  await logAction({ action: "create", entity_type: "page", entity_id: next.id, entity_title: next.title, new_data: next });
  return next;
}

export async function updatePage(id: string, data: PageInput) {
  const pages = await readJsonFile<Page[]>(FILE_NAME, []);
  const index = pages.findIndex((p) => p.id === id);
  if (index === -1) return null;
  const old = pages[index];
  const next = normalizePage(data, old, pages);
  pages[index] = next;
  await writeJsonFile(FILE_NAME, pages);
  await upsertToSupabase(next);
  if (old.status !== next.status) {
    if (next.status === "published") await logAction({ action: "publish", entity_type: "page", entity_id: next.id, entity_title: next.title, old_data: old, new_data: next });
    else if (old.status === "published") await logAction({ action: "unpublish", entity_type: "page", entity_id: next.id, entity_title: next.title, old_data: old, new_data: next });
  }
  await logAction({ action: "update", entity_type: "page", entity_id: next.id, entity_title: next.title, old_data: old, new_data: next });
  return next;
}

export async function duplicatePage(id: string) {
  const pages = await readJsonFile<Page[]>(FILE_NAME, []);
  const original = pages.find((p) => p.id === id);
  if (!original) return null;
  const copy = normalizePage(
    { ...original, title: `${original.title} (copia)`, slug: "", status: "draft" },
    undefined,
    pages,
  );
  await writeJsonFile(FILE_NAME, [copy, ...pages]);
  await upsertToSupabase(copy);
  await logAction({ action: "duplicate", entity_type: "page", entity_id: original.id, entity_title: original.title, new_data: copy });
  return copy;
}

export async function movePageToTrash(id: string, deletedBy?: string) {
  const dBy = deletedBy ?? await getCurrentUserEmail();
  const pages = await readJsonFile<Page[]>(FILE_NAME, []);
  const index = pages.findIndex((p) => p.id === id);
  if (index === -1) return null;
  const current = pages[index];
  const deletedAt = new Date().toISOString();
  const trashed: Page = { ...current, status: "deleted", deleted_at: deletedAt, updated_at: deletedAt };
  pages[index] = trashed;
  await writeJsonFile(FILE_NAME, pages);
  await upsertToSupabase(trashed);
  await addTrashItem({
    id: randomUUID(),
    entity_type: "page",
    entity_id: current.id,
    title: current.title,
    deleted_by: dBy,
    deleted_at: deletedAt,
    restore_data: current,
  });
  await logAction({ action: "trash", entity_type: "page", entity_id: current.id, entity_title: current.title, old_data: current, user_email: dBy });
  return trashed;
}

export async function restorePage(id: string) {
  const pages = await readJsonFile<Page[]>(FILE_NAME, []);
  const index = pages.findIndex((p) => p.id === id);
  const trashItem = await getTrashItemByEntity(id);
  if (index === -1 && !trashItem) return null;
  const restored = trashItem?.restore_data && typeof trashItem.restore_data === "object"
    ? ({ ...(trashItem.restore_data as Page), status: "draft", deleted_at: null, updated_at: new Date().toISOString() } as Page)
    : ({ ...pages[index], status: "draft", deleted_at: null, updated_at: new Date().toISOString() } as Page);
  if (index === -1) {
    const all = await readJsonFile<Page[]>(FILE_NAME, []);
    all.unshift(restored);
    await writeJsonFile(FILE_NAME, all);
  } else {
    pages[index] = restored;
    await writeJsonFile(FILE_NAME, pages);
  }
  await upsertToSupabase(restored);
  if (trashItem) await removeTrashItem(trashItem.id);
  await logAction({ action: "restore", entity_type: "page", entity_id: restored.id, entity_title: restored.title });
  return restored;
}

export async function deletePagePermanently(id: string) {
  const pages = await readJsonFile<Page[]>(FILE_NAME, []);
  const item = pages.find((p) => p.id === id);
  const next = pages.filter((p) => p.id !== id);
  if (next.length === pages.length) return false;
  await writeJsonFile(FILE_NAME, next);
  await deleteFromSupabase(id);
  const trashItem = await getTrashItemByEntity(id);
  if (trashItem) await removeTrashItem(trashItem.id);
  if (item) await logAction({ action: "delete_permanently", entity_type: "page", entity_id: id, entity_title: item.title, old_data: item });
  return true;
}
