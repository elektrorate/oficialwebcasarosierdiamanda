import { randomUUID } from "crypto";
import { createAdminClient } from "../supabase/admin";
import { addTrashItem, getCurrentUserEmail, getTrashItemByEntity, removeTrashItem } from "./trash";
import { readJsonFile, writeJsonFile } from "./local-storage";
import { isOrderPaymentStatus, isOrderStatus } from "./types";
import type { Order, OrderItem } from "./types";
import { logAction } from "./history-logs";

const TABLE = "orders";
const ITEMS_TABLE = "order_items";
const FILE_NAME = "orders.json";

type OrderInput = Partial<Omit<Order, "id" | "created_at" | "updated_at" | "deleted_at">> & { id?: string; deleted_at?: string | null };

function normalizeOrder(input: OrderInput, existing?: Order) {
  const now = new Date().toISOString();
  const status = input.status ?? existing?.status ?? "new";
  const paymentStatus = input.payment_status ?? existing?.payment_status ?? "unpaid";
  if (!isOrderStatus(status)) throw new Error("Estado no válido.");
  if (!isOrderPaymentStatus(paymentStatus)) throw new Error("Estado de pago no válido.");
  return {
    id: existing?.id ?? input.id ?? randomUUID(),
    customer_name: String(input.customer_name ?? existing?.customer_name ?? "").trim(),
    customer_email: String(input.customer_email ?? existing?.customer_email ?? "").trim(),
    customer_phone: String(input.customer_phone ?? existing?.customer_phone ?? "").trim(),
    status, payment_status: paymentStatus,
    items: Array.isArray(input.items ?? existing?.items) ? (input.items ?? existing?.items ?? []).map((item) => {
      const it = item as Partial<OrderItem> & Record<string, unknown>;
      return { id: it.id ?? randomUUID(), product_id: String(it.product_id ?? ""), product_name: String(it.product_name ?? ""), quantity: it.quantity ?? 1, unit_price: it.unit_price ?? 0, total: it.total ?? 0 } satisfies OrderItem;
    }) : [],
    subtotal: input.subtotal !== undefined ? input.subtotal : (existing?.subtotal ?? null),
    discount_total: input.discount_total !== undefined ? input.discount_total : (existing?.discount_total ?? null),
    shipping_total: input.shipping_total !== undefined ? input.shipping_total : (existing?.shipping_total ?? null),
    total: input.total !== undefined ? input.total : (existing?.total ?? null),
    coupon_code: String(input.coupon_code ?? existing?.coupon_code ?? "").trim(),
    shipping_method_id: String(input.shipping_method_id ?? existing?.shipping_method_id ?? "").trim(),
    shipping_address: String(input.shipping_address ?? existing?.shipping_address ?? "").trim(),
    payment_method: String(input.payment_method ?? existing?.payment_method ?? "").trim(),
    payment_id: String(input.payment_id ?? existing?.payment_id ?? "").trim(),
    internal_notes: String(input.internal_notes ?? existing?.internal_notes ?? "").trim(),
    created_at: existing?.created_at ?? now,
    updated_at: now,
    deleted_at: input.status === "deleted" ? existing?.deleted_at ?? now : null,
  } satisfies Order;
}

// ── Mapping helpers ──

function rowToOrderItem(row: Record<string, unknown>): OrderItem {
  const { order_id, created_at, ...rest } = row;
  return rest as unknown as OrderItem;
}

function orderItemToRow(orderId: string, item: OrderItem): Record<string, unknown> {
  return { ...item, order_id: orderId };
}

function rowToOrder(row: Record<string, unknown>, items: OrderItem[] = []): Order {
  return {
    ...row,
    items,
  } as unknown as Order;
}

function orderToRow(order: Order): Record<string, unknown> {
  const { items, ...rest } = order;
  return rest;
}

// ── Supabase helpers ──

async function readAllFromSupabase(): Promise<Order[] | null> {
  try {
    const supabase = createAdminClient();
    const { data: orders, error: oe } = await supabase.from(TABLE).select("*");
    if (oe) throw oe;
    if (!orders || orders.length === 0) return null;
    const { data: items, error: ie } = await supabase.from(ITEMS_TABLE).select("*");
    if (ie) throw ie;
    const byOrder: Record<string, OrderItem[]> = {};
    if (items) {
      for (const row of items as Array<Record<string, unknown>>) {
        const oid = row.order_id as string;
        if (!byOrder[oid]) byOrder[oid] = [];
        byOrder[oid].push(rowToOrderItem(row));
      }
    }
    return (orders as Array<Record<string, unknown>>).map((row) =>
      rowToOrder(row, byOrder[row.id as string] ?? [])
    );
  } catch {
    return null;
  }
}

async function fetchOrderWithItems(
  query: (s: ReturnType<typeof createAdminClient>) => Promise<Record<string, unknown> | null>,
): Promise<Order | null> {
  try {
    const supabase = createAdminClient();
    const row = await query(supabase);
    if (!row) return null;
    const { data: items } = await supabase.from(ITEMS_TABLE).select("*").eq("order_id", row.id as string);
    return rowToOrder(row, (items ?? []).map(rowToOrderItem));
  } catch { /* fall through */ }
  return null;
}

async function upsertOrder(order: Order): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from(TABLE).upsert(orderToRow(order), { onConflict: "id" });
  } catch { /* best-effort */ }
}

async function replaceOrderItems(orderId: string, items: OrderItem[]): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from(ITEMS_TABLE).delete().eq("order_id", orderId);
    if (items.length > 0) {
      await supabase.from(ITEMS_TABLE).insert(items.map((item) => orderItemToRow(orderId, item)));
    }
  } catch { /* best-effort */ }
}

async function deleteOrderFromDb(id: string): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from(TABLE).delete().eq("id", id);
  } catch { /* best-effort */ }
}

// ── Public API ──

export async function getOrders() {
  const fromSupabase = await readAllFromSupabase();
  if (fromSupabase) return fromSupabase;
  return readJsonFile<Order[]>(FILE_NAME, []);
}

export async function getOrderById(id: string) {
  const result = await fetchOrderWithItems(async (supabase) => {
    const { data } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
    return data as Record<string, unknown> | null;
  });
  if (result) return result;
  const items = await readJsonFile<Order[]>(FILE_NAME, []);
  return items.find((o) => o.id === id) ?? null;
}

export async function createOrder(data: OrderInput) {
  const items = await readJsonFile<Order[]>(FILE_NAME, []);
  const next = normalizeOrder(data);
  await writeJsonFile(FILE_NAME, [next, ...items]);
  await upsertOrder(next);
  await replaceOrderItems(next.id, next.items);
  await logAction({ action: "create", entity_type: "order", entity_id: next.id, entity_title: `${next.customer_name} — ${next.id.slice(0, 8)}`, new_data: next });
  return next;
}

export async function updateOrder(id: string, data: OrderInput) {
  const items = await readJsonFile<Order[]>(FILE_NAME, []);
  const index = items.findIndex((o) => o.id === id);
  if (index === -1) return null;
  const old = items[index];
  const next = normalizeOrder(data, old);
  items[index] = next;
  await writeJsonFile(FILE_NAME, items);
  await upsertOrder(next);
  await replaceOrderItems(next.id, next.items);
  await logAction({ action: "update", entity_type: "order", entity_id: next.id, entity_title: `${next.customer_name} — ${next.id.slice(0, 8)}`, old_data: old, new_data: next });
  return next;
}

export async function moveOrderToTrash(id: string, dBy?: string) {
  const resolvedBy = dBy ?? await getCurrentUserEmail();
  const items = await readJsonFile<Order[]>(FILE_NAME, []);
  const index = items.findIndex((o) => o.id === id);
  if (index === -1) return null;
  const c = items[index];
  const d = new Date().toISOString();
  const t: Order = { ...c, status: "deleted", deleted_at: d, updated_at: d };
  items[index] = t;
  await writeJsonFile(FILE_NAME, items);
  await upsertOrder(t);
  await addTrashItem({ id: randomUUID(), entity_type: "order", entity_id: c.id, title: `${c.customer_name} — ${c.id.slice(0, 8)}`, deleted_by: resolvedBy, deleted_at: d, restore_data: c });
  await logAction({ action: "trash", entity_type: "order", entity_id: c.id, entity_title: `${c.customer_name} — ${c.id.slice(0, 8)}`, old_data: c, user_email: resolvedBy });
  return t;
}

export async function restoreOrder(id: string) {
  const items = await readJsonFile<Order[]>(FILE_NAME, []);
  const index = items.findIndex((o) => o.id === id);
  const trashItem = await getTrashItemByEntity(id);
  if (index === -1 && !trashItem) return null;
  const r = trashItem?.restore_data && typeof trashItem.restore_data === "object"
    ? ({ ...(trashItem.restore_data as Order), status: "new", deleted_at: null, updated_at: new Date().toISOString() } as Order)
    : ({ ...items[index], status: "new", deleted_at: null, updated_at: new Date().toISOString() } as Order);
  if (index === -1) { const a = await readJsonFile<Order[]>(FILE_NAME, []); a.unshift(r); await writeJsonFile(FILE_NAME, a); }
  else { items[index] = r; await writeJsonFile(FILE_NAME, items); }
  await upsertOrder(r);
  await replaceOrderItems(r.id, r.items);
  if (trashItem) await removeTrashItem(trashItem.id);
  await logAction({ action: "restore", entity_type: "order", entity_id: r.id, entity_title: `${r.customer_name} — ${r.id.slice(0, 8)}` });
  return r;
}

export async function deleteOrderPermanently(id: string) {
  const items = await readJsonFile<Order[]>(FILE_NAME, []);
  const item = items.find((o) => o.id === id);
  const next = items.filter((o) => o.id !== id);
  if (next.length === items.length) return false;
  await writeJsonFile(FILE_NAME, next);
  await deleteOrderFromDb(id);
  const t = await getTrashItemByEntity(id);
  if (t) await removeTrashItem(t.id);
  if (item) await logAction({ action: "delete_permanently", entity_type: "order", entity_id: id, entity_title: `${item.customer_name} — ${item.id.slice(0, 8)}`, old_data: item });
  return true;
}
