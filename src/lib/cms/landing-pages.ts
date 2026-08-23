import { randomUUID } from "crypto";
import { createAdminClient } from "../supabase/admin";
import { addTrashItem, getCurrentUserEmail, getTrashItemByEntity, removeTrashItem } from "./trash";
import { readJsonFile, writeJsonFile } from "./local-storage";
import { isLandingPageStatus, isCampaignType } from "./types";
import type { LandingPage, LandingPageBlock } from "./types";
import { logAction } from "./history-logs";

const TABLE = "landing_pages";
const BLOCK_TABLE = "landing_page_blocks";
const FILE_NAME = "landing-pages.json";

type Input = Partial<Omit<LandingPage, "id" | "created_at" | "updated_at" | "deleted_at" | "blocks">> & {
  id?: string; deleted_at?: string | null; blocks?: LandingPageBlock[];
};

function toSlug(v: string) { return v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-"); }

function uniqueSlug(items: LandingPage[], base: string, currentId?: string) {
  const taken = new Set(items.filter((i) => i.id !== currentId).map((i) => i.slug));
  if (!taken.has(base)) return base; let c = 2; while (taken.has(`${base}-${c}`)) c++; return `${base}-${c}`;
}

function normalize(input: Input, existing?: LandingPage, all: LandingPage[] = []) {
  const title = String(input.title ?? existing?.title ?? "").trim();
  const slugBase = String(input.slug ?? existing?.slug ?? "").trim() || toSlug(title);
  const slug = uniqueSlug(all, slugBase || toSlug(title), existing?.id);
  const now = new Date().toISOString();
  const status = input.status ?? existing?.status ?? "draft";
  const campaignType = input.campaign_type ?? existing?.campaign_type ?? "custom";

  if (!title) throw new Error("El título es obligatorio.");
  if (!isLandingPageStatus(status)) throw new Error("Estado no válido.");
  if (!isCampaignType(campaignType)) throw new Error("Tipo de campaña no válido.");

  return {
    id: existing?.id ?? input.id ?? randomUUID(),
    title, slug, status, campaign_type: campaignType,
    header_id: input.header_id !== undefined ? input.header_id : (existing?.header_id ?? null),
    hero_title: String(input.hero_title ?? existing?.hero_title ?? "").trim(),
    hero_subtitle: String(input.hero_subtitle ?? existing?.hero_subtitle ?? "").trim(),
    hero_image_id: String(input.hero_image_id ?? existing?.hero_image_id ?? "").trim(),
    intro_text: String(input.intro_text ?? existing?.intro_text ?? "").trim(),
    cta_text: String(input.cta_text ?? existing?.cta_text ?? "").trim(),
    cta_url: String(input.cta_url ?? existing?.cta_url ?? "").trim(),
    form_id: input.form_id !== undefined ? input.form_id : (existing?.form_id ?? null),
    social_gallery_id: input.social_gallery_id !== undefined ? input.social_gallery_id : (existing?.social_gallery_id ?? null),
    testimonials_id: input.testimonials_id !== undefined ? input.testimonials_id : (existing?.testimonials_id ?? null),
    footer_id: input.footer_id !== undefined ? input.footer_id : (existing?.footer_id ?? null),
    seo_title: String(input.seo_title ?? existing?.seo_title ?? "").trim(),
    seo_description: String(input.seo_description ?? existing?.seo_description ?? "").trim(),
    seo_image: String(input.seo_image ?? existing?.seo_image ?? "").trim(),
    blocks: input.blocks ?? existing?.blocks ?? [],
    created_at: existing?.created_at ?? now,
    updated_at: now,
    deleted_at: input.status === "deleted" ? existing?.deleted_at ?? now : null,
  } satisfies LandingPage;
}

function stripBlockMeta(row: Record<string, unknown>): LandingPageBlock {
  const rest = { ...row };
  delete rest.landing_page_id;
  delete rest.source_url;
  return {
    ...rest,
    cta_text: (rest.cta_text as string) ?? "",
    cta_url: (rest.cta_url as string) ?? "",
    custom_html: (rest.custom_html as string) ?? "",
    image_id: (rest.image_id as string) ?? "",
  } as LandingPageBlock;
}

function addBlockMeta(landingId: string, block: LandingPageBlock): Record<string, unknown> {
  const record: Record<string, unknown> = { ...block, landing_page_id: landingId };
  record.source_url = "";
  return record;
}

async function readAllFromSupabase(): Promise<LandingPage[] | null> {
  try {
    const supabase = createAdminClient();
    const { data: lps, error: le } = await supabase.from(TABLE).select("*");
    if (le) throw le;
    if (!lps || lps.length === 0) return null;
    const { data: blocks, error: be } = await supabase.from(BLOCK_TABLE).select("*").order("sort_order");
    if (be) throw be;
    const byId: Record<string, LandingPageBlock[]> = {};
    if (blocks) {
      for (const row of blocks as Array<Record<string, unknown>>) {
        const lid = row.landing_page_id as string;
        if (!byId[lid]) byId[lid] = [];
        byId[lid].push(stripBlockMeta(row));
      }
    }
    return (lps as Array<Record<string, unknown>>).map((row) => ({
      ...row,
      blocks: byId[row.id as string] ?? [],
    })) as LandingPage[];
  } catch {
    return null;
  }
}

async function upsertToSupabase(lp: LandingPage): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { blocks, ...data } = lp;
    const { error } = await supabase.from(TABLE).upsert(data as unknown as Record<string, unknown>, { onConflict: "id" });
    if (error) throw error;

    const { data: storedBlocks, error: readError } = await supabase
      .from(BLOCK_TABLE)
      .select("id")
      .eq("landing_page_id", lp.id);
    if (readError) throw readError;

    if (blocks.length) {
      const { error: blocksError } = await supabase
        .from(BLOCK_TABLE)
        .upsert(blocks.map((block) => addBlockMeta(lp.id, block)), { onConflict: "id" });
      if (blocksError) throw blocksError;
    }

    const currentIds = new Set(blocks.map((block) => block.id));
    const staleIds = (storedBlocks ?? [])
      .map((block) => block.id as string)
      .filter((id) => !currentIds.has(id));
    if (staleIds.length) {
      const { error: deleteError } = await supabase.from(BLOCK_TABLE).delete().in("id", staleIds);
      if (deleteError) throw deleteError;
    }
  } catch { /* best-effort */ }
}

async function deleteFromSupabase(id: string): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from(TABLE).delete().eq("id", id);
  } catch { /* best-effort */ }
}

async function upsertBlock(landingId: string, block: LandingPageBlock): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from(BLOCK_TABLE).upsert(addBlockMeta(landingId, block), { onConflict: "id" });
  } catch { /* best-effort */ }
}

export async function getLandingPages() {
  const fromSupabase = await readAllFromSupabase();
  if (fromSupabase) return fromSupabase;
  return readJsonFile<LandingPage[]>(FILE_NAME, []);
}

export async function getLandingPageById(id: string) {
  try {
    const supabase = createAdminClient();
    const { data: lp, error: le } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
    if (!le && lp) {
      const { data: blocks, error: be } = await supabase.from(BLOCK_TABLE).select("*").eq("landing_page_id", id).order("sort_order");
      if (!be) {
        return { ...(lp as Record<string, unknown>), blocks: (blocks ?? []).map(stripBlockMeta) } as LandingPage;
      }
    }
  } catch { /* fall through */ }
  const all = await readJsonFile<LandingPage[]>(FILE_NAME, []);
  return all.find((x) => x.id === id) ?? null;
}

export async function createLandingPage(data: Input) {
  const all = await getLandingPages();
  const next = normalize(data, undefined, all);
  await writeJsonFile(FILE_NAME, [next, ...all]);
  await upsertToSupabase(next);
  await logAction({ action: "create", entity_type: "landing_page", entity_id: next.id, entity_title: next.title, new_data: next });
  return next;
}

export async function updateLandingPage(id: string, data: Input) {
  const all = await getLandingPages();
  const idx = all.findIndex((x) => x.id === id);
  if (idx === -1) return null;
  const old = all[idx];
  const next = normalize(data, old, all);
  all[idx] = next;
  await writeJsonFile(FILE_NAME, all);
  await upsertToSupabase(next);
  if (old.status !== next.status) {
    if (next.status === "published") await logAction({ action: "publish", entity_type: "landing_page", entity_id: next.id, entity_title: next.title, old_data: old, new_data: next });
    else if (old.status === "published") await logAction({ action: "unpublish", entity_type: "landing_page", entity_id: next.id, entity_title: next.title, old_data: old, new_data: next });
  }
  await logAction({ action: "update", entity_type: "landing_page", entity_id: next.id, entity_title: next.title, old_data: old, new_data: next });
  return next;
}

export async function duplicateLandingPage(id: string) {
  const all = await getLandingPages();
  const orig = all.find((x) => x.id === id);
  if (!orig) return null;
  const now = new Date().toISOString();
  const copy = normalize({
    ...orig,
    title: `${orig.title} (copia)`,
    slug: "",
    status: "draft",
    blocks: orig.blocks.map((block, index) => ({
      ...block,
      id: randomUUID(),
      sort_order: index,
      created_at: now,
      updated_at: now,
    })),
  }, undefined, all);
  await writeJsonFile(FILE_NAME, [copy, ...all]);
  await upsertToSupabase(copy);
  await logAction({ action: "duplicate", entity_type: "landing_page", entity_id: orig.id, entity_title: orig.title, new_data: copy });
  return copy;
}

export async function getPublishedLandingPageBySlug(slug: string) {
  const normalizedSlug = toSlug(slug);
  try {
    const supabase = createAdminClient();
    const { data: lp, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("slug", normalizedSlug)
      .eq("status", "published")
      .is("deleted_at", null)
      .maybeSingle();
    if (!error && lp) {
      const { data: blocks, error: blocksError } = await supabase
        .from(BLOCK_TABLE)
        .select("*")
        .eq("landing_page_id", lp.id)
        .order("sort_order");
      if (!blocksError) {
        return { ...(lp as Record<string, unknown>), blocks: (blocks ?? []).map(stripBlockMeta) } as LandingPage;
      }
    }
  } catch { /* fall through to local data */ }

  const all = await readJsonFile<LandingPage[]>(FILE_NAME, []);
  return all.find((item) => item.slug === normalizedSlug && item.status === "published" && !item.deleted_at) ?? null;
}

export async function moveLandingPageToTrash(id: string, deletedBy?: string) {
  const dBy = deletedBy ?? await getCurrentUserEmail();
  const all = await readJsonFile<LandingPage[]>(FILE_NAME, []);
  const idx = all.findIndex((x) => x.id === id);
  if (idx === -1) return null;
  const d = new Date().toISOString();
  const t: LandingPage = { ...all[idx], status: "deleted", deleted_at: d, updated_at: d };
  all[idx] = t;
  await writeJsonFile(FILE_NAME, all);
  await upsertToSupabase(t);
  await addTrashItem({ id: randomUUID(), entity_type: "landing_page", entity_id: id, title: t.title, deleted_by: dBy, deleted_at: d, restore_data: all[idx] });
  await logAction({ action: "trash", entity_type: "landing_page", entity_id: id, entity_title: t.title, old_data: all[idx], user_email: dBy });
  return t;
}

export async function restoreLandingPage(id: string) {
  const all = await readJsonFile<LandingPage[]>(FILE_NAME, []);
  const idx = all.findIndex((x) => x.id === id);
  const ti = await getTrashItemByEntity(id);
  if (idx === -1 && !ti) return null;
  const r = ti?.restore_data && typeof ti.restore_data === "object"
    ? { ...(ti.restore_data as LandingPage), status: "draft" as const, deleted_at: null, updated_at: new Date().toISOString() }
    : { ...all[idx], status: "draft" as const, deleted_at: null, updated_at: new Date().toISOString() };
  if (idx === -1) { const a = await readJsonFile<LandingPage[]>(FILE_NAME, []); a.unshift(r); await writeJsonFile(FILE_NAME, a); }
  else { all[idx] = r; await writeJsonFile(FILE_NAME, all); }
  await upsertToSupabase(r);
  if (ti) await removeTrashItem(ti.id);
  await logAction({ action: "restore", entity_type: "landing_page", entity_id: r.id, entity_title: r.title });
  return r;
}

export async function deleteLandingPagePermanently(id: string) {
  const all = await readJsonFile<LandingPage[]>(FILE_NAME, []);
  const item = all.find((x) => x.id === id);
  const next = all.filter((x) => x.id !== id);
  if (next.length === all.length) return false;
  await writeJsonFile(FILE_NAME, next);
  await deleteFromSupabase(id);
  const ti = await getTrashItemByEntity(id);
  if (ti) await removeTrashItem(ti.id);
  if (item) await logAction({ action: "delete_permanently", entity_type: "landing_page", entity_id: id, entity_title: item.title, old_data: item });
  return true;
}

export async function addLandingPageBlock(landingId: string, block: LandingPageBlock) {
  const all = await readJsonFile<LandingPage[]>(FILE_NAME, []);
  const idx = all.findIndex((x) => x.id === landingId);
  if (idx === -1) return null;
  const entry: LandingPageBlock = { ...block, id: block.id || randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  all[idx].blocks.push(entry);
  all[idx].updated_at = new Date().toISOString();
  await writeJsonFile(FILE_NAME, all);
  await upsertBlock(landingId, entry);
  return entry;
}

export async function updateLandingPageBlock(landingId: string, blockId: string, data: Partial<LandingPageBlock>) {
  const all = await readJsonFile<LandingPage[]>(FILE_NAME, []);
  const idx = all.findIndex((x) => x.id === landingId);
  if (idx === -1) return null;
  const bi = all[idx].blocks.findIndex((b) => b.id === blockId);
  if (bi === -1) return null;
  all[idx].blocks[bi] = { ...all[idx].blocks[bi], ...data, id: blockId, updated_at: new Date().toISOString() };
  all[idx].updated_at = new Date().toISOString();
  await writeJsonFile(FILE_NAME, all);
  await upsertBlock(landingId, all[idx].blocks[bi]);
  return all[idx].blocks[bi];
}

export async function removeLandingPageBlock(landingId: string, blockId: string) {
  const all = await readJsonFile<LandingPage[]>(FILE_NAME, []);
  const idx = all.findIndex((x) => x.id === landingId);
  if (idx === -1) return false;
  all[idx].blocks = all[idx].blocks.filter((b) => b.id !== blockId);
  all[idx].updated_at = new Date().toISOString();
  await writeJsonFile(FILE_NAME, all);
  try {
    const supabase = createAdminClient();
    await supabase.from(BLOCK_TABLE).delete().eq("id", blockId).eq("landing_page_id", landingId);
  } catch { /* best-effort */ }
  return true;
}

export async function reorderLandingPageBlocks(landingId: string, orderedIds: string[]) {
  const all = await readJsonFile<LandingPage[]>(FILE_NAME, []);
  const idx = all.findIndex((x) => x.id === landingId);
  if (idx === -1) return null;
  const map = new Map(all[idx].blocks.map((b) => [b.id, b]));
  const reordered = orderedIds.map((id, i) => { const b = map.get(id); return b ? { ...b, sort_order: i, updated_at: new Date().toISOString() } : null; }).filter(Boolean) as LandingPageBlock[];
  all[idx].blocks = reordered;
  all[idx].updated_at = new Date().toISOString();
  await writeJsonFile(FILE_NAME, all);
  try {
    const supabase = createAdminClient();
    for (const block of reordered) {
      await supabase.from(BLOCK_TABLE).update({ sort_order: block.sort_order }).eq("id", block.id).eq("landing_page_id", landingId);
    }
  } catch { /* best-effort */ }
  return reordered;
}
