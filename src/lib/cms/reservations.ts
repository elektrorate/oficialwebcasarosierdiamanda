import { randomUUID } from "crypto";
import { createAdminClient } from "../supabase/admin";
import { addTrashItem, getCurrentUserEmail, getTrashItemByEntity, removeTrashItem } from "./trash";
import { readJsonFile, writeJsonFile } from "./local-storage";
import { isReservationPaymentStatus, isReservationStatus } from "./types";
import type { Reservation } from "./types";
import { logAction } from "./history-logs";

const TABLE = "reservations";
const FILE_NAME = "reservations.json";

type ReservationInput = Partial<Omit<Reservation, "id" | "created_at" | "updated_at" | "deleted_at">> & {
  id?: string;
  deleted_at?: string | null;
};

function normalizeReservation(input: ReservationInput, existing?: Reservation) {
  const now = new Date().toISOString();
  const status = input.status ?? existing?.status ?? "pending";
  const paymentStatus = input.payment_status ?? existing?.payment_status ?? "unpaid";

  if (!input.customer_name && !existing?.customer_name) throw new Error("El nombre del cliente es obligatorio.");
  if (!input.customer_email && !existing?.customer_email) throw new Error("El email del cliente es obligatorio.");
  if (!input.offering_id && !existing?.offering_id) throw new Error("La actividad es obligatoria.");
  if (!input.date && !existing?.date) throw new Error("La fecha es obligatoria.");
  if (!isReservationStatus(status)) throw new Error("Estado de reserva no válido.");
  if (!isReservationPaymentStatus(paymentStatus)) throw new Error("Estado de pago no válido.");

  return {
    id: existing?.id ?? input.id ?? randomUUID(),
    customer_name: String(input.customer_name ?? existing?.customer_name ?? "").trim(),
    customer_email: String(input.customer_email ?? existing?.customer_email ?? "").trim(),
    customer_phone: String(input.customer_phone ?? existing?.customer_phone ?? "").trim(),
    offering_id: input.offering_id ?? existing?.offering_id ?? "",
    schedule_id: input.schedule_id !== undefined ? input.schedule_id : (existing?.schedule_id ?? null),
    date: input.date ?? existing?.date ?? "",
    time: input.time ?? existing?.time ?? "",
    people_count: input.people_count ?? existing?.people_count ?? 1,
    status,
    payment_status: paymentStatus,
    payment_id: input.payment_id !== undefined ? input.payment_id : (existing?.payment_id ?? null),
    total_amount: input.total_amount !== undefined ? input.total_amount : (existing?.total_amount ?? null),
    currency: input.currency ?? existing?.currency ?? "EUR",
    notes: String(input.notes ?? existing?.notes ?? "").trim(),
    internal_notes: String(input.internal_notes ?? existing?.internal_notes ?? "").trim(),
    created_at: existing?.created_at ?? now,
    updated_at: now,
    deleted_at: input.status === "deleted" ? existing?.deleted_at ?? now : null,
  } satisfies Reservation;
}

// ── Mapping helpers ──

function rowToReservation(row: Record<string, unknown>): Reservation {
  return row as unknown as Reservation;
}

function reservationToRow(r: Reservation): Record<string, unknown> {
  return { ...r };
}

// ── Supabase helpers ──

async function readAllFromSupabase(): Promise<Reservation[] | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from(TABLE).select("*");
    if (error) throw error;
    if (!data || data.length === 0) return null;
    return (data as Array<Record<string, unknown>>).map(rowToReservation);
  } catch {
    return null;
  }
}

async function readFromSupabase(query: (s: ReturnType<typeof createAdminClient>) => Promise<Record<string, unknown> | null>): Promise<Reservation | null> {
  try {
    const supabase = createAdminClient();
    const row = await query(supabase);
    if (!row) return null;
    return rowToReservation(row);
  } catch { /* fall through */ }
  return null;
}

async function upsertReservation(r: Reservation): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from(TABLE).upsert(reservationToRow(r), { onConflict: "id" });
  } catch { /* best-effort */ }
}

async function deleteReservationFromDb(id: string): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from(TABLE).delete().eq("id", id);
  } catch { /* best-effort */ }
}

// ── Public API ──

export async function getReservations() {
  const fromSupabase = await readAllFromSupabase();
  if (fromSupabase) return fromSupabase;
  return readJsonFile<Reservation[]>(FILE_NAME, []);
}

export async function getReservationById(id: string) {
  const result = await readFromSupabase(async (supabase) => {
    const { data } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
    return data as Record<string, unknown> | null;
  });
  if (result) return result;
  const items = await readJsonFile<Reservation[]>(FILE_NAME, []);
  return items.find((r) => r.id === id) ?? null;
}

export async function createReservation(data: ReservationInput) {
  const items = await readJsonFile<Reservation[]>(FILE_NAME, []);
  const next = normalizeReservation(data);
  await writeJsonFile(FILE_NAME, [next, ...items]);
  await upsertReservation(next);
  await logAction({ action: "create", entity_type: "reservation", entity_id: next.id, entity_title: `${next.customer_name} — ${next.date}`, new_data: next });
  return next;
}

export async function updateReservation(id: string, data: ReservationInput) {
  const items = await readJsonFile<Reservation[]>(FILE_NAME, []);
  const index = items.findIndex((r) => r.id === id);
  if (index === -1) return null;
  const old = items[index];
  const next = normalizeReservation(data, old);
  items[index] = next;
  await writeJsonFile(FILE_NAME, items);
  await upsertReservation(next);
  await logAction({ action: "update", entity_type: "reservation", entity_id: next.id, entity_title: `${next.customer_name} — ${next.date}`, old_data: old, new_data: next });
  return next;
}

export async function duplicateReservation(id: string) {
  const items = await readJsonFile<Reservation[]>(FILE_NAME, []);
  const original = items.find((r) => r.id === id);
  if (!original) return null;
  const copy = normalizeReservation({ ...original, customer_name: `${original.customer_name} (copia)` });
  await writeJsonFile(FILE_NAME, [copy, ...items]);
  await upsertReservation(copy);
  await logAction({ action: "duplicate", entity_type: "reservation", entity_id: original.id, entity_title: `${original.customer_name} — ${original.date}`, new_data: copy });
  return copy;
}

export async function moveReservationToTrash(id: string, deletedBy?: string) {
  const dBy = deletedBy ?? await getCurrentUserEmail();
  const items = await readJsonFile<Reservation[]>(FILE_NAME, []);
  const index = items.findIndex((r) => r.id === id);
  if (index === -1) return null;
  const current = items[index];
  const deletedAt = new Date().toISOString();
  const trashed: Reservation = { ...current, status: "deleted", deleted_at: deletedAt, updated_at: deletedAt };
  items[index] = trashed;
  await writeJsonFile(FILE_NAME, items);
  await upsertReservation(trashed);
  await addTrashItem({
    id: randomUUID(),
    entity_type: "reservation",
    entity_id: current.id,
    title: `${current.customer_name} — ${current.date}`,
    deleted_by: dBy,
    deleted_at: deletedAt,
    restore_data: current,
  });
  await logAction({ action: "trash", entity_type: "reservation", entity_id: current.id, entity_title: `${current.customer_name} — ${current.date}`, old_data: current, user_email: dBy });
  return trashed;
}

export async function restoreReservation(id: string) {
  const items = await readJsonFile<Reservation[]>(FILE_NAME, []);
  const index = items.findIndex((r) => r.id === id);
  const trashItem = await getTrashItemByEntity(id);
  if (index === -1 && !trashItem) return null;
  const restored = trashItem?.restore_data && typeof trashItem.restore_data === "object"
    ? ({ ...(trashItem.restore_data as Reservation), status: "pending", deleted_at: null, updated_at: new Date().toISOString() } as Reservation)
    : ({ ...items[index], status: "pending", deleted_at: null, updated_at: new Date().toISOString() } as Reservation);
  if (index === -1) {
    const all = await readJsonFile<Reservation[]>(FILE_NAME, []);
    all.unshift(restored);
    await writeJsonFile(FILE_NAME, all);
  } else {
    items[index] = restored;
    await writeJsonFile(FILE_NAME, items);
  }
  if (trashItem) await removeTrashItem(trashItem.id);
  await upsertReservation(restored);
  await logAction({ action: "restore", entity_type: "reservation", entity_id: restored.id, entity_title: `${restored.customer_name} — ${restored.date}` });
  return restored;
}

export async function deleteReservationPermanently(id: string) {
  const items = await readJsonFile<Reservation[]>(FILE_NAME, []);
  const item = items.find((r) => r.id === id);
  const next = items.filter((r) => r.id !== id);
  if (next.length === items.length) return false;
  await writeJsonFile(FILE_NAME, next);
  await deleteReservationFromDb(id);
  const trashItem = await getTrashItemByEntity(id);
  if (trashItem) await removeTrashItem(trashItem.id);
  if (item) await logAction({ action: "delete_permanently", entity_type: "reservation", entity_id: id, entity_title: `${item.customer_name} — ${item.date}`, old_data: item });
  return true;
}
