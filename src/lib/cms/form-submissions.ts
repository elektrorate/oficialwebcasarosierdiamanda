import { randomUUID } from "crypto";
import { createAdminClient } from "../supabase/admin";
import { addTrashItem, getCurrentUserEmail, getTrashItemByEntity, removeTrashItem } from "./trash";
import { readJsonFile, writeJsonFile } from "./local-storage";
import { isFormSubmissionStatus } from "./types";
import type { FormSubmission } from "./types";
import { logAction } from "./history-logs";

const TABLE = "form_submissions";
const FILE_NAME = "form-submissions.json";

type SubmissionInput = Partial<Omit<FormSubmission, "id" | "created_at" | "updated_at" | "deleted_at">> & {
  id?: string;
  deleted_at?: string | null;
};

type LegacyNotificationMeta = {
  status?: FormSubmission["notification_status"];
  provider?: FormSubmission["notification_provider"];
  to?: string;
  from?: string;
  message_id?: string;
  error?: string;
  attempted_at?: string | null;
  notification_status?: FormSubmission["notification_status"];
  notification_provider?: FormSubmission["notification_provider"];
  notification_to?: string;
  notification_from?: string;
  notification_message_id?: string;
  notification_error?: string;
  notification_attempted_at?: string | null;
};

function notificationFromData(data: unknown) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const meta = (data as Record<string, unknown>).__notification;
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return null;
  return meta as LegacyNotificationMeta;
}

function normalizeSubmission(input: SubmissionInput, existing?: FormSubmission) {
  const now = new Date().toISOString();
  const status = input.status ?? existing?.status ?? "new";
  if (!isFormSubmissionStatus(status)) throw new Error("Estado no válido.");
  const notification = notificationFromData(input.data ?? existing?.data);
  return {
    id: existing?.id ?? input.id ?? randomUUID(),
    form_id: input.form_id ?? existing?.form_id ?? "",
    form_slug: input.form_slug ?? existing?.form_slug ?? "",
    form_name: input.form_name ?? existing?.form_name ?? "",
    name: String(input.name ?? existing?.name ?? "").trim(),
    email: String(input.email ?? existing?.email ?? "").trim(),
    phone: String(input.phone ?? existing?.phone ?? "").trim(),
    subject: String(input.subject ?? existing?.subject ?? "").trim(),
    message: String(input.message ?? existing?.message ?? "").trim(),
    data: input.data ?? existing?.data ?? {},
    source_page: String(input.source_page ?? existing?.source_page ?? "").trim(),
    status,
    internal_notes: String(input.internal_notes ?? existing?.internal_notes ?? "").trim(),
    notification_status: input.notification_status ?? existing?.notification_status ?? notification?.notification_status ?? notification?.status ?? null,
    notification_provider: input.notification_provider ?? existing?.notification_provider ?? notification?.notification_provider ?? notification?.provider ?? null,
    notification_to: String(input.notification_to ?? existing?.notification_to ?? notification?.notification_to ?? notification?.to ?? "").trim(),
    notification_from: String(input.notification_from ?? existing?.notification_from ?? notification?.notification_from ?? notification?.from ?? "").trim(),
    notification_message_id: String(input.notification_message_id ?? existing?.notification_message_id ?? notification?.notification_message_id ?? notification?.message_id ?? "").trim(),
    notification_error: String(input.notification_error ?? existing?.notification_error ?? notification?.notification_error ?? notification?.error ?? "").trim(),
    notification_attempted_at: input.notification_attempted_at ?? existing?.notification_attempted_at ?? notification?.notification_attempted_at ?? notification?.attempted_at ?? null,
    created_at: existing?.created_at ?? now,
    updated_at: now,
    deleted_at: input.status === "deleted" ? existing?.deleted_at ?? now : null,
  } satisfies FormSubmission;
}

// ── Mapping helpers ──

function rowToFormSubmission(row: Record<string, unknown>): FormSubmission {
  return {
    ...row,
    data: typeof row.data === "object" && row.data !== null ? row.data : {},
  } as unknown as FormSubmission;
}

function formSubmissionToRow(s: FormSubmission): Record<string, unknown> {
  return { ...s };
}

// ── Supabase helpers ──

async function readAllFromSupabase(): Promise<FormSubmission[] | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from(TABLE).select("*");
    if (error) throw error;
    if (!data || data.length === 0) return null;
    return (data as Array<Record<string, unknown>>).map(rowToFormSubmission);
  } catch {
    return null;
  }
}

async function readFromSupabase(query: (s: ReturnType<typeof createAdminClient>) => Promise<Record<string, unknown> | null>): Promise<FormSubmission | null> {
  try {
    const supabase = createAdminClient();
    const row = await query(supabase);
    if (!row) return null;
    return rowToFormSubmission(row);
  } catch { /* fall through */ }
  return null;
}

async function upsertSubmission(s: FormSubmission, strict = false): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from(TABLE).upsert(formSubmissionToRow(s), { onConflict: "id" });
    if (error) throw error;
  } catch (error) {
    if (!strict) return;
    throw error instanceof Error ? error : new Error("No se pudo guardar el mensaje en Supabase.");
  }
}

async function seedSupabase(items: FormSubmission[]): Promise<void> {
  if (items.length === 0) return;
  try {
    const supabase = createAdminClient();
    await supabase.from(TABLE).upsert(items.map(formSubmissionToRow), { onConflict: "id" });
  } catch { /* best-effort */ }
}

async function deleteSubmissionFromDb(id: string): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from(TABLE).delete().eq("id", id);
  } catch { /* best-effort */ }
}

// ── Public API ──

export async function getFormSubmissions() {
  const fromSupabase = await readAllFromSupabase();
  if (fromSupabase) return fromSupabase;
  const localSubmissions = await readJsonFile<FormSubmission[]>(FILE_NAME, []);
  await seedSupabase(localSubmissions);
  return localSubmissions;
}

export async function getFormSubmissionById(id: string) {
  const result = await readFromSupabase(async (supabase) => {
    const { data } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
    return data as Record<string, unknown> | null;
  });
  if (result) return result;
  const items = await readJsonFile<FormSubmission[]>(FILE_NAME, []);
  return items.find((s) => s.id === id) ?? null;
}

export async function createFormSubmission(data: SubmissionInput) {
  const items = await readJsonFile<FormSubmission[]>(FILE_NAME, []);
  const next = normalizeSubmission(data);
  await writeJsonFile(FILE_NAME, [next, ...items]);
  await upsertSubmission(next);
  await logAction({ action: "create", entity_type: "form_submission", entity_id: next.id, entity_title: `${next.name} — ${next.subject || next.form_name}`, new_data: next });
  return next;
}

export async function updateFormSubmission(id: string, data: SubmissionInput) {
  const items = await readJsonFile<FormSubmission[]>(FILE_NAME, []);
  const index = items.findIndex((s) => s.id === id);
  const old = index === -1 ? await getFormSubmissionById(id) : items[index];
  if (!old) return null;
  const next = normalizeSubmission(data, old);
  if (index === -1) {
    await writeJsonFile(FILE_NAME, [next, ...items]);
  } else {
    items[index] = next;
    await writeJsonFile(FILE_NAME, items);
  }
  await upsertSubmission(next, true);
  await logAction({ action: "update", entity_type: "form_submission", entity_id: next.id, entity_title: `${next.name} — ${next.subject || next.form_name}`, old_data: old, new_data: next });
  return next;
}

export async function moveFormSubmissionToTrash(id: string, deletedBy?: string) {
  const dBy = deletedBy ?? await getCurrentUserEmail();
  const items = await readJsonFile<FormSubmission[]>(FILE_NAME, []);
  const index = items.findIndex((s) => s.id === id);
  const current = index === -1 ? await getFormSubmissionById(id) : items[index];
  if (!current) return null;
  const deletedAt = new Date().toISOString();
  const trashed: FormSubmission = { ...current, status: "deleted", deleted_at: deletedAt, updated_at: deletedAt };
  if (index === -1) {
    await writeJsonFile(FILE_NAME, [trashed, ...items]);
  } else {
    items[index] = trashed;
    await writeJsonFile(FILE_NAME, items);
  }
  await upsertSubmission(trashed, true);
  await addTrashItem({ id: randomUUID(), entity_type: "form_submission", entity_id: current.id, title: `${current.name} — ${current.subject || current.form_name}`, deleted_by: dBy, deleted_at: deletedAt, restore_data: current });
  await logAction({ action: "trash", entity_type: "form_submission", entity_id: current.id, entity_title: `${current.name} — ${current.subject || current.form_name}`, old_data: current, user_email: dBy });
  return trashed;
}

export async function restoreFormSubmission(id: string) {
  const items = await readJsonFile<FormSubmission[]>(FILE_NAME, []);
  const index = items.findIndex((s) => s.id === id);
  const trashItem = await getTrashItemByEntity(id);
  if (index === -1 && !trashItem) return null;
  const restored = trashItem?.restore_data && typeof trashItem.restore_data === "object"
    ? ({ ...(trashItem.restore_data as FormSubmission), status: "new", deleted_at: null, updated_at: new Date().toISOString() } as FormSubmission)
    : ({ ...items[index], status: "new", deleted_at: null, updated_at: new Date().toISOString() } as FormSubmission);
  if (index === -1) { const all = await readJsonFile<FormSubmission[]>(FILE_NAME, []); all.unshift(restored); await writeJsonFile(FILE_NAME, all); }
  else { items[index] = restored; await writeJsonFile(FILE_NAME, items); }
  await upsertSubmission(restored);
  if (trashItem) await removeTrashItem(trashItem.id);
  await logAction({ action: "restore", entity_type: "form_submission", entity_id: restored.id, entity_title: `${restored.name} — ${restored.subject || restored.form_name}` });
  return restored;
}

export async function deleteFormSubmissionPermanently(id: string) {
  const items = await readJsonFile<FormSubmission[]>(FILE_NAME, []);
  const item = items.find((s) => s.id === id);
  const next = items.filter((s) => s.id !== id);
  if (next.length === items.length) return false;
  await writeJsonFile(FILE_NAME, next);
  await deleteSubmissionFromDb(id);
  const trashItem = await getTrashItemByEntity(id);
  if (trashItem) await removeTrashItem(trashItem.id);
  if (item) await logAction({ action: "delete_permanently", entity_type: "form_submission", entity_id: id, entity_title: `${item.name} — ${item.subject || item.form_name}`, old_data: item });
  return true;
}
