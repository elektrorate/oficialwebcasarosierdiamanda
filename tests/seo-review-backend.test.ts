import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { after, test } from "node:test";
import ts from "typescript";
import * as seo from "../src/lib/seo/content.ts";
import * as types from "../src/lib/cms/types.ts";
import * as menuRouting from "../src/lib/cms/menu-routing.ts";
import * as expiration from "../src/lib/cms/offering-expiration.ts";
import { validateSettingsPayload } from "../src/lib/cms/settings-schema.ts";
import { DEFAULT_SETTINGS } from "../src/lib/cms/settings-types.ts";
import type { SeoContentKind, SeoPeer } from "../src/lib/seo/content.ts";

const require = createRequire(import.meta.url);
const previousRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-service-role";
after(() => {
  if (previousRole === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = previousRole;
});

// Evaluate server modules with explicit dependency stubs: no DB or disk writes.
function loadModule<T>(path: string, dependencies: Record<string, unknown>, extraExports = ""): T {
  const source = readFileSync(new URL(`../src/${path}`, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source + extraExports, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const exports = {};
  new Function("require", "exports", compiled)((name: string) => {
    if (name in dependencies) return dependencies[name];
    if (["crypto", "fs/promises", "path"].includes(name)) return require(name);
    throw new Error(`Unmocked dependency: ${name}`);
  }, exports);
  return exports as T;
}

type Row = Record<string, unknown>;
type ReviewModule = {
  getPublishedSeoPeers(): Promise<SeoPeer[]>;
  getSeoContentWarnings(kind: SeoContentKind, item: Row): Promise<string[]>;
  SEO_DUPLICATES_UNVERIFIED: string;
};

function reviewFixture(rows: Record<string, Row[]> = {}, failTable?: string, incomplete = false) {
  const queries: Array<{ table: string; columns: string; offset: number }> = [];
  const review = loadModule<ReviewModule>("lib/cms/seo-review.ts", {
    "../seo/content": seo,
    "./menu-routing": menuRouting,
    "./offering-expiration": expiration,
    "./settings": { getSettings: async () => DEFAULT_SETTINGS },
    "./public-section-routes": { getPublicSectionRoutes: async () => [
      { key: "shop", path: "/tienda", aliases: [] },
      { key: "workshops", path: "/talleres", aliases: [] },
    ] },
    "../supabase/admin": { createAdminClient: () => ({
      from: (table: string) => {
        let columns = "";
        const query = {
          select: (value: string, options: { count: string }) => {
            columns = value;
            assert.equal(options.count, "exact");
            assert.ok(!/(?:^|,)(?:content|blocks|details|gallery|\*)(?:,|$)/.test(columns));
            return query;
          },
          eq: (column: string, value: unknown) => { assert.equal(column, "status"); assert.equal(value, "published"); return query; },
          is: (column: string, value: unknown) => { assert.equal(column, "deleted_at"); assert.equal(value, null); return query; },
          order: (column: string) => { assert.equal(column, "id"); return query; },
          range: async (offset: number) => {
            queries.push({ table, columns, offset });
            if (table === failTable) return { data: null, count: null, error: { message: "offline" } };
            const published = (rows[table] ?? []).filter((row) => row.status === "published" && row.deleted_at == null);
            return { data: incomplete ? [] : published.slice(offset, offset + 2), count: published.length, error: null };
          },
        };
        return query;
      },
    }) },
  });
  return { module: review, queries };
}

function published(id: string, extra: Row = {}): Row {
  return { id, slug: id, title: `Title ${id}`, excerpt: `Excerpt ${id}`, status: "published", deleted_at: null, ...extra };
}

test("published peers paginate through server caps, preserve raw SEO and use canonical paths", async () => {
  const { module, queries } = reviewFixture({
    blog_posts: Array.from({ length: 5 }, (_, index) => published(`post-${index}`, { seo_title: " <b>Raw</b> ", seo_description: " Raw\nSEO " })),
    products: [published("cup", { name: "Cup", excerpt: "", description: "Product fallback" }), published("draft", { status: "draft" }), published("deleted", { deleted_at: "2026-01-01" })],
    offerings: [published("workshop", { type: "workshop" })],
    landing_pages: [published("landing", { hero_subtitle: "Hero fallback", intro_text: "Intro" })],
  });
  const peers = await module.getPublishedSeoPeers();
  assert.equal(peers.length, 8);
  assert.deepEqual(queries.filter((query) => query.table === "blog_posts").map((query) => query.offset), [0, 2, 4]);
  assert.equal(peers[0].title, " <b>Raw</b> ");
  assert.equal(peers[0].description, " Raw\nSEO ");
  assert.equal(peers.find((peer) => peer.id === "cup")?.path, "/tienda/cup");
  assert.equal(peers.find((peer) => peer.id === "cup")?.fallbackDescription, "Product fallback");
  assert.equal(peers.find((peer) => peer.id === "cup")?.fallbackTitle, "Cup | Casa Rosier");
  assert.equal(peers.find((peer) => peer.id === "workshop")?.path, "/talleres/workshop");
  assert.equal(peers.find((peer) => peer.id === "landing")?.fallbackDescription, "Hero fallback");
});

test("published peers exclude expired, missing and invalid active expirations", async () => {
  const { module } = reviewFixture({ offerings: [
    published("expired", { expiration_enabled: true, expires_at: "2000-01-01" }),
    published("missing", { expiration_enabled: true }),
    published("invalid", { expiration_enabled: true, expires_at: "invalid" }),
    published("future", { expiration_enabled: true, expires_at: "2999-01-01" }),
    published("disabled", { expiration_enabled: false, expires_at: "2000-01-01" }),
  ] });
  assert.deepEqual((await module.getPublishedSeoPeers()).map((peer) => peer.id), ["future", "disabled"]);
});

test("published peer failures and incomplete counts never become a verified empty list", async () => {
  await assert.rejects(reviewFixture({}, "products").module.getPublishedSeoPeers(), /products/);
  await assert.rejects(reviewFixture({ blog_posts: [published("post")] }, undefined, true).module.getPublishedSeoPeers(), /incompleto/);
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  try {
    await assert.rejects(reviewFixture().module.getPublishedSeoPeers(), /acceso administrativo/);
  } finally {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-service-role";
  }
});

test("save warnings retain local issues when duplicate verification fails", async () => {
  const { module } = reviewFixture({}, "products");
  const item = { id: "post", title: "Fallback", excerpt: "Fallback description", seo_title: "<b>Raw</b>", seo_description: "x".repeat(200) };
  const warnings = await module.getSeoContentWarnings("blog_post", item);
  assert.deepEqual(warnings, [...seo.getSeoWarnings({
    id: item.id, kind: "blog_post", title: item.seo_title, description: item.seo_description,
    fallbackTitle: item.title, fallbackDescription: item.excerpt,
  }), module.SEO_DUPLICATES_UNVERIFIED]);
});

test("save warnings include published duplicate peers but exclude the item itself", async () => {
  const { module } = reviewFixture({ blog_posts: [published("one", { seo_title: "Same", seo_description: "Same description" }), published("two", { seo_title: "Same", seo_description: "Same description" })] });
  const warnings = await module.getSeoContentWarnings("blog_post", { id: "one", seo_title: "Same", seo_description: "Same description" });
  assert.ok(warnings.some((warning) => warning.includes("/blog/two")));
  assert.ok(warnings.every((warning) => !warning.includes("/blog/one")));
});

const normalizers = [
  { file: "blog", name: "normalizePost" },
  { file: "products", name: "normalizeProduct" },
  { file: "offerings", name: "normalizeOffering" },
  { file: "landing-pages", name: "normalize" },
];
for (const { file, name } of normalizers) {
  test(`${file} validates SEO before normalization and preserves persisted raw text`, () => {
    const cms = loadModule<{ normalizeForTest(input: Row, existing?: Row): Row }>(`lib/cms/${file}.ts`, {
      "../seo/content": seo, "./types": types,
      "../supabase/admin": {}, "./trash": {}, "./local-storage": {}, "./history-logs": {},
      "./hero-settings": { normalizeHeroSettings: () => ({}) },
      "./offering-media": {}, "./rich-text-typography": {}, "./offering-duplication": {},
    }, `\nexport { ${name} as normalizeForTest };`);
    const valid = { title: "Title", name: "Product", type: "class", seo_title: "  <b>Raw title</b>\n ", seo_description: "  Raw\n description  " };
    const result = cms.normalizeForTest(valid);
    assert.equal(result.seo_title, valid.seo_title);
    assert.equal(result.seo_description, valid.seo_description);
    assert.equal(cms.normalizeForTest({ ...valid, seo_title: "x".repeat(500) }).seo_title, "x".repeat(500));
    assert.equal(cms.normalizeForTest({ ...valid, seo_title: undefined }, { ...result, seo_title: "Existing" }).seo_title, "Existing");
    const retained = cms.normalizeForTest({ ...valid, seo_title: null, seo_description: null }, result);
    assert.equal(retained.seo_title, result.seo_title);
    assert.equal(retained.seo_description, result.seo_description);
    for (const invalid of [42, false, [], {}]) {
      assert.throws(() => cms.normalizeForTest({ ...valid, seo_title: invalid }));
      assert.throws(() => cms.normalizeForTest({ ...valid, seo_description: invalid }));
    }
    assert.throws(() => cms.normalizeForTest({ ...valid, seo_description: "x".repeat(50_001) }));
  });
}

test("global SEO retains structural validation without editorial hard limits or trimming", () => {
  const title = ` <b>${"x".repeat(500)}</b> `;
  const description = ` ${"x".repeat(3_000)}\n `;
  const result = validateSettingsPayload({ seo: { default_seo_title: title, default_seo_description: description } });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.seo?.default_seo_title, title);
    assert.equal(result.value.seo?.default_seo_description, description);
  }
  assert.equal(validateSettingsPayload({ seo: { default_seo_title: 42 } }).ok, false);
  assert.equal(validateSettingsPayload({ seo: { default_seo_title: "x".repeat(50_001) } }).ok, false);
});

test("offering saves reject invalid SEO before any seed-capable reads", async () => {
  let reads = 0;
  const offerings = loadModule<{
    createOffering(input: Row): Promise<unknown>;
    updateOffering(id: string, input: Row): Promise<unknown>;
  }>("lib/cms/offerings.ts", {
    "../seo/content": seo, "./types": types,
    "../supabase/admin": { createAdminClient: () => { reads++; assert.fail("Unexpected database access"); } },
    "./trash": {}, "./local-storage": { readJsonFile: () => { reads++; assert.fail("Unexpected seed-capable read"); } },
    "./history-logs": {}, "./offering-media": {}, "./rich-text-typography": {}, "./offering-duplication": {},
  });
  await assert.rejects(offerings.createOffering({ title: "Title", type: "class", seo_title: 42 }));
  await assert.rejects(offerings.updateOffering("one", { seo_description: [] }));
  assert.equal(reads, 0);
});

test("review API authenticates, returns no-store peers and exposes unverified reads as 503", async () => {
  let authorized = false;
  let failed = false;
  const route = loadModule<{ GET(): Promise<Response> }>("app/api/admin/seo-review/route.ts", {
    "@/lib/auth/supabase-auth": { requireAdminApi: async () => authorized },
    "@/lib/cms/settings": { getSettings: async () => DEFAULT_SETTINGS },
    "@/lib/cms/seo-review": { getPublishedSeoPeers: async () => {
      if (failed) throw new Error("private DB error");
      return [];
    } },
    "next/server": { NextResponse: Response },
  });
  assert.equal((await route.GET()).status, 401);
  authorized = true;
  const success = await route.GET();
  assert.equal(success.headers.get("cache-control"), "no-store");
  assert.deepEqual(await success.json(), { peers: [], site: { siteName: "Casa Rosier", defaultSeoDescription: "" } });
  failed = true;
  const failure = await route.GET();
  assert.equal(failure.status, 503);
  assert.equal(failure.headers.get("cache-control"), "no-store");
  assert.match((await failure.json()).error, /No se pudo verificar/);
});

function auditFixture(peers: SeoPeer[], rows: Record<string, Row[]>, settings = DEFAULT_SETTINGS) {
  const inserted: Row[] = [];
  const marketing = loadModule<{ runSeoAudit(): Promise<{ count: number }> }>("lib/cms/marketing.ts", {
    "../seo/content": seo, "./types": types,
    "./seo-review": { getPublishedSeoPeers: async () => peers },
    "./settings": { getSettings: async () => settings }, "./local-storage": { writeJsonFile: async () => assert.fail("Unexpected fallback write") },
    "./settings-types": {},
    "../supabase/admin": { createAdminClient: () => ({ from: (table: string) => {
      const query = {
        select: () => query,
        in: () => query,
        eq: () => query,
        is: async () => ({ data: rows[table] ?? [], count: rows[table]?.length ?? 0, error: null }),
        delete: () => query,
        neq: async () => ({ error: null }),
        insert: async (rows: Row[]) => { inserted.push(...rows); return { error: null }; },
      };
      return query;
    } }) },
  });
  return { marketing, inserted };
}

test("audit combines raw SEO warnings and published duplicates with resolved effective text", async () => {
  const peers: SeoPeer[] = [
    { id: "one", kind: "blog_post", label: "One", path: "/blog/one", title: "<b>Same</b>", description: "x".repeat(200), fallbackTitle: "One" },
    { id: "two", kind: "product", label: "Two", path: "/tienda/two", title: "Same", description: "x".repeat(200), fallbackTitle: "Two" },
  ];
  const { marketing, inserted } = auditFixture(peers, {
    blog_posts: [{ id: "one", slug: "one", seo_image: "/og.jpg" }],
    products: [{ id: "two", slug: "two", seo_image: "/og.jpg" }],
  });
  assert.equal((await marketing.runSeoAudit()).count, 2);
  for (const row of inserted) {
    const peer = peers.find((item) => item.path === row.page_url)!;
    const effective = seo.resolveSeoText(peer);
    assert.equal(row.meta_title, effective.title);
    assert.equal(row.meta_description, effective.description);
    assert.equal(row.seo_status, "review");
    for (const warning of seo.getSeoWarnings(peer, peers)) assert.ok((row.issues as string[]).includes(warning));
  }
});

test("audit OG priorities match public mappers and offerings cannot use gallery-only images", async () => {
  const peers: SeoPeer[] = [
    { id: "blog", kind: "blog_post", label: "Blog", path: "/blog/blog", title: "Blog title", description: "Blog description" },
    { id: "product", kind: "product", label: "Product", path: "/shop/product", title: "Product title", description: "Product description" },
    { id: "offering", kind: "offering", label: "Offering", path: "/clases/offering", title: "Offering title", description: "Offering description" },
  ];
  const { marketing, inserted } = auditFixture(peers, {
    blog_posts: [{ id: "blog", slug: "blog", featured_image_id: "/featured.jpg", seo_image: "/blog-seo.jpg" }],
    products: [{ id: "product", slug: "product", main_image_id: "/main.jpg", seo_image: "/product-seo.jpg", gallery: ["/gallery.jpg"] }],
    offerings: [{ id: "offering", slug: "offering", type: "class", gallery: ["/offering-gallery.jpg"] }],
  });
  await marketing.runSeoAudit();
  assert.equal(inserted.find((row) => row.page_url === "/blog/blog")?.og_image, "/featured.jpg");
  assert.equal(inserted.find((row) => row.page_url === "/shop/product")?.og_image, "/main.jpg");
  const offering = inserted.find((row) => row.page_url === "/clases/offering")!;
  assert.equal(offering.og_image, "");
  assert.equal(offering.has_og_image, false);
  assert.notEqual(offering.seo_status, "ok");
  assert.ok((offering.issues as string[]).includes("Falta imagen OG"));
});

for (const condition of ["noindex", "maintenance"] as const) {
  test(`audit does not mark globally ${condition} content as indexable or OK`, async () => {
    const peers: SeoPeer[] = [{ id: "blog", kind: "blog_post", label: "Blog", path: "/blog/blog", title: "Blog title", description: "Blog description" }];
    const { marketing, inserted } = auditFixture(peers, {
      blog_posts: [{ id: "blog", slug: "blog", featured_image_id: "/featured.jpg" }],
    }, {
      ...DEFAULT_SETTINGS,
      seo: { ...DEFAULT_SETTINGS.seo, robots_index: condition !== "noindex" },
      system: { ...DEFAULT_SETTINGS.system, maintenance_mode: condition === "maintenance" },
    });
    await marketing.runSeoAudit();
    assert.equal(inserted[0].is_indexable, false);
    assert.equal(inserted[0].seo_status, "pending");
    assert.ok((inserted[0].issues as string[]).some((issue) => issue.includes("no es indexable")));
  });
}

test("an unverified audit fails before deleting or replacing the previous audit", async () => {
  const marketing = loadModule<{ runSeoAudit(): Promise<unknown> }>("lib/cms/marketing.ts", {
    "../seo/content": seo, "./types": types,
    "./seo-review": { getPublishedSeoPeers: async () => { throw new Error("Unverified published peers"); } },
    "./settings": {}, "./local-storage": {},
    "../supabase/admin": { createAdminClient: () => assert.fail("Unexpected audit write") },
  });
  await assert.rejects(marketing.runSeoAudit(), /Unverified published peers/);
});
