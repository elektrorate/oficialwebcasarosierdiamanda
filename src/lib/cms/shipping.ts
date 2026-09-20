import { randomUUID } from "crypto";
import { createAdminClient } from "../supabase/admin";
import { addTrashItem, getCurrentUserEmail, getTrashItemByEntity, removeTrashItem } from "./trash";
import { readJsonFile, writeJsonFile } from "./local-storage";
import { isShippingMethodStatus } from "./types";
import type { ShippingMethod } from "./types";
import { logAction } from "./history-logs";

const TABLE = "shipping_methods";
const FILE_NAME = "shipping-methods.json";

type ShipInput = Partial<Omit<ShippingMethod, "id" | "created_at" | "updated_at">> & {
  id?: string;
  deleted_at?: string | null;
};

function normalize(input: ShipInput, existing?: ShippingMethod) {
  const now = new Date().toISOString();
  const name = String(input.name ?? existing?.name ?? "").trim();
  const status = input.status ?? existing?.status ?? "inactive";
  if (!name) throw new Error("El nombre es obligatorio.");
  if (!isShippingMethodStatus(status)) throw new Error("Estado no válido.");
  return {
    id: existing?.id ?? input.id ?? randomUUID(), name, status,
    type: String(input.type ?? existing?.type ?? "standard").trim(),
    price: input.price !== undefined ? input.price : (existing?.price ?? null),
    countries: Array.isArray(input.countries ?? existing?.countries) ? [...(input.countries ?? existing?.countries ?? [])] : [],
    description: String(input.description ?? existing?.description ?? "").trim(),
    sort_order: input.sort_order ?? existing?.sort_order ?? 0,
    created_at: existing?.created_at ?? now,
    updated_at: now,
    deleted_at: input.deleted_at !== undefined ? input.deleted_at : (existing?.deleted_at ?? null),
  } satisfies ShippingMethod;
}

// ── Mapping helpers ──

function rowToShippingMethod(row: Record<string, unknown>): ShippingMethod {
  return {
    ...row,
    countries: Array.isArray(row.countries) ? row.countries : [],
  } as unknown as ShippingMethod;
}

function shippingMethodToRow(s: ShippingMethod): Record<string, unknown> {
  return { ...s };
}

// ── Supabase helpers ──

async function readAllFromSupabase(): Promise<ShippingMethod[] | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from(TABLE).select("*");
    if (error) throw error;
    if (!data || data.length === 0) return null;
    return (data as Array<Record<string, unknown>>).map(rowToShippingMethod);
  } catch {
    return null;
  }
}

async function readFromSupabase(query: (s: ReturnType<typeof createAdminClient>) => Promise<Record<string, unknown> | null>): Promise<ShippingMethod | null> {
  try {
    const supabase = createAdminClient();
    const row = await query(supabase);
    if (!row) return null;
    return rowToShippingMethod(row);
  } catch { /* fall through */ }
  return null;
}

async function upsertShippingMethod(s: ShippingMethod): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from(TABLE).upsert(shippingMethodToRow(s), { onConflict: "id" });
  } catch { /* best-effort */ }
}

async function deleteShippingMethodFromDb(id: string): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from(TABLE).delete().eq("id", id);
  } catch { /* best-effort */ }
}

// ── Public API ──

export async function getShippingMethods() {
  const fromSupabase = await readAllFromSupabase();
  if (fromSupabase) return fromSupabase;
  return readJsonFile<ShippingMethod[]>(FILE_NAME, []);
}

export async function getShippingMethodById(id: string) {
  const result = await readFromSupabase(async (supabase) => {
    const { data } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
    return data as Record<string, unknown> | null;
  });
  if (result) return result;
  const items = await readJsonFile<ShippingMethod[]>(FILE_NAME, []);
  return items.find((s) => s.id === id) ?? null;
}

export async function createShippingMethod(data: ShipInput) {
  const items = await readJsonFile<ShippingMethod[]>(FILE_NAME, []);
  const next = normalize(data);
  await writeJsonFile(FILE_NAME, [next, ...items]);
  await upsertShippingMethod(next);
  await logAction({ action: "create", entity_type: "shipping_method", entity_id: next.id, entity_title: next.name, new_data: next });
  return next;
}

export async function updateShippingMethod(id: string, data: ShipInput) {
  const items = await readJsonFile<ShippingMethod[]>(FILE_NAME, []);
  const index = items.findIndex((s) => s.id === id);
  if (index === -1) return null;
  const old = items[index];
  const next = normalize(data, old);
  items[index] = next;
  await writeJsonFile(FILE_NAME, items);
  await upsertShippingMethod(next);
  await logAction({ action: "update", entity_type: "shipping_method", entity_id: next.id, entity_title: next.name, old_data: old, new_data: next });
  return next;
}

export async function deleteShippingMethod(id: string) {
  const items = await readJsonFile<ShippingMethod[]>(FILE_NAME, []);
  const item = items.find((s) => s.id === id);
  const next = items.filter((s) => s.id !== id);
  if (next.length === items.length) return false;
  await writeJsonFile(FILE_NAME, next);
  await deleteShippingMethodFromDb(id);
  if (item) await logAction({ action: "delete_permanently", entity_type: "shipping_method", entity_id: id, entity_title: item.name, old_data: item });
  return true;
}

export async function moveShippingMethodToTrash(id: string, dBy?: string) {
  const resolvedBy = dBy ?? await getCurrentUserEmail();
  const items = await readJsonFile<ShippingMethod[]>(FILE_NAME, []);
  const index = items.findIndex((s) => s.id === id);
  if (index === -1) return null;
  const c = items[index];
  const d = new Date().toISOString();
  const t: ShippingMethod = { ...c, status: "deleted", updated_at: d, deleted_at: d };
  items[index] = t;
  await writeJsonFile(FILE_NAME, items);
  await upsertShippingMethod(t);
  await addTrashItem({ id: randomUUID(), entity_type: "shipping_method", entity_id: c.id, title: c.name, deleted_by: resolvedBy, deleted_at: d, restore_data: c });
  await logAction({ action: "trash", entity_type: "shipping_method", entity_id: c.id, entity_title: c.name, old_data: c, user_email: resolvedBy });
  return t;
}

export async function restoreShippingMethod(id: string) {
  const items = await readJsonFile<ShippingMethod[]>(FILE_NAME, []);
  const index = items.findIndex((s) => s.id === id);
  const trashItem = await getTrashItemByEntity(id);
  if (index === -1 && !trashItem) return null;
  const now = new Date().toISOString();
  const r = trashItem?.restore_data && typeof trashItem.restore_data === "object"
    ? ({ ...(trashItem.restore_data as ShippingMethod), status: "inactive", updated_at: now, deleted_at: null } as ShippingMethod)
    : ({ ...items[index], status: "inactive", updated_at: now, deleted_at: null } as ShippingMethod);
  if (index === -1) { const a = await readJsonFile<ShippingMethod[]>(FILE_NAME, []); a.unshift(r); await writeJsonFile(FILE_NAME, a); }
  else { items[index] = r; await writeJsonFile(FILE_NAME, items); }
  await upsertShippingMethod(r);
  if (trashItem) await removeTrashItem(trashItem.id);
  await logAction({ action: "restore", entity_type: "shipping_method", entity_id: r.id, entity_title: r.name });
  return r;
}
