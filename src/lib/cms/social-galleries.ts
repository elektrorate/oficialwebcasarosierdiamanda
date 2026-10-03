import { randomUUID } from "crypto";
import { createAdminClient } from "../supabase/admin";
import { getTrashItemByEntity, removeTrashItem } from "./trash";
import { readJsonFile, writeJsonFile } from "./local-storage";
import type { SocialGallery, SocialGalleryItem } from "./types";
import { logAction } from "./history-logs";

const FILE_NAME = "social-galleries.json";
const SINGLE_GALLERY_SLUG = "galeria-social";
const DEFAULT_GALLERY_ID = "4a18f60a-5c43-4bfb-b8f9-2e967f6bd5d1";

function ensureUuid(value: string | undefined, fallbackSeed: string) {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (value && uuidPattern.test(value)) return value;
  return fallbackSeed;
}

function getDefaultSocialGallery(): SocialGallery {
  return {
    id: DEFAULT_GALLERY_ID,
    name: "Galeria social principal",
    slug: SINGLE_GALLERY_SLUG,
    status: "published",
    title: "Y tu, cuando tuviste\ntu ultima faena?",
    description: "Se parte de nuestra comunidad en indastagram - @casarosier",
    cta_text: "",
    cta_url: "",
    items: [
      {
        id: "c8256425-1a6b-46db-a0cc-99cba2d80001",
        image_id: "img/social-1.jpg",
        image_url: "/img/social-1.jpg",
        title: "Serie en proceso",
        description: "Pieza en estudio: pruebas de forma, secado y acabados de superficie.",
        instagram_url: "",
        sort_order: 0,
        is_visible: true,
        created_at: "2026-06-30T00:00:00.000Z",
        updated_at: "2026-06-30T00:00:00.000Z",
      },
      {
        id: "c8256425-1a6b-46db-a0cc-99cba2d80002",
        image_id: "img/social-2.jpg",
        image_url: "/img/social-2.jpg",
        title: "Materia y ritmo",
        description: "Una mirada al proceso cotidiano dentro del taller.",
        instagram_url: "",
        sort_order: 1,
        is_visible: true,
        created_at: "2026-06-30T00:01:00.000Z",
        updated_at: "2026-06-30T00:01:00.000Z",
      },
      {
        id: "c8256425-1a6b-46db-a0cc-99cba2d80003",
        image_id: "img/social-3.jpg",
        image_url: "/img/social-3.jpg",
        title: "Color y superficie",
        description: "Pruebas de esmaltes, capas y pequenas decisiones de acabado.",
        instagram_url: "",
        sort_order: 2,
        is_visible: true,
        created_at: "2026-06-30T00:02:00.000Z",
        updated_at: "2026-06-30T00:02:00.000Z",
      },
      {
        id: "c8256425-1a6b-46db-a0cc-99cba2d80004",
        image_id: "img/social-4.jpeg",
        image_url: "/img/social-4.jpeg",
        title: "El taller por dentro",
        description: "Herramientas, piezas y momentos de trabajo compartido.",
        instagram_url: "",
        sort_order: 3,
        is_visible: true,
        created_at: "2026-06-30T00:03:00.000Z",
        updated_at: "2026-06-30T00:03:00.000Z",
      },
    ],
    created_at: "2026-06-30T00:00:00.000Z",
    updated_at: "2026-06-30T00:00:00.000Z",
    deleted_at: null,
  };
}

type Input = Partial<Omit<SocialGallery, "id" | "created_at" | "updated_at" | "deleted_at" | "items">> & {
  id?: string; deleted_at?: string | null; items?: SocialGalleryItem[];
};

function toSlug(v: string) { return v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-"); }

function uniqueSlug(items: SocialGallery[], base: string, currentId?: string) {
  const taken = new Set(items.filter((i) => i.id !== currentId).map((i) => i.slug));
  if (!taken.has(base)) return base; let c = 2; while (taken.has(`${base}-${c}`)) c++; return `${base}-${c}`;
}

function normalize(input: Input, existing?: SocialGallery, all: SocialGallery[] = []) {
  const name = String(input.name ?? existing?.name ?? "Galeria social principal").trim();
  const slugBase = String(input.slug ?? existing?.slug ?? SINGLE_GALLERY_SLUG).trim() || SINGLE_GALLERY_SLUG;
  const slug = uniqueSlug(all, slugBase || toSlug(name), existing?.id);
  const now = new Date().toISOString();
  const status = "published";
  const galleryItems = (input.items ?? existing?.items ?? []).map((item, index) => ({
    ...item,
    is_visible: true,
    sort_order: index,
  }));
  if (!name) throw new Error("El nombre es obligatorio.");
  return { id: existing?.id ?? input.id ?? randomUUID(), name, slug, status, title: String(input.title ?? existing?.title ?? "").trim(), description: String(input.description ?? existing?.description ?? "").trim(), cta_text: "", cta_url: "", items: galleryItems, created_at: existing?.created_at ?? now, updated_at: now, deleted_at: null } satisfies SocialGallery;
}

function mapDbItemToTs(item: Record<string, unknown>, mediaUrlByFile = new Map<string, string>()): SocialGalleryItem {
  const imageId = typeof item.image_id === "string" ? item.image_id : "";
  const imageUrl = typeof item.image_url === "string" ? item.image_url : "";
  let resolvedImageUrl = imageUrl;
  if (imageId && mediaUrlByFile.has(imageId)) {
    resolvedImageUrl = mediaUrlByFile.get(imageId) ?? imageUrl;
  } else if (imageUrl.startsWith("/")) {
    const fileName = imageUrl.replace(/^\/+/, "");
    resolvedImageUrl = mediaUrlByFile.get(fileName) ?? imageUrl;
  }

  return {
    id: typeof item.id === "string" ? item.id : randomUUID(),
    image_id: imageId,
    image_url: resolvedImageUrl,
    title: typeof item.title === "string" ? item.title : "",
    description: typeof item.description === "string" ? item.description : "",
    instagram_url: typeof item.url === "string" ? item.url : "",
    sort_order: typeof item.sort_order === "number" ? item.sort_order : 0,
    is_visible: item.is_visible !== false,
    created_at: typeof item.created_at === "string" ? item.created_at : new Date().toISOString(),
    updated_at: typeof item.updated_at === "string" ? item.updated_at : new Date().toISOString(),
  };
}

function mapTsItemToDb(galleryId: string, item: SocialGalleryItem): Record<string, unknown> {
  const { instagram_url, ...rest } = item;
  const imageUrl = typeof item.image_url === "string" ? item.image_url : "";
  const fallbackImageId = imageUrl.startsWith("/") ? imageUrl.replace(/^\/+/, "") : "";
  return {
    ...rest,
    id: ensureUuid(item.id, randomUUID()),
    image_id: item.image_id || fallbackImageId,
    is_visible: true,
    social_gallery_id: galleryId,
    url: instagram_url,
    platform: "instagram",
  };
}

async function readAllFromSupabase(): Promise<SocialGallery[] | null> {
  try {
    const supabase = createAdminClient();
    const { data: galleries, error: ge } = await supabase.from("social_galleries").select("*");
    if (ge) throw ge;
    if (!galleries || galleries.length === 0) return null;
    const { data: items, error: ie } = await supabase.from("social_gallery_items").select("*").order("sort_order");
    if (ie) throw ie;
    const { data: mediaRows } = await supabase.from("media_assets").select("file_name,file_url");
    const mediaUrlByFile = new Map<string, string>();
    for (const row of (mediaRows ?? []) as Array<Record<string, unknown>>) {
      if (typeof row.file_name === "string" && typeof row.file_url === "string") {
        mediaUrlByFile.set(row.file_name, row.file_url);
      }
    }
    const byGallery: Record<string, SocialGalleryItem[]> = {};
    if (items) {
      for (const row of items as Array<Record<string, unknown>>) {
        const gid = row.social_gallery_id as string;
        if (!byGallery[gid]) byGallery[gid] = [];
        byGallery[gid].push(mapDbItemToTs(row, mediaUrlByFile));
      }
    }
    return (galleries as Array<Record<string, unknown>>).map((row) => ({
      ...row,
      items: byGallery[row.id as string] ?? [],
    })) as SocialGallery[];
  } catch {
    return null;
  }
}

async function upsertGallery(gallery: SocialGallery): Promise<void> {
  const supabase = createAdminClient();
  const data = { ...gallery } as Partial<SocialGallery>;
  delete data.items;
  const { error } = await supabase.from("social_galleries").upsert(data as unknown as Record<string, unknown>, { onConflict: "id" });
  if (error) throw error;
}

async function deleteGalleryFromDb(id: string): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from("social_galleries").delete().eq("id", id);
  } catch { /* best-effort */ }
}

async function replaceGalleryItems(galleryId: string, items: SocialGalleryItem[]): Promise<void> {
  const supabase = createAdminClient();
  const { error: deleteError } = await supabase.from("social_gallery_items").delete().eq("social_gallery_id", galleryId);
  if (deleteError) throw deleteError;
  if (items.length > 0) {
    const { error: insertError } = await supabase.from("social_gallery_items").insert(items.map((item) => mapTsItemToDb(galleryId, item)));
    if (insertError) throw insertError;
  }
}

async function seedSupabase(items: SocialGallery[]): Promise<void> {
  if (items.length === 0) return;
  for (const gallery of items) {
    await upsertGallery(gallery);
    await replaceGalleryItems(gallery.id, gallery.items);
  }
}

async function ensureDefaultSocialGalleryInSupabase(): Promise<void> {
  const gallery = getDefaultSocialGallery();
  const supabase = createAdminClient();
  const { data: mediaRows } = await supabase
    .from("media_assets")
    .select("file_name,file_url")
    .in("file_name", gallery.items.map((item) => item.image_id).filter(Boolean));
  const mediaUrlByFile = new Map<string, string>();
  for (const row of (mediaRows ?? []) as Array<Record<string, unknown>>) {
    if (typeof row.file_name === "string" && typeof row.file_url === "string") {
      mediaUrlByFile.set(row.file_name, row.file_url);
    }
  }
  const { items, ...galleryRow } = gallery;
  await supabase.from("social_galleries").upsert(galleryRow as unknown as Record<string, unknown>, { onConflict: "id" });
  await supabase.from("social_gallery_items").upsert(
    items.map((item) => ({
      ...mapTsItemToDb(gallery.id, item),
      image_url: mediaUrlByFile.get(item.image_id) ?? item.image_url,
    })),
    { onConflict: "id" },
  );
}

export async function getSocialGalleries() {
  const fromSupabase = await readAllFromSupabase();
  if (fromSupabase && fromSupabase.length > 0) {
    return fromSupabase.map((gallery) => ({ ...gallery, status: "published" as const, deleted_at: null }));
  }
  const localGalleries = await readJsonFile<SocialGallery[]>(FILE_NAME, []);
  return localGalleries.map((gallery) => ({ ...gallery, status: "published" as const, deleted_at: null }));
}

export async function getSocialGalleryById(id: string) {
  try {
    const supabase = createAdminClient();
    const { data: gallery, error: ge } = await supabase.from("social_galleries").select("*").eq("id", id).maybeSingle();
    if (!ge && gallery) {
      const { data: items, error: ie } = await supabase.from("social_gallery_items").select("*").eq("social_gallery_id", id).order("sort_order");
      if (!ie) {
        const imageIds = (items ?? [])
          .map((item) => typeof item.image_id === "string" ? item.image_id : "")
          .filter(Boolean);
        const mediaUrlByFile = new Map<string, string>();
        if (imageIds.length > 0) {
          const { data: mediaRows } = await supabase.from("media_assets").select("file_name,file_url").in("file_name", imageIds);
          for (const row of (mediaRows ?? []) as Array<Record<string, unknown>>) {
            if (typeof row.file_name === "string" && typeof row.file_url === "string") {
              mediaUrlByFile.set(row.file_name, row.file_url);
            }
          }
        }
        return { ...(gallery as Record<string, unknown>), status: "published" as const, deleted_at: null, items: (items ?? []).map((row) => mapDbItemToTs(row, mediaUrlByFile)) } as SocialGallery;
      }
    }
  } catch { /* fall through */ }
  const all = await readJsonFile<SocialGallery[]>(FILE_NAME, []);
  const localGallery = all.find((x) => x.id === id) ?? null;
  if (localGallery) await seedSupabase([localGallery]);
  return localGallery ? { ...localGallery, status: "published" as const, deleted_at: null } : localGallery;
}

export async function createSocialGallery(data: Input) {
  const all = await readJsonFile<SocialGallery[]>(FILE_NAME, []);
  const existing = all.find((item) => !item.deleted_at && item.status !== "deleted");
  if (existing) {
    return updateSocialGallery(existing.id, data);
  }
  const next = normalize(data, undefined, all);
  await upsertGallery(next);
  await replaceGalleryItems(next.id, next.items);
  await logAction({ action: "create", entity_type: "social_gallery", entity_id: next.id, entity_title: next.name, new_data: next });
  return next;
}

export async function updateSocialGallery(id: string, data: Input) {
  const all = await readJsonFile<SocialGallery[]>(FILE_NAME, []);
  const idx = all.findIndex((x) => x.id === id);
  const dbGallery = idx === -1 ? await getSocialGalleryById(id) : null;
  if (idx === -1 && !dbGallery) return null;
  const old = idx === -1 ? dbGallery as SocialGallery : all[idx];
  const next = normalize(data, old, all);
  await upsertGallery(next);
  await replaceGalleryItems(next.id, next.items);
  await logAction({ action: "update", entity_type: "social_gallery", entity_id: next.id, entity_title: next.name, old_data: old, new_data: next });
  return next;
}

export async function duplicateSocialGallery(id: string) {
  void id;
  return null;
}

export async function moveSocialGalleryToTrash(id: string, deletedBy?: string) {
  void id;
  void deletedBy;
  return null;
}

export async function restoreSocialGallery(id: string) {
  const all = await readJsonFile<SocialGallery[]>(FILE_NAME, []);
  const idx = all.findIndex((x) => x.id === id);
  const ti = await getTrashItemByEntity(id);
  if (idx === -1 && !ti) return null;
  const r = ti?.restore_data && typeof ti.restore_data === "object"
    ? { ...(ti.restore_data as SocialGallery), status: "published" as const, deleted_at: null, updated_at: new Date().toISOString() }
    : { ...all[idx], status: "published" as const, deleted_at: null, updated_at: new Date().toISOString() };
  if (idx === -1) { const a = await readJsonFile<SocialGallery[]>(FILE_NAME, []); a.unshift(r); await writeJsonFile(FILE_NAME, a); }
  else { all[idx] = r; await writeJsonFile(FILE_NAME, all); }
  await upsertGallery(r);
  if (ti) await removeTrashItem(ti.id);
  await logAction({ action: "restore", entity_type: "social_gallery", entity_id: r.id, entity_title: r.name });
  return r;
}

export async function deleteSocialGalleryPermanently(id: string) {
  const all = await readJsonFile<SocialGallery[]>(FILE_NAME, []);
  const item = all.find((x) => x.id === id);
  const next = all.filter((x) => x.id !== id);
  if (next.length === all.length) return false;
  await writeJsonFile(FILE_NAME, next);
  await deleteGalleryFromDb(id);
  const ti = await getTrashItemByEntity(id);
  if (ti) await removeTrashItem(ti.id);
  if (item) await logAction({ action: "delete_permanently", entity_type: "social_gallery", entity_id: id, entity_title: item.name, old_data: item });
  return true;
}

export async function addSocialGalleryItem(galleryId: string, item: SocialGalleryItem) {
  const gallery = await getSocialGalleryById(galleryId);
  if (!gallery) return null;
  const now = new Date().toISOString();
  const entry: SocialGalleryItem = { ...item, id: item.id || randomUUID(), sort_order: 0, is_visible: true, created_at: now, updated_at: now };
  const items = [entry, ...gallery.items].map((galleryItem, order) => ({ ...galleryItem, sort_order: order, updated_at: galleryItem.id === entry.id ? now : galleryItem.updated_at }));
  const next = normalize({ ...gallery, items }, gallery, [gallery]);
  await upsertGallery(next);
  await replaceGalleryItems(galleryId, next.items);
  await logAction({ action: "update", entity_type: "social_gallery", entity_id: next.id, entity_title: next.name, old_data: gallery, new_data: next });
  return entry;
}

export async function removeSocialGalleryItem(galleryId: string, itemId: string) {
  const gallery = await getSocialGalleryById(galleryId);
  if (!gallery || !gallery.items.some((item) => item.id === itemId)) return false;
  const items = gallery.items
    .filter((item) => item.id !== itemId)
    .map((item, order) => ({ ...item, sort_order: order, updated_at: new Date().toISOString() }));
  const next = normalize({ ...gallery, items }, gallery, [gallery]);
  await upsertGallery(next);
  await replaceGalleryItems(galleryId, next.items);
  await logAction({ action: "update", entity_type: "social_gallery", entity_id: next.id, entity_title: next.name, old_data: gallery, new_data: next });
  return true;
}

export async function reorderSocialGalleryItems(galleryId: string, orderedIds: string[]) {
  const gallery = await getSocialGalleryById(galleryId);
  if (!gallery) return null;
  const currentById = new Map(gallery.items.map((item) => [item.id, item]));
  const ordered = orderedIds
    .map((id) => currentById.get(id))
    .filter(Boolean) as SocialGalleryItem[];
  const orderedIdSet = new Set(ordered.map((item) => item.id));
  const missing = gallery.items.filter((item) => !orderedIdSet.has(item.id));
  const items = [...ordered, ...missing].map((item, order) => ({
    ...item,
    sort_order: order,
    updated_at: new Date().toISOString(),
  }));
  const next = normalize({ ...gallery, items }, gallery, [gallery]);
  await upsertGallery(next);
  await replaceGalleryItems(galleryId, next.items);
  await logAction({ action: "update", entity_type: "social_gallery", entity_id: next.id, entity_title: next.name, old_data: gallery, new_data: next });
  return next.items;
}
