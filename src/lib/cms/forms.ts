import { randomUUID } from "crypto";
import { createAdminClient } from "../supabase/admin";
import { addTrashItem, getCurrentUserEmail, getTrashItemByEntity, removeTrashItem } from "./trash";
import { readJsonFile, writeJsonFile } from "./local-storage";
import {
  ensureFormFieldUuid,
  errorMessageFromUnknown,
  formFieldRowForInsert,
  normalizeFormFieldVisibility,
} from "./form-field-persistence";
import { isFormFieldType, isFormStatus, isFormType } from "./types";
import type { Form, FormField } from "./types";
import { logAction } from "./history-logs";

const TABLE = "forms";
const FIELDS_TABLE = "form_fields";
const FILE_NAME = "forms.json";

type FormInput = Partial<Omit<Form, "id" | "created_at" | "updated_at" | "deleted_at">> & {
  id?: string;
  deleted_at?: string | null;
};

function toSlug(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-");
}

function toFieldSlug(label: string) {
  return label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "").replace(/_{2,}/g, "_") || "field";
}

function uniqueSlug(items: Form[], base: string, currentId?: string) {
  const taken = new Set(items.filter((f) => f.id !== currentId).map((f) => f.slug));
  if (!taken.has(base)) return base;
  let c = 2; while (taken.has(`${base}-${c}`)) c++; return `${base}-${c}`;
}

function normalizeFields(fields: unknown[]): FormField[] {
  return fields.map((field, i) => {
    const f = field as Partial<FormField> & Record<string, unknown>;
    const type = f.type ?? "text";
    if (!isFormFieldType(type)) throw new Error(`Tipo de campo no válido: ${type}`);
    return {
      id: ensureFormFieldUuid(f.id),
      label: String(f.label ?? "").trim(),
      name: String(f.name ?? "").trim() || toFieldSlug(f.label ?? `field_${i}`),
      type,
      placeholder: String(f.placeholder ?? "").trim(),
      required: !!f.required,
      options: Array.isArray(f.options) ? f.options : [],
      default_value: String(f.default_value ?? "").trim(),
      sort_order: f.sort_order ?? i,
      is_visible: normalizeFormFieldVisibility(f.is_visible),
    } satisfies FormField;
  });
}

function normalizeForm(input: FormInput, existing?: Form, allItems: Form[] = []) {
  const now = new Date().toISOString();
  const name = String(input.name ?? existing?.name ?? "").trim();
  const slugBase = String(input.slug ?? existing?.slug ?? "").trim() || toSlug(name);
  const slug = uniqueSlug(allItems, slugBase || toSlug(name), existing?.id);
  const type = input.type ?? existing?.type;
  const status = input.status ?? existing?.status ?? "draft";
  if (!name) throw new Error("El nombre del formulario es obligatorio.");
  if (!isFormType(type)) throw new Error("Tipo de formulario no válido.");
  if (!isFormStatus(status)) throw new Error("Estado de formulario no válido.");

  return {
    id: existing?.id ?? input.id ?? randomUUID(),
    name,
    slug,
    type,
    status,
    title: String(input.title ?? existing?.title ?? "").trim(),
    description: String(input.description ?? existing?.description ?? "").trim(),
    success_message: String(input.success_message ?? existing?.success_message ?? "Mensaje enviado correctamente.").trim(),
    redirect_url: String(input.redirect_url ?? existing?.redirect_url ?? "").trim(),
    email_notification_enabled: input.email_notification_enabled ?? existing?.email_notification_enabled ?? false,
    notification_email: String(input.notification_email ?? existing?.notification_email ?? "").trim(),
    fields: normalizeFields(input.fields ?? existing?.fields ?? []),
    created_at: existing?.created_at ?? now,
    updated_at: now,
    deleted_at: input.status === "deleted" ? existing?.deleted_at ?? now : null,
  } satisfies Form;
}

// ── Mapping helpers ──

function rowToFormField(row: Record<string, unknown>): FormField {
  const { form_id, created_at, updated_at, ...rest } = row;
  return {
    ...rest,
    options: Array.isArray(rest.options) ? rest.options : [],
  } as unknown as FormField;
}

function formFieldToRow(formId: string, field: FormField, sortOrder: number): Record<string, unknown> {
  return formFieldRowForInsert(formId, field, sortOrder);
}

function rowToForm(row: Record<string, unknown>, fields: FormField[] = []): Form {
  return {
    ...row,
    fields,
  } as unknown as Form;
}

function formToRow(form: Form): Record<string, unknown> {
  const { fields, ...rest } = form;
  return rest;
}

// ── Supabase helpers ──

async function readAllFromSupabase(): Promise<Form[] | null> {
  try {
    const supabase = createAdminClient();
    const { data: forms, error: fe } = await supabase.from(TABLE).select("*");
    if (fe) throw fe;
    if (!forms || forms.length === 0) return null;
    const { data: fields, error: fie } = await supabase.from(FIELDS_TABLE).select("*").order("sort_order");
    if (fie) throw fie;
    const byForm: Record<string, FormField[]> = {};
    if (fields) {
      for (const row of fields as Array<Record<string, unknown>>) {
        const fid = row.form_id as string;
        if (!byForm[fid]) byForm[fid] = [];
        byForm[fid].push(rowToFormField(row));
      }
    }
    return (forms as Array<Record<string, unknown>>).map((row) =>
      rowToForm(row, byForm[row.id as string] ?? [])
    );
  } catch {
    return null;
  }
}

async function fetchFormWithFields(
  query: (s: ReturnType<typeof createAdminClient>) => Promise<Record<string, unknown> | null>,
): Promise<Form | null> {
  try {
    const supabase = createAdminClient();
    const row = await query(supabase);
    if (!row) return null;
    const { data: fields } = await supabase.from(FIELDS_TABLE).select("*").eq("form_id", row.id as string).order("sort_order");
    return rowToForm(row, (fields ?? []).map(rowToFormField));
  } catch { /* fall through */ }
  return null;
}

async function upsertForm(form: Form): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from(TABLE).upsert(formToRow(form), { onConflict: "id" });
  } catch { /* best-effort */ }
}

async function replaceFormFields(formId: string, fields: FormField[]): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from(FIELDS_TABLE).delete().eq("form_id", formId);
    if (fields.length > 0) {
      await supabase.from(FIELDS_TABLE).insert(fields.map((f, index) => formFieldToRow(formId, f, index)));
    }
  } catch { /* best-effort */ }
}

async function upsertFormStrict(form: Form): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from(TABLE).upsert(formToRow(form), { onConflict: "id" });
  if (error) throw new Error(error.message);
}

async function replaceFormFieldsStrict(formId: string, fields: FormField[]): Promise<void> {
  const supabase = createAdminClient();
  const { error: deleteError } = await supabase.from(FIELDS_TABLE).delete().eq("form_id", formId);
  if (deleteError) throw new Error(errorMessageFromUnknown(deleteError, "No se pudieron actualizar los campos del formulario."));
  if (fields.length === 0) return;
  const { error: insertError } = await supabase
    .from(FIELDS_TABLE)
    .insert(fields.map((f, index) => formFieldToRow(formId, f, index)));
  if (insertError) throw new Error(errorMessageFromUnknown(insertError, "No se pudieron guardar los campos del formulario."));
}

async function seedSupabase(items: Form[]): Promise<void> {
  if (items.length === 0) return;
  try {
    const supabase = createAdminClient();
    for (const form of items) {
      await supabase.from(TABLE).upsert(formToRow(form), { onConflict: "id" });
      await supabase.from(FIELDS_TABLE).delete().eq("form_id", form.id);
      if (form.fields.length > 0) {
        await supabase.from(FIELDS_TABLE).insert(form.fields.map((f, index) => formFieldToRow(form.id, f, index)));
      }
    }
  } catch { /* best-effort */ }
}

async function deleteFormFromDb(id: string): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from(TABLE).delete().eq("id", id);
  } catch { /* best-effort */ }
}

// ── Public API ──

export async function getForms() {
  const fromSupabase = await readAllFromSupabase();
  if (fromSupabase) return fromSupabase;
  const localForms = await readJsonFile<Form[]>(FILE_NAME, []);
  await seedSupabase(localForms);
  return localForms;
}

export async function getFormById(id: string) {
  const result = await fetchFormWithFields(async (supabase) => {
    const { data } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
    return data as Record<string, unknown> | null;
  });
  if (result) return result;
  const items = await readJsonFile<Form[]>(FILE_NAME, []);
  return items.find((f) => f.id === id) ?? null;
}

export async function getFormBySlug(slug: string) {
  const result = await fetchFormWithFields(async (supabase) => {
    const { data } = await supabase.from(TABLE).select("*").eq("slug", slug).maybeSingle();
    return data as Record<string, unknown> | null;
  });
  if (result) return result;
  const items = await readJsonFile<Form[]>(FILE_NAME, []);
  const localForm = items.find((f) => f.slug === slug) ?? null;
  if (localForm) await seedSupabase([localForm]);
  return localForm;
}

export async function createForm(data: FormInput) {
  const items = await readJsonFile<Form[]>(FILE_NAME, []);
  const next = normalizeForm(data, undefined, items);
  await writeJsonFile(FILE_NAME, [next, ...items]);
  await upsertForm(next);
  await replaceFormFields(next.id, next.fields);
  await logAction({ action: "create", entity_type: "form", entity_id: next.id, entity_title: next.name, new_data: next });
  return next;
}

export async function updateForm(id: string, data: FormInput) {
  const existing = await getFormById(id);
  if (!existing) return null;

  const items = await getForms();
  const old = existing;
  const next = normalizeForm(data, old, items);

  const index = items.findIndex((f) => f.id === id);
  const nextItems = [...items];
  if (index === -1) nextItems.push(next);
  else nextItems[index] = next;

  await writeJsonFile(FILE_NAME, nextItems);
  await upsertFormStrict(next);
  await replaceFormFieldsStrict(next.id, next.fields);
  if (old.status !== next.status) {
    if (next.status === "active") await logAction({ action: "publish", entity_type: "form", entity_id: next.id, entity_title: next.name, old_data: old, new_data: next });
    else if (old.status === "active") await logAction({ action: "unpublish", entity_type: "form", entity_id: next.id, entity_title: next.name, old_data: old, new_data: next });
  }
  await logAction({ action: "update", entity_type: "form", entity_id: next.id, entity_title: next.name, old_data: old, new_data: next });
  return (await getFormById(id)) ?? next;
}

export async function duplicateForm(id: string) {
  const items = await readJsonFile<Form[]>(FILE_NAME, []);
  const original = items.find((f) => f.id === id);
  if (!original) return null;
  const copy = normalizeForm({ ...original, name: `${original.name} (copia)`, slug: "", status: "draft", fields: original.fields.map((f) => ({ ...f, id: randomUUID() })) }, undefined, items);
  await writeJsonFile(FILE_NAME, [copy, ...items]);
  await upsertForm(copy);
  await replaceFormFields(copy.id, copy.fields);
  return copy;
}

export async function moveFormToTrash(id: string, deletedBy?: string) {
  const dBy = deletedBy ?? await getCurrentUserEmail();
  const items = await readJsonFile<Form[]>(FILE_NAME, []);
  const index = items.findIndex((f) => f.id === id);
  if (index === -1) return null;
  const current = items[index];
  const deletedAt = new Date().toISOString();
  const trashed: Form = { ...current, status: "deleted", deleted_at: deletedAt, updated_at: deletedAt };
  items[index] = trashed;
  await writeJsonFile(FILE_NAME, items);
  await upsertForm(trashed);
  await addTrashItem({ id: randomUUID(), entity_type: "form", entity_id: current.id, title: current.name, deleted_by: dBy, deleted_at: deletedAt, restore_data: current });
  await logAction({ action: "trash", entity_type: "form", entity_id: current.id, entity_title: current.name, old_data: current, user_email: dBy });
  return trashed;
}

export async function restoreForm(id: string) {
  const items = await readJsonFile<Form[]>(FILE_NAME, []);
  const index = items.findIndex((f) => f.id === id);
  const trashItem = await getTrashItemByEntity(id);
  if (index === -1 && !trashItem) return null;
  const restored = trashItem?.restore_data && typeof trashItem.restore_data === "object"
    ? ({ ...(trashItem.restore_data as Form), status: "draft", deleted_at: null, updated_at: new Date().toISOString() } as Form)
    : ({ ...items[index], status: "draft", deleted_at: null, updated_at: new Date().toISOString() } as Form);
  if (index === -1) { const all = await readJsonFile<Form[]>(FILE_NAME, []); all.unshift(restored); await writeJsonFile(FILE_NAME, all); }
  else { items[index] = restored; await writeJsonFile(FILE_NAME, items); }
  await upsertForm(restored);
  await replaceFormFields(restored.id, restored.fields);
  if (trashItem) await removeTrashItem(trashItem.id);
  await logAction({ action: "restore", entity_type: "form", entity_id: restored.id, entity_title: restored.name });
  return restored;
}

export async function deleteFormPermanently(id: string) {
  const items = await readJsonFile<Form[]>(FILE_NAME, []);
  const item = items.find((f) => f.id === id);
  const next = items.filter((f) => f.id !== id);
  if (next.length === items.length) return false;
  await writeJsonFile(FILE_NAME, next);
  await deleteFormFromDb(id);
  const trashItem = await getTrashItemByEntity(id);
  if (trashItem) await removeTrashItem(trashItem.id);
  if (item) await logAction({ action: "delete_permanently", entity_type: "form", entity_id: id, entity_title: item.name, old_data: item });
  return true;
}
