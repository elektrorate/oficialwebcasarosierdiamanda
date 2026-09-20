import { randomUUID } from "crypto";
import { createAdminClient } from "../supabase/admin";
import { addTrashItem, getCurrentUserEmail, getTrashItemByEntity, removeTrashItem } from "./trash";
import { readJsonFile, writeJsonFile } from "./local-storage";
import { isCouponStatus, isDiscountType } from "./types";
import type { Coupon } from "./types";
import { logAction } from "./history-logs";

const TABLE = "coupons";
const FILE_NAME = "coupons.json";

type CouponInput = Partial<Omit<Coupon, "id" | "created_at" | "updated_at" | "deleted_at">> & { id?: string; deleted_at?: string | null };

function normalize(input: CouponInput, existing?: Coupon) {
  const now = new Date().toISOString();
  const code = String(input.code ?? existing?.code ?? "").trim().toUpperCase();
  const status = input.status ?? existing?.status ?? "active";
  const discountType = input.discount_type ?? existing?.discount_type ?? "percentage";
  if (!code) throw new Error("El código es obligatorio.");
  if (!isCouponStatus(status)) throw new Error("Estado no válido.");
  if (!isDiscountType(discountType)) throw new Error("Tipo de descuento no válido.");
  return {
    id: existing?.id ?? input.id ?? randomUUID(), code, status, discount_type: discountType,
    value: input.value !== undefined ? input.value : (existing?.value ?? null),
    start_date: input.start_date ?? existing?.start_date ?? "",
    end_date: input.end_date ?? existing?.end_date ?? "",
    usage_limit: input.usage_limit !== undefined ? input.usage_limit : (existing?.usage_limit ?? null),
    used_count: input.used_count ?? existing?.used_count ?? 0,
    minimum_order_amount: input.minimum_order_amount !== undefined ? input.minimum_order_amount : (existing?.minimum_order_amount ?? null),
    created_at: existing?.created_at ?? now, updated_at: now,
    deleted_at: input.status === "deleted" ? existing?.deleted_at ?? now : null,
  } satisfies Coupon;
}

// ── Mapping helpers ──

function rowToCoupon(row: Record<string, unknown>): Coupon {
  return row as unknown as Coupon;
}

function couponToRow(c: Coupon): Record<string, unknown> {
  return { ...c };
}

// ── Supabase helpers ──

async function readAllFromSupabase(): Promise<Coupon[] | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from(TABLE).select("*");
    if (error) throw error;
    if (!data || data.length === 0) return null;
    return (data as Array<Record<string, unknown>>).map(rowToCoupon);
  } catch {
    return null;
  }
}

async function readFromSupabase(query: (s: ReturnType<typeof createAdminClient>) => Promise<Record<string, unknown> | null>): Promise<Coupon | null> {
  try {
    const supabase = createAdminClient();
    const row = await query(supabase);
    if (!row) return null;
    return rowToCoupon(row);
  } catch { /* fall through */ }
  return null;
}

async function upsertCoupon(c: Coupon): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from(TABLE).upsert(couponToRow(c), { onConflict: "id" });
  } catch { /* best-effort */ }
}

async function deleteCouponFromDb(id: string): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from(TABLE).delete().eq("id", id);
  } catch { /* best-effort */ }
}

// ── Public API ──

export async function getCoupons() {
  const fromSupabase = await readAllFromSupabase();
  if (fromSupabase) return fromSupabase;
  return readJsonFile<Coupon[]>(FILE_NAME, []);
}

export async function getCouponById(id: string) {
  const result = await readFromSupabase(async (supabase) => {
    const { data } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
    return data as Record<string, unknown> | null;
  });
  if (result) return result;
  const items = await readJsonFile<Coupon[]>(FILE_NAME, []);
  return items.find((c) => c.id === id) ?? null;
}

export async function createCoupon(data: CouponInput) {
  const items = await readJsonFile<Coupon[]>(FILE_NAME, []);
  const next = normalize(data);
  await writeJsonFile(FILE_NAME, [next, ...items]);
  await upsertCoupon(next);
  await logAction({ action: "create", entity_type: "coupon", entity_id: next.id, entity_title: next.code, new_data: next });
  return next;
}

export async function updateCoupon(id: string, data: CouponInput) {
  const items = await readJsonFile<Coupon[]>(FILE_NAME, []);
  const index = items.findIndex((c) => c.id === id);
  if (index === -1) return null;
  const old = items[index];
  const next = normalize(data, old);
  items[index] = next;
  await writeJsonFile(FILE_NAME, items);
  await upsertCoupon(next);
  await logAction({ action: "update", entity_type: "coupon", entity_id: next.id, entity_title: next.code, old_data: old, new_data: next });
  return next;
}

export async function duplicateCoupon(id: string) {
  const items = await readJsonFile<Coupon[]>(FILE_NAME, []);
  const o = items.find((c) => c.id === id);
  if (!o) return null;
  const c = normalize({ ...o, code: `${o.code}-COPY`, status: "inactive" });
  await writeJsonFile(FILE_NAME, [c, ...items]);
  await upsertCoupon(c);
  await logAction({ action: "duplicate", entity_type: "coupon", entity_id: o.id, entity_title: o.code, new_data: c });
  return c;
}

export async function moveCouponToTrash(id: string, dBy?: string) {
  const resolvedBy = dBy ?? await getCurrentUserEmail();
  const items = await readJsonFile<Coupon[]>(FILE_NAME, []);
  const index = items.findIndex((c) => c.id === id);
  if (index === -1) return null;
  const c = items[index];
  const d = new Date().toISOString();
  const t: Coupon = { ...c, status: "deleted", deleted_at: d, updated_at: d };
  items[index] = t;
  await writeJsonFile(FILE_NAME, items);
  await upsertCoupon(t);
  await addTrashItem({ id: randomUUID(), entity_type: "coupon", entity_id: c.id, title: c.code, deleted_by: resolvedBy, deleted_at: d, restore_data: c });
  await logAction({ action: "trash", entity_type: "coupon", entity_id: c.id, entity_title: c.code, old_data: c, user_email: resolvedBy });
  return t;
}

export async function restoreCoupon(id: string) {
  const items = await readJsonFile<Coupon[]>(FILE_NAME, []);
  const index = items.findIndex((c) => c.id === id);
  const trashItem = await getTrashItemByEntity(id);
  if (index === -1 && !trashItem) return null;
  const r = trashItem?.restore_data && typeof trashItem.restore_data === "object"
    ? ({ ...(trashItem.restore_data as Coupon), status: "inactive", deleted_at: null, updated_at: new Date().toISOString() } as Coupon)
    : ({ ...items[index], status: "inactive", deleted_at: null, updated_at: new Date().toISOString() } as Coupon);
  if (index === -1) { const a = await readJsonFile<Coupon[]>(FILE_NAME, []); a.unshift(r); await writeJsonFile(FILE_NAME, a); }
  else { items[index] = r; await writeJsonFile(FILE_NAME, items); }
  await upsertCoupon(r);
  if (trashItem) await removeTrashItem(trashItem.id);
  await logAction({ action: "restore", entity_type: "coupon", entity_id: r.id, entity_title: r.code });
  return r;
}

export async function deleteCouponPermanently(id: string) {
  const items = await readJsonFile<Coupon[]>(FILE_NAME, []);
  const item = items.find((c) => c.id === id);
  const next = items.filter((c) => c.id !== id);
  if (next.length === items.length) return false;
  await writeJsonFile(FILE_NAME, next);
  await deleteCouponFromDb(id);
  const t = await getTrashItemByEntity(id);
  if (t) await removeTrashItem(t.id);
  if (item) await logAction({ action: "delete_permanently", entity_type: "coupon", entity_id: id, entity_title: item.code, old_data: item });
  return true;
}
