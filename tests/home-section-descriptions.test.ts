import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { test } from "node:test";
import { createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { chromium } from "playwright-core";
import { compile } from "tailwindcss";
import ts from "typescript";
import type { ExperienceItem } from "../src/data/types.ts";
import type { HomePageSettings } from "../src/lib/cms/types.ts";
import type { HomePageSaveResult } from "../src/lib/admin/home-page-actions.ts";

const require = createRequire(import.meta.url);
const mockRoot = "C:/mock-home";
const mockFile = path.join(mockRoot, "data", "home-page-settings.json");

// Only source reads are real; evaluated modules receive isolated env, DB and filesystem stubs.
function loadModule<T>(file: string, dependencies: Record<string, unknown>, localMode?: string): T {
  const compiled = ts.transpileModule(readFileSync(new URL(`../src/${file}`, import.meta.url), "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    },
  }).outputText;
  const exports = {};
  new Function("require", "exports", "process", compiled)((name: string) => {
    if (Object.hasOwn(dependencies, name)) return dependencies[name];
    if (["path", "react/jsx-runtime"].includes(name)) return require(name);
    throw new Error(`Unmocked dependency: ${name}`);
  }, exports, { env: { CMS_USE_LOCAL_DATA: localMode }, cwd: () => mockRoot });
  return exports as T;
}

const hero = {
  defaultHeroSettings: { heroTitle: "", heroSubtitle: "" },
  normalizeHeroSettings: (input: unknown, fallback: object = {}) => ({ ...fallback, ...(input as object) }),
};
type Row = Record<string, unknown>;

function cmsFixture(initial: Row = {}, localMode?: string, failure?: Error) {
  let row = initial;
  let file = JSON.stringify(initial);
  const fileCalls: string[] = [];
  const upserts: Row[] = [];
  let databaseCalls = 0;
  const cms = loadModule<typeof import("../src/lib/cms/home-page.ts")>("lib/cms/home-page.ts", {
    react: { cache: (callback: unknown) => callback },
    "./hero-settings": hero,
    fs: { promises: {
      readFile: async (filename: string, encoding: string) => {
        fileCalls.push("readFile");
        assert.equal(localMode, "true", "Unexpected remote filesystem read");
        assert.equal(filename, mockFile);
        assert.equal(encoding, "utf8");
        return file;
      },
      mkdir: async (directory: string, options: unknown) => {
        fileCalls.push("mkdir");
        assert.equal(localMode, "true", "Unexpected remote filesystem mkdir");
        assert.equal(directory, path.dirname(mockFile));
        assert.deepEqual(options, { recursive: true });
      },
      writeFile: async (filename: string, contents: string, encoding: string) => {
        fileCalls.push("writeFile");
        assert.equal(localMode, "true", "Unexpected remote filesystem write");
        assert.equal(filename, mockFile);
        assert.equal(encoding, "utf8");
        file = contents;
      },
    } },
    "../supabase/admin": { createAdminClient: () => {
      databaseCalls++;
      assert.notEqual(localMode, "true", "Unexpected local database access");
      return { from: (table: string) => {
        assert.equal(table, "home_page_settings");
        const query = {
          select: (columns: string) => { assert.equal(columns, "*"); return query; },
          eq: (column: string, id: string) => { assert.equal(column, "id"); assert.equal(id, "home-page"); return query; },
          maybeSingle: async () => ({ data: row, error: null }),
          upsert: async (next: Row, options: unknown) => {
            assert.deepEqual(options, { onConflict: "id" });
            upserts.push(next);
            if (failure) return { error: failure };
            row = next;
            return { error: null };
          },
        };
        return query;
      } };
    } },
  }, localMode);
  return { cms, upserts, fileCalls, get file() { return JSON.parse(file) as Row; }, get databaseCalls() { return databaseCalls; } };
}

const descriptions = {
  classesDescription: '  <b>Hands & clay</b>\n<script>alert("x")</script>\nLast line  ',
  workshopsDescription: "  Specialization\nSecond workshop line  ",
};
const emptyDescriptions = { classesDescription: "", workshopsDescription: "" };

test("defaults and legacy rows provide empty descriptions without changing gift settings", async () => {
  const { cms, fileCalls } = cmsFixture({ classes_title: "Classes", workshops_subtitle: "Workshops", gift_title: "Gift title", gift_featured_ids: ["gift-1"] });
  for (const settings of [cms.defaultHomePageSettings, await cms.getHomePageSettings()]) {
    assert.equal(settings.classesDescription, "");
    assert.equal(settings.workshopsDescription, "");
  }
  const legacy = await cms.getHomePageSettings();
  assert.equal(legacy.classesTitle, "Classes");
  assert.equal(legacy.workshopsSubtitle, "Workshops");
  assert.equal(legacy.giftTitle, "Gift title");
  assert.deepEqual(legacy.giftFeaturedIds, ["gift-1"]);
  assert.deepEqual(fileCalls, []);
});

test("camelCase and SQL aliases preserve raw text, with camelCase and explicit empty values taking precedence", async () => {
  const snake = { classes_description: descriptions.classesDescription, workshops_description: descriptions.workshopsDescription };
  const cases: Array<[Row, typeof descriptions]> = [
    [descriptions, descriptions], [snake, descriptions],
    [{ ...snake, classesDescription: "Camel classes", workshopsDescription: "Camel workshops" }, { classesDescription: "Camel classes", workshopsDescription: "Camel workshops" }],
    [{ ...snake, ...emptyDescriptions }, emptyDescriptions],
    [{ classes_description: null, workshopsDescription: null }, emptyDescriptions],
  ];
  for (const [row, expected] of cases) {
    const { cms, fileCalls } = cmsFixture(row);
    const settings = await cms.getHomePageSettings();
    assert.equal(settings.classesDescription, expected.classesDescription);
    assert.equal(settings.workshopsDescription, expected.workshopsDescription);
    assert.deepEqual(fileCalls, []);
  }
});

test("remote saves round-trip both descriptions and empty deletions through SQL columns", async () => {
  const { cms, upserts, fileCalls } = cmsFixture({ gift_title: "Gift title", gift_featured_ids: ["gift-1"] });
  for (const values of [descriptions, emptyDescriptions]) {
    const saved = await cms.updateHomePageSettings({ ...await cms.getHomePageSettings(), ...values });
    const persisted = upserts.at(-1)!;
    assert.equal(persisted.classes_description, values.classesDescription);
    assert.equal(persisted.workshops_description, values.workshopsDescription);
    assert.equal(Object.hasOwn(persisted, "classesDescription"), false);
    assert.equal(Object.hasOwn(persisted, "workshopsDescription"), false);
    assert.deepEqual(await cms.getHomePageSettings(), saved);
    assert.equal(saved.giftTitle, "Gift title");
    assert.deepEqual(saved.giftFeaturedIds, ["gift-1"]);
  }
  assert.equal(upserts.length, 2);
  assert.deepEqual(fileCalls, []);
});

test("database save errors reject unchanged and never fall back to filesystem writes", async () => {
  for (const localMode of [undefined, "false", "TRUE"]) {
    const failure = new Error("Mock database failure");
    const { cms, fileCalls, upserts } = cmsFixture(descriptions, localMode, failure);
    await assert.rejects(cms.updateHomePageSettings(emptyDescriptions), (error) => error === failure);
    assert.equal(upserts.length, 1);
    assert.equal((await cms.getHomePageSettings()).classesDescription, descriptions.classesDescription);
    assert.equal((await cms.getHomePageSettings()).workshopsDescription, descriptions.workshopsDescription);
    assert.deepEqual(fileCalls, []);
  }
});

test("explicit local mode reads legacy mock JSON and round-trips text and deletions without a database", async () => {
  const fixture = cmsFixture({ gift_title: "Local gift" }, "true");
  assert.equal((await fixture.cms.getHomePageSettings()).classesDescription, "");
  assert.equal((await fixture.cms.getHomePageSettings()).workshopsDescription, "");
  for (const values of [descriptions, emptyDescriptions]) {
    const saved = await fixture.cms.updateHomePageSettings({ ...await fixture.cms.getHomePageSettings(), ...values });
    assert.equal(fixture.file.classesDescription, values.classesDescription);
    assert.equal(fixture.file.workshopsDescription, values.workshopsDescription);
    assert.deepEqual(await fixture.cms.getHomePageSettings(), saved);
    assert.equal(saved.giftTitle, "Local gift");
  }
  assert.equal(fixture.fileCalls.filter((call) => call === "writeFile").length, 2);
  assert.equal(fixture.fileCalls.filter((call) => call === "mkdir").length, 2);
  assert.equal(fixture.databaseCalls, 0);
  assert.deepEqual(fixture.upserts, []);
});

const { HomeSection } = loadModule<typeof import("../src/components/home/HomeSection.tsx")>("components/home/HomeSection.tsx", {
  "@/lib/utils": { classNames: (...values: unknown[]) => values.filter(Boolean).join(" ") },
});
const { FeaturedSection } = loadModule<typeof import("../src/components/home/FeaturedSection.tsx")>("components/home/FeaturedSection.tsx", {
  "@/components/home/HomeSection": { HomeSection },
  "@/components/home/FeaturedExperienceCards": { FeaturedExperienceCards: ({ items }: { items: readonly ExperienceItem[] }) => createElement("article", { "data-cards": "featured" }, items.map((item) => item.id).join(",")) },
});
const { HomeGiftCardSection } = loadModule<typeof import("../src/features/home/HomeGiftCardSection.tsx")>("features/home/HomeGiftCardSection.tsx", {
  "@/components/home/HomeSection": { HomeSection },
  "@/components/home/GiftCarousel": { GiftCarousel: () => createElement("div", { "data-carousel": "gift" }) },
});
// Card contents are stubbed; only selection and section wiring are under test.
const items = [{ id: "class-1", kind: "class" }, { id: "workshop-1", kind: "workshop" }] as ExperienceItem[];

test("featured descriptions render after subtitles and before cards as escaped multiline plain text", () => {
  for (const variant of ["classes", "workshops"]) {
    const markup = renderToStaticMarkup(createElement(FeaturedSection, { id: variant, title: "Section title", subtitle: "Section subtitle", description: descriptions.classesDescription, items, variant }));
    const paragraphs = Array.from(markup.matchAll(/<p class="home-section__description ([^"]*)">([\s\S]*?)<\/p>/g));
    assert.equal(paragraphs.length, 1);
    assert.match(paragraphs[0][1], /\bwhitespace-pre-line\b/);
    assert.equal(paragraphs[0][2], "&lt;b&gt;Hands &amp; clay&lt;/b&gt;\n&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;\nLast line");
    assert.doesNotMatch(markup, /<script\b|<b\b|<br\b/);
    const positions = ["Section title", "Section subtitle", "home-section__description", "</header>", 'data-cards="featured"'].map((text) => markup.indexOf(text));
    assert.ok(positions.every((position, index) => position >= 0 && (index === 0 || position > positions[index - 1])));
    assert.match(markup, />class-1,workshop-1<\/article>/);
  }
});

test("missing, empty and whitespace-only descriptions omit the paragraph without removing cards", () => {
  for (const description of [undefined, "", " \t\n "]) {
    const markup = renderToStaticMarkup(createElement(FeaturedSection, { id: "classes", title: "Title", subtitle: "Subtitle", description, items }));
    assert.doesNotMatch(markup, /home-section__description/);
    assert.match(markup, /Subtitle<\/p><\/header><div\b/);
    assert.match(markup, /data-cards="featured"/);
  }
  const withoutSubtitle = renderToStaticMarkup(HomeSection({ title: "Title", description: "Description only", children: "Cards" }));
  assert.match(withoutSubtitle, /<\/h2><p class="home-section__description/);
});

test("gift sections keep their title, subtitle and unwrapped carousel without a description", () => {
  const view = HomeGiftCardSection({ items: [], title: "Gift title", subtitle: "Gift subtitle" });
  assert.equal(view.props.block, "gift");
  assert.equal(view.props.withGrid, false);
  assert.equal(view.props.description, undefined);
  const markup = renderToStaticMarkup(view);
  assert.match(markup, /id="gift-card"/);
  assert.match(markup, /Gift title<\/h2><p\b[^>]*>Gift subtitle<\/p><\/header><div data-carousel="gift"><\/div>/);
  assert.doesNotMatch(markup, /home-section__description|grid-cols/);
});

const edgePath = process.env.EDGE_PATH || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";

test("featured descriptions preserve line breaks and stay between subtitles and cards without responsive overflow", { skip: !existsSync(edgePath) }, async () => {
  const markup = ["classes", "workshops"].map((variant) => renderToStaticMarkup(createElement(FeaturedSection, {
    id: variant, title: "Section title", subtitle: "Section subtitle",
    description: `First explanatory line\nSecond explanatory line ${"longword".repeat(30)}`,
    items, variant,
  }))).join("");
  const candidates = Array.from(markup.matchAll(/class="([^"]*)"/g)).flatMap((match) => match[1].split(/\s+/));
  const css = (await compile("@theme { --spacing: 0.25rem; } @tailwind utilities;")).build(candidates);
  const browser = await chromium.launch({ executablePath: edgePath, headless: true });
  try {
    const page = await browser.newPage();
    await page.route("**/*", (route) => route.abort());
    for (const width of [320, 360, 390, 640, 641, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.setContent(`<style>${css} body{margin:0} .container{width:min(980px,calc(100% - 32px));margin:auto}</style>${markup}`);
      for (const variant of ["classes", "workshops"]) {
        const section = page.locator(`#${variant}`);
        const description = section.locator(".home-section__description");
        const subtitle = await section.locator("header > p").first().boundingBox();
        const paragraph = await description.boundingBox();
        const cards = await section.locator("[data-cards]").boundingBox();
        assert.ok(subtitle && paragraph && cards);
        assert.ok(subtitle.y + subtitle.height <= paragraph.y, `Text precedes subtitle at ${width}px`);
        assert.ok(paragraph.y + paragraph.height <= cards.y, `Text overlaps cards at ${width}px`);
        assert.ok(paragraph.x >= 15 && paragraph.x + paragraph.width <= width - 15);
        assert.ok(paragraph.width <= 681);
        const style = await description.evaluate((element) => {
          const computed = getComputedStyle(element);
          return { whiteSpace: computed.whiteSpace, overflowWrap: computed.overflowWrap, textTransform: computed.textTransform, lineHeight: Number.parseFloat(computed.lineHeight) };
        });
        assert.equal(style.whiteSpace, "pre-line");
        assert.equal(style.overflowWrap, "break-word");
        assert.equal(style.textTransform, "none");
        assert.ok(paragraph.height >= style.lineHeight * 2 - 1);
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, `Overflow at ${width}px`);
    }
  } finally {
    await browser.close();
  }
});

type ElementProps = {
  children?: ReactNode; name?: string; value?: string; className?: string; id?: string;
  description?: string; disabled?: boolean; readOnly?: boolean;
  onClick?: () => void | Promise<void>;
  onChange?: (event: { target: { value: string } }) => void;
};

// Expand only the editor's pure children; no DOM, effects or external React test framework.
function elements(node: ReactNode): ReactElement<ElementProps>[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!isValidElement<ElementProps>(node)) return [];
  const children = typeof node.type === "function" ? (node.type as (props: ElementProps) => ReactNode)(node.props) : node.props.children;
  return [node, ...elements(children)];
}

test("editor fields track dirty state, preview, save payload, failed saves and restored server results", async () => {
  const slots: unknown[] = [];
  let cursor = 0;
  const payloads: Partial<HomePageSettings>[] = [];
  let result: HomePageSaveResult = { ok: false, error: "Mock save failure" };
  const { default: Editor } = loadModule<typeof import("../src/components/admin/HomePageEditor.tsx")>("components/admin/HomePageEditor.tsx", {
    react: {
      useState: <T,>(initial: T | (() => T)) => {
        const index = cursor++;
        if (!Object.hasOwn(slots, index)) slots[index] = typeof initial === "function" ? (initial as () => T)() : initial;
        return [slots[index], (next: T | ((previous: T) => T)) => { slots[index] = typeof next === "function" ? (next as (previous: T) => T)(slots[index] as T) : next; }];
      },
      useMemo: (compute: () => unknown, deps: unknown[]) => {
        const index = cursor++;
        const previous = slots[index] as { deps: unknown[]; value: unknown } | undefined;
        if (!previous || deps.length !== previous.deps.length || deps.some((value, i) => !Object.is(value, previous.deps[i]))) slots[index] = { deps: [...deps], value: compute() };
        return (slots[index] as { value: unknown }).value;
      },
    },
    "@/components/home/FeaturedSection": { FeaturedSection },
    "@/components/home/IntroSlider": { IntroSlider: () => null },
    "@/components/layout/HomeHeroView": { HomeHeroView: () => null },
    "@/features/home/HomeGiftCardSection": { HomeGiftCardSection },
    "@/lib/cms/hero-settings": hero,
    "@/lib/admin/home-page-actions": { saveHomePageSettingsAction: async (payload: Partial<HomePageSettings>) => { payloads.push(payload); return result; } },
    "@/lib/assets": { assetPath: (value: string) => value },
    "./AdminActionModal": { __esModule: true, default: () => null },
    "./MediaSelectField": { __esModule: true, default: () => null },
    "./SharedHeroEditor": { __esModule: true, default: () => null },
  });
  const page = { ...cmsFixture().cms.defaultHomePageSettings, classesDescription: "Original classes", workshopsDescription: "Original workshops", classesFeaturedIds: ["class-1"], workshopsFeaturedIds: ["workshop-1"] };
  const props = {
    page, featuredItems: items, giftCards: [], navigationItems: [],
    previewMenu: { headerLogoUrl: "", scrollMenuBackgroundColor: "", scrollMenuTextColor: "", scrollMenuIconColor: "", scrollMenuLogoTintEnabled: false, scrollMenuLogoTintColor: "" },
  };
  const view = () => { cursor = 0; return elements(Editor(props)); };
  const find = (predicate: (element: ReactElement<ElementProps>) => boolean) => {
    const element = view().find(predicate);
    assert.ok(element, "Expected editor element");
    return element;
  };
  const button = (label: string) => find((element) => element.type === "button" && element.props.children === label);
  const field = (name: string) => find((element) => element.type === "textarea" && element.props.name === name);
  const dirty = () => find((element) => element.props.className === "admin-sticky-actionbar__meta").props.children;

  assert.equal(dirty(), "Cambios al dia");
  button("Destacados en Home").props.onClick!();
  assert.equal(view().filter((element) => element.type === "textarea").length, 2);
  for (const name of ["classesDescription", "workshopsDescription"] as const) {
    assert.equal(field(name).props.value, page[name]);
    assert.ok(!field(name).props.disabled && !field(name).props.readOnly);
    field(name).props.onChange!({ target: { value: descriptions[name] } });
    assert.equal(dirty(), "Cambios sin guardar");
    field(name).props.onChange!({ target: { value: page[name] } });
    assert.equal(dirty(), "Cambios al dia");
  }
  for (const name of ["classesDescription", "workshopsDescription"] as const) field(name).props.onChange!({ target: { value: descriptions[name] } });
  button("Vista previa").props.onClick!();
  for (const [id, description] of [["clases-destacadas", descriptions.classesDescription], ["workshops-destacados", descriptions.workshopsDescription]]) {
    assert.equal(find((element) => element.type === FeaturedSection && element.props.id === id).props.description, description);
  }
  button("Destacados en Home").props.onClick!();
  await button("Publicar").props.onClick!();
  assert.equal(payloads[0].classesDescription, descriptions.classesDescription);
  assert.equal(payloads[0].workshopsDescription, descriptions.workshopsDescription);
  assert.equal(dirty(), "Cambios sin guardar");
  for (const name of ["classesDescription", "workshopsDescription"] as const) assert.equal(field(name).props.value, descriptions[name]);

  const restored = { classesDescription: "Server classes\nRestored", workshopsDescription: "Server workshops\nRestored" };
  result = { ok: true, page: { ...page, ...restored } };
  await button("Publicar").props.onClick!();
  assert.equal(dirty(), "Cambios al dia");
  for (const name of ["classesDescription", "workshopsDescription"] as const) {
    assert.equal(field(name).props.value, restored[name]);
    field(name).props.onChange!({ target: { value: "" } });
  }
  assert.equal(dirty(), "Cambios sin guardar");
  result = { ok: true, page: { ...page, ...emptyDescriptions } };
  await button("Publicar").props.onClick!();
  assert.equal(payloads.at(-1)?.classesDescription, "");
  assert.equal(payloads.at(-1)?.workshopsDescription, "");
  assert.equal(dirty(), "Cambios al dia");
  button("Vista previa").props.onClick!();
  assert.equal(view().filter((element) => element.type === FeaturedSection).length, 2);
  assert.ok(view().every((element) => !element.props.className?.includes("home-section__description")));
});
