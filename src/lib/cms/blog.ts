import { randomUUID } from "crypto";
import { createAdminClient } from "../supabase/admin";
import { addTrashItem, getCurrentUserEmail, getTrashItemByEntity, removeTrashItem } from "./trash";
import { readJsonFile, writeJsonFile } from "./local-storage";
import { isBlogPostBlockType, isBlogPostStatus } from "./types";
import type { BlogPost, BlogPostBlock } from "./types";
import { logAction } from "./history-logs";
import { normalizeHeroSettings } from "./hero-settings";

const TABLE = "blog_posts";
const BLOCK_TABLE = "blog_post_blocks";
const FILE_NAME = "blog-posts.json";

type BlogInput = Partial<Omit<BlogPost, "id" | "created_at" | "updated_at" | "deleted_at">> & {
  id?: string;
  deleted_at?: string | null;
};

function parseContentEnvelope(value: unknown) {
  if (typeof value !== "string" || !value.trim().startsWith("{")) return { body: String(value ?? ""), hero: undefined as unknown };
  try {
    const parsed = JSON.parse(value) as { body?: unknown; hero?: unknown };
    return { body: String(parsed.body ?? ""), hero: parsed.hero };
  } catch {
    return { body: String(value ?? ""), hero: undefined as unknown };
  }
}

function toSlug(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-");
}

function uniqueSlug(items: BlogPost[], base: string, currentId?: string) {
  const taken = new Set(items.filter((p) => p.id !== currentId).map((p) => p.slug));
  if (!taken.has(base)) return base;
  let c = 2; while (taken.has(`${base}-${c}`)) c++; return `${base}-${c}`;
}

function estimateReadingTime(text: string, blocks: BlogPostBlock[] = []): number {
  const allText = [text, ...blocks.map((b) => [b.title, b.text, b.custom_html].join(" "))].join(" ");
  const words = allText.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function toBool(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeBlocks(blocks: unknown[]): BlogPostBlock[] {
  return blocks.map((block, i) => {
    const b = block as Partial<BlogPostBlock> & Record<string, unknown>;
    const type = b.type ?? "text";
    if (!isBlogPostBlockType(type)) throw new Error(`Tipo de bloque no válido: ${type}`);
    return {
      id: b.id ?? randomUUID(),
      type,
      title: String(b.title ?? "").trim(),
      text: String(b.text ?? "").trim(),
      image_id: String(b.image_id ?? "").trim(),
      source_url: String(b.source_url ?? "").trim(),
      is_visible: b.is_visible !== false,
      sort_order: b.sort_order ?? i,
      custom_html: String(b.custom_html ?? "").trim(),
      created_at: b.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } satisfies BlogPostBlock;
  });
}

function normalizePost(input: BlogInput, existing?: BlogPost, allItems: BlogPost[] = []) {
  const now = new Date().toISOString();
  const title = String(input.title ?? existing?.title ?? "").trim();
  const slugBase = String(input.slug ?? existing?.slug ?? "").trim() || toSlug(title);
  const slug = uniqueSlug(allItems, slugBase || toSlug(title), existing?.id);
  const status = input.status ?? existing?.status ?? "draft";
  if (!title) throw new Error("El título es obligatorio.");
  if (!isBlogPostStatus(status)) throw new Error("Estado no válido.");

  const blocks = normalizeBlocks(input.blocks ?? existing?.blocks ?? []);
  const existingEnvelope = parseContentEnvelope(existing?.content);
  const inputEnvelope = parseContentEnvelope(input.content);
  const contentBody = String(inputEnvelope.body || existingEnvelope.body || "").trim();
  const hero = normalizeHeroSettings(input.hero ?? existing?.hero ?? inputEnvelope.hero ?? existingEnvelope.hero, {
    heroTitle: title,
    heroSubtitle: String(input.category ?? existing?.category ?? "Bitácora"),
    heroImage: String(input.featured_image_id ?? existing?.featured_image_id ?? ""),
  });
  const content = contentBody;
  const readingTime = input.reading_time ?? estimateReadingTime(content, blocks);

  return {
    id: existing?.id ?? input.id ?? randomUUID(),
    title,
    slug,
    status,
    excerpt: String(input.excerpt ?? existing?.excerpt ?? "").trim(),
    listing_excerpt: String(input.listing_excerpt ?? existing?.listing_excerpt ?? "").trim(),
    content,
    featured_image_id: String(input.featured_image_id ?? existing?.featured_image_id ?? "").trim(),
    title_image_id: String(input.title_image_id ?? existing?.title_image_id ?? "").trim(),
    author_id: String(input.author_id ?? existing?.author_id ?? "").trim(),
    category: String(input.category ?? existing?.category ?? "general").trim(),
    tags: Array.isArray(input.tags ?? existing?.tags) ? [...(input.tags ?? existing?.tags ?? [])].map(String) : [],
    is_featured: toBool(input.is_featured, existing?.is_featured ?? false),
    featured_order: Number(input.featured_order ?? existing?.featured_order ?? 0),
    featured_excerpt: String(input.featured_excerpt ?? existing?.featured_excerpt ?? "").trim(),
    visible_in_listing: toBool(input.visible_in_listing, existing?.visible_in_listing ?? true),
    sort_order: Number(input.sort_order ?? existing?.sort_order ?? 0),
    published_at: input.status === "published" && !existing?.published_at ? now : (input.published_at ?? existing?.published_at ?? ""),
    reading_time: readingTime,
    seo_title: String(input.seo_title ?? existing?.seo_title ?? "").trim(),
    seo_description: String(input.seo_description ?? existing?.seo_description ?? "").trim(),
    seo_image: String(input.seo_image ?? existing?.seo_image ?? "").trim(),
    hero,
    blocks,
    created_at: existing?.created_at ?? now,
    updated_at: now,
    deleted_at: input.status === "deleted" ? existing?.deleted_at ?? now : null,
  } satisfies BlogPost;
}

// ── Mapping helpers ──

function rowToBlogPostBlock(row: Record<string, unknown>): BlogPostBlock {
  const { blog_post_id: _blogPostId, ...rest } = row;
  return rest as unknown as BlogPostBlock;
}

function blogPostBlockToRow(postId: string, block: BlogPostBlock): Record<string, unknown> {
  return { ...block, blog_post_id: postId };
}

function rowToBlogPost(row: Record<string, unknown>, blocks: BlogPostBlock[] = []): BlogPost {
  const envelope = parseContentEnvelope(row.content);
  return {
    ...row,
    content: envelope.body,
    tags: Array.isArray(row.tags) ? row.tags : [],
    is_featured: Boolean(row.is_featured),
    featured_order: Number(row.featured_order ?? 0),
    listing_excerpt: String(row.listing_excerpt ?? ""),
    title_image_id: String(row.title_image_id ?? ""),
    featured_excerpt: String(row.featured_excerpt ?? ""),
    visible_in_listing: row.visible_in_listing !== false,
    sort_order: Number(row.sort_order ?? 0),
    published_at: row.published_at ?? "",
    hero: normalizeHeroSettings(row.hero ?? envelope.hero, {
      heroTitle: String(row.title ?? ""),
      heroSubtitle: String(row.category ?? "Bitácora"),
      heroImage: String(row.featured_image_id ?? row.seo_image ?? ""),
    }),
    blocks,
  } as unknown as BlogPost;
}

function blogPostToRow(post: BlogPost): Record<string, unknown> {
  const { blocks: _blocks, hero, content, ...rest } = post;
  return { ...rest, content, hero };
}

// ── Supabase helpers ──

async function readAllFromSupabase(): Promise<BlogPost[] | null> {
  try {
    const supabase = createAdminClient();
    const { data: posts, error: pe } = await supabase.from(TABLE).select("*");
    if (pe) throw pe;
    if (!posts || posts.length === 0) return null;
    const { data: blocks, error: be } = await supabase.from(BLOCK_TABLE).select("*").order("sort_order");
    if (be) throw be;
    const byPost: Record<string, BlogPostBlock[]> = {};
    if (blocks) {
      for (const row of blocks as Array<Record<string, unknown>>) {
        const pid = row.blog_post_id as string;
        if (!byPost[pid]) byPost[pid] = [];
        byPost[pid].push(rowToBlogPostBlock(row));
      }
    }
    return (posts as Array<Record<string, unknown>>).map((row) =>
      rowToBlogPost(row, byPost[row.id as string] ?? [])
    );
  } catch {
    return null;
  }
}

async function upsertPost(post: BlogPost): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from(TABLE).upsert(blogPostToRow(post), { onConflict: "id" });
  } catch { /* best-effort */ }
}

async function replaceBlocks(postId: string, blocks: BlogPostBlock[]): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from(BLOCK_TABLE).delete().eq("blog_post_id", postId);
    if (blocks.length > 0) {
      await supabase.from(BLOCK_TABLE).insert(blocks.map((b) => blogPostBlockToRow(postId, b)));
    }
  } catch { /* best-effort */ }
}

async function deletePostFromDb(id: string): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from(TABLE).delete().eq("id", id);
  } catch { /* best-effort */ }
}

async function fetchPostWithBlocks(
  query: (s: ReturnType<typeof createAdminClient>) => Promise<Record<string, unknown> | null>,
): Promise<BlogPost | null> {
  try {
    const supabase = createAdminClient();
    const row = await query(supabase);
    if (!row) return null;
    const { data: blocks } = await supabase.from(BLOCK_TABLE).select("*").eq("blog_post_id", row.id as string).order("sort_order");
    return rowToBlogPost(row, (blocks ?? []).map(rowToBlogPostBlock));
  } catch { /* fall through */ }
  return null;
}

async function readBlogPostsForMutation() {
  return (await readAllFromSupabase()) ?? await readJsonFile<BlogPost[]>(FILE_NAME, []);
}

// ── Public API ──

export async function getBlogPosts() {
  const fromSupabase = await readAllFromSupabase();
  if (fromSupabase) return fromSupabase;
  return readJsonFile<BlogPost[]>(FILE_NAME, []);
}

export async function getBlogPostById(id: string) {
  const result = await fetchPostWithBlocks(async (supabase) => {
    const { data } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
    return data as Record<string, unknown> | null;
  });
  if (result) return result;
  const items = await readJsonFile<BlogPost[]>(FILE_NAME, []);
  return items.find((p) => p.id === id) ?? null;
}

export async function getBlogPostBySlug(slug: string) {
  const result = await fetchPostWithBlocks(async (supabase) => {
    const { data } = await supabase.from(TABLE).select("*").eq("slug", slug).maybeSingle();
    return data as Record<string, unknown> | null;
  });
  if (result) return result;
  const items = await readJsonFile<BlogPost[]>(FILE_NAME, []);
  return items.find((p) => p.slug === slug) ?? null;
}

export async function createBlogPost(data: BlogInput) {
  const items = await readBlogPostsForMutation();
  const next = normalizePost(data, undefined, items);
  await writeJsonFile(FILE_NAME, [next, ...items]);
  await upsertPost(next);
  await replaceBlocks(next.id, next.blocks);
  await logAction({ action: "create", entity_type: "blog_post", entity_id: next.id, entity_title: next.title, new_data: next });
  return next;
}

export async function updateBlogPost(id: string, data: BlogInput) {
  const items = await readBlogPostsForMutation();
  const index = items.findIndex((p) => p.id === id);
  if (index === -1) return null;
  const old = items[index];
  const next = normalizePost(data, old, items);
  items[index] = next;
  await writeJsonFile(FILE_NAME, items);
  await upsertPost(next);
  await replaceBlocks(next.id, next.blocks);
  if (old.status !== next.status) {
    if (next.status === "published") await logAction({ action: "publish", entity_type: "blog_post", entity_id: next.id, entity_title: next.title, old_data: old, new_data: next });
    else if (next.status === "archived") await logAction({ action: "archive", entity_type: "blog_post", entity_id: next.id, entity_title: next.title, old_data: old, new_data: next });
    else if (old.status === "published") await logAction({ action: "unpublish", entity_type: "blog_post", entity_id: next.id, entity_title: next.title, old_data: old, new_data: next });
  }
  await logAction({ action: "update", entity_type: "blog_post", entity_id: next.id, entity_title: next.title, old_data: old, new_data: next });
  return next;
}

export async function duplicateBlogPost(id: string) {
  const items = await readBlogPostsForMutation();
  const original = items.find((p) => p.id === id);
  if (!original) return null;
  const copy = normalizePost({ ...original, title: `${original.title} (copia)`, slug: "", status: "draft", blocks: original.blocks.map((b) => ({ ...b, id: randomUUID() })) }, undefined, items);
  await writeJsonFile(FILE_NAME, [copy, ...items]);
  await upsertPost(copy);
  await replaceBlocks(copy.id, copy.blocks);
  await logAction({ action: "duplicate", entity_type: "blog_post", entity_id: original.id, entity_title: original.title, new_data: copy });
  return copy;
}

export async function moveBlogPostToTrash(id: string, deletedBy?: string) {
  const dBy = deletedBy ?? await getCurrentUserEmail();
  const items = await readBlogPostsForMutation();
  const index = items.findIndex((p) => p.id === id);
  if (index === -1) return null;
  const current = items[index];
  const deletedAt = new Date().toISOString();
  const trashed: BlogPost = { ...current, status: "deleted", deleted_at: deletedAt, updated_at: deletedAt };
  items[index] = trashed;
  await writeJsonFile(FILE_NAME, items);
  await upsertPost(trashed);
  await addTrashItem({ id: randomUUID(), entity_type: "blog_post", entity_id: current.id, title: current.title, deleted_by: dBy, deleted_at: deletedAt, restore_data: current });
  await logAction({ action: "trash", entity_type: "blog_post", entity_id: current.id, entity_title: current.title, old_data: current, user_email: dBy });
  return trashed;
}

export async function restoreBlogPost(id: string) {
  const items = await readBlogPostsForMutation();
  const index = items.findIndex((p) => p.id === id);
  const trashItem = await getTrashItemByEntity(id);
  if (index === -1 && !trashItem) return null;
  const restored = trashItem?.restore_data && typeof trashItem.restore_data === "object"
    ? ({ ...(trashItem.restore_data as BlogPost), status: "draft", deleted_at: null, updated_at: new Date().toISOString() } as BlogPost)
    : ({ ...items[index], status: "draft", deleted_at: null, updated_at: new Date().toISOString() } as BlogPost);
  if (index === -1) { items.unshift(restored); await writeJsonFile(FILE_NAME, items); }
  else { items[index] = restored; await writeJsonFile(FILE_NAME, items); }
  await upsertPost(restored);
  if (trashItem) await removeTrashItem(trashItem.id);
  await logAction({ action: "restore", entity_type: "blog_post", entity_id: restored.id, entity_title: restored.title });
  return restored;
}

export async function deleteBlogPostPermanently(id: string) {
  const items = await readBlogPostsForMutation();
  const item = items.find((p) => p.id === id);
  const next = items.filter((p) => p.id !== id);
  if (next.length === items.length) return false;
  await writeJsonFile(FILE_NAME, next);
  await deletePostFromDb(id);
  const trashItem = await getTrashItemByEntity(id);
  if (trashItem) await removeTrashItem(trashItem.id);
  if (item) await logAction({ action: "delete_permanently", entity_type: "blog_post", entity_id: id, entity_title: item.title, old_data: item });
  return true;
}
