import { randomUUID } from "crypto";
import { createAdminClient } from "../supabase/admin";
import { createClient } from "../supabase/server";
import { prependJsonCacheItem, readJsonFile, writeJsonFile } from "./local-storage";
import { isHistoryLogAction } from "./types";
import type { HistoryLog } from "./types";

const TABLE = "history_logs";
const FILE_NAME = "history-logs.json";

type LogInput = Omit<HistoryLog, "id" | "created_at"> & { id?: string };
export type DateSort = "newest" | "oldest";
export type PaginatedHistoryLogs = {
  items: HistoryLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  sort: DateSort;
};

export type HistoryLogPageOptions = {
  page?: number;
  pageSize?: number;
  sort?: DateSort;
  action?: string;
  entityType?: string;
  date?: string;
};

function normalizePagination(page = 1, pageSize = 30) {
  const safePageSize = Math.min(Math.max(Number(pageSize) || 30, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  return { page: safePage, pageSize: safePageSize };
}

// ── Mapping helpers ──

function rowToHistoryLog(row: Record<string, unknown>): HistoryLog {
  return row as unknown as HistoryLog;
}

function historyLogToRow(log: HistoryLog): Record<string, unknown> {
  return { ...log };
}

// ── Supabase helpers ──

async function readAllFromSupabase(): Promise<HistoryLog[] | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from(TABLE).select("*").order("created_at", { ascending: false });
    if (error) throw error;
    if (!data || data.length === 0) return null;
    return (data as Array<Record<string, unknown>>).map(rowToHistoryLog);
  } catch {
    return null;
  }
}

async function readRecentFromSupabase(limit: number): Promise<HistoryLog[] | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .neq("entity_type", "auth")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map(rowToHistoryLog);
  } catch {
    return null;
  }
}

async function getCurrentUserIdentity(): Promise<{ user_id: string; user_email: string }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return { user_id: user.id, user_email: user.email ?? "system" };
  } catch { /* not in request context */ }
  return { user_id: "system", user_email: "system" };
}

// ── Public API ──

export async function getHistoryLogs() {
  const fromSupabase = await readAllFromSupabase();
  if (fromSupabase) return fromSupabase;
  return readJsonFile<HistoryLog[]>(FILE_NAME, []);
}

export async function getHistoryLogsPage(options: HistoryLogPageOptions = {}): Promise<PaginatedHistoryLogs> {
  const { page, pageSize } = normalizePagination(options.page, options.pageSize);
  const sort: DateSort = options.sort === "oldest" ? "oldest" : "newest";
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    const supabase = createAdminClient();
    let query = supabase
      .from(TABLE)
      .select("*", { count: "exact" })
      .order("created_at", { ascending: sort === "oldest" })
      .range(from, to);

    if (options.action) query = query.eq("action", options.action);
    if (options.entityType) query = query.eq("entity_type", options.entityType);
    if (options.date) {
      query = query.gte("created_at", `${options.date}T00:00:00.000Z`).lt("created_at", `${options.date}T23:59:59.999Z`);
    }

    const { data, error, count } = await query;
    if (error) throw error;
    const total = count ?? 0;
    return {
      items: (data ?? []).map(rowToHistoryLog),
      total,
      page,
      pageSize,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
      sort,
    };
  } catch {
    let items = await readJsonFile<HistoryLog[]>(FILE_NAME, []);
    if (options.action) items = items.filter((item) => item.action === options.action);
    if (options.entityType) items = items.filter((item) => item.entity_type === options.entityType);
    if (options.date) {
      const selectedDate = options.date;
      items = items.filter((item) => item.created_at.startsWith(selectedDate));
    }
    items = items.sort((a, b) => {
      const diff = Date.parse(a.created_at) - Date.parse(b.created_at);
      return sort === "oldest" ? diff : -diff;
    });
    const total = items.length;
    return {
      items: items.slice(from, from + pageSize),
      total,
      page,
      pageSize,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
      sort,
    };
  }
}

export async function getRecentHistoryLogs(limit = 5) {
  const fromSupabase = await readRecentFromSupabase(limit);
  if (fromSupabase) return fromSupabase;
  const items = await readJsonFile<HistoryLog[]>(FILE_NAME, []);
  return items.filter((item) => item.entity_type !== "auth").slice(0, limit);
}

export async function getHistoryLogById(id: string) {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
    if (data) return rowToHistoryLog(data as Record<string, unknown>);
  } catch { /* fall through */ }
  const items = await readJsonFile<HistoryLog[]>(FILE_NAME, []);
  return items.find((l) => l.id === id) ?? null;
}

export async function createHistoryLog(data: LogInput) {
  if (data.action && !isHistoryLogAction(data.action)) throw new Error("Acción no válida.");
  const log: HistoryLog = { ...data, id: data.id ?? randomUUID(), created_at: new Date().toISOString() };

  // Insert one row — do not re-upsert the entire history_logs table.
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from(TABLE).upsert(historyLogToRow(log), { onConflict: "id" });
    if (error) throw error;
    prependJsonCacheItem(FILE_NAME, log);
  } catch {
    const items = await readJsonFile<HistoryLog[]>(FILE_NAME, []);
    await writeJsonFile(FILE_NAME, [log, ...items.filter((item) => item.id !== log.id)]);
  }

  return log;
}

export async function logAction(data: Omit<LogInput, "id" | "created_at" | "user_id" | "user_email" | "old_data" | "new_data"> & { user_id?: string; user_email?: string; old_data?: unknown; new_data?: unknown }) {
  const needsIdentity = !data.user_id || !data.user_email;
  const identity = needsIdentity ? await getCurrentUserIdentity() : null;
  return createHistoryLog({
    user_id: data.user_id ?? identity?.user_id ?? "system",
    user_email: data.user_email ?? identity?.user_email ?? "system",
    old_data: null,
    new_data: null,
    ...data,
    id: randomUUID(),
  });
}
