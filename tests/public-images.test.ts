import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ImageProps } from "next/image";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL("../", import.meta.url));
const primaryHost = "current-images.supabase.co";
const legacyHost = "moqjlaexfclzxuilzglg.supabase.co";
const legacyBucket = "/storage/v1/object/public/make-0ba58e95-uploads/";
const local = "/img/test-photo.jpg";
const primary = `https://${primaryHost}/storage/v1/object/public/photos/test.jpg?version=2&token=a%2Fb#crop`;
const legacy = `https://${legacyHost}${legacyBucket}test.jpg?version=2#crop`;
const foreign = "https://external.example/photo.jpg?token=a%2Fb&width=320#crop";
const shopGalleryPath = "src/features/shop/components/item-detail/ShopItemGalleryView.tsx";
const classGalleryPath = "src/features/classes/components/class-detail/ClassDetailGallery.tsx";

const { getImgProps } = require("next/dist/shared/lib/get-img-props") as typeof import("next/dist/shared/lib/get-img-props");
const { imageConfigDefault } = require("next/dist/shared/lib/image-config") as typeof import("next/dist/shared/lib/image-config");
const defaultLoader = require("next/dist/shared/lib/image-loader").default;
const modules = new Map<string, Record<string, unknown>>();
const allowedFiles = new Set([
  "next.config.ts", "src/lib/assets.ts", "src/lib/image-config.ts", "src/lib/public-image.ts",
  "src/lib/image-fallback.ts", "src/lib/utils.ts", "src/lib/seo/site-timezone.ts", "src/lib/vimeo.ts",
  "src/lib/cms/shop-product-presentation.ts", "src/components/ui/MarkdownContent.tsx",
  "src/components/layout/header-interno/buildHeaderInternoStyle.ts",
  "src/features/shop/lib/shopLabels.ts", "src/features/shop/components/catalog/ShopProductBadgeLabel.tsx",
  "src/features/shop/components/item-detail/ShopItemGalleryModal.tsx", shopGalleryPath,
  "src/features/classes/hooks/useClassDetailGallery.ts", "src/features/classes/lib/offeringVideoEmbed.ts",
  "src/features/classes/components/class-detail/ClassDetailGalleryModal.tsx", classGalleryPath,
].map((path) => resolve(root, path)));

// Transpile only pure image/UI modules. No CMS, router, DB, .env or network access.
function load<T>(path: string): T {
  const filename = resolve(root, path);
  assert.ok(allowedFiles.has(filename), `Unexpected source dependency: ${filename}`);
  if (modules.has(filename)) return modules.get(filename) as T;
  const compiled = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    },
  }).outputText;
  const exports: Record<string, unknown> = {};
  modules.set(filename, exports);
  new Function("require", "exports", "process", "document", compiled)((name: string) => {
    if (["react", "react/jsx-runtime"].includes(name)) return require(name);
    if (name === "next/image") return { __esModule: true, default: NextImage, getImageProps };
    // SSR skips effects; flatten only the portal boundary, preserving the real modal tree.
    if (name === "react-dom") return { createPortal: (children: ReactNode) => children };
    const base = name.startsWith("@/") ? resolve(root, "src", name.slice(2))
      : name.startsWith(".") ? resolve(dirname(filename), name) : "";
    const dependency = [base, `${base}.ts`, `${base}.tsx`].find((candidate) => allowedFiles.has(candidate) && existsSync(candidate));
    if (dependency) return load(dependency);
    throw new Error(`Unexpected UI dependency: ${name}`);
  }, exports, { env: { NEXT_PUBLIC_SUPABASE_URL: `https://${primaryHost}` } }, { body: {} });
  return exports as T;
}

const { imageRemotePatterns } = load<typeof import("../src/lib/image-config.ts")>("src/lib/image-config.ts");
const nextConfig = load<{ default: import("next").NextConfig }>("next.config.ts").default;
const imgConf = { ...imageConfigDefault, ...nextConfig.images, remotePatterns: imageRemotePatterns };

// Use Next's real candidate generation and loader, not the unbundled next/image config.
function getImageProps(props: ImageProps) {
  return getImgProps(props, { imgConf, defaultLoader });
}

function NextImage(props: ImageProps) {
  return createElement("img", getImageProps(props).props);
}

const { assetPath } = load<typeof import("../src/lib/assets.ts")>("src/lib/assets.ts");
const { getPublicImageProps } = load<typeof import("../src/lib/public-image.ts")>("src/lib/public-image.ts");
const { applyImageFallback, DEFAULT_IMAGE_FALLBACK } = load<typeof import("../src/lib/image-fallback.ts")>("src/lib/image-fallback.ts");
const { buildHeaderInternoStyle } = load<typeof import("../src/components/layout/header-interno/buildHeaderInternoStyle.ts")>("src/components/layout/header-interno/buildHeaderInternoStyle.ts");
const { MarkdownContent } = load<typeof import("../src/components/ui/MarkdownContent.tsx")>("src/components/ui/MarkdownContent.tsx");
const { ShopItemGalleryView } = load<typeof import("../src/features/shop/components/item-detail/ShopItemGalleryView.tsx")>(shopGalleryPath);
const { ClassDetailGallery } = load<typeof import("../src/features/classes/components/class-detail/ClassDetailGallery.tsx")>(classGalleryPath);
const { ShopItemGalleryModal } = load<typeof import("../src/features/shop/components/item-detail/ShopItemGalleryModal.tsx")>("src/features/shop/components/item-detail/ShopItemGalleryModal.tsx");
const { ClassDetailGalleryModal } = load<typeof import("../src/features/classes/components/class-detail/ClassDetailGalleryModal.tsx")>("src/features/classes/components/class-detail/ClassDetailGalleryModal.tsx");

function images(markup: string): Record<string, string>[] {
  return Array.from(markup.matchAll(/<img\b([^>]*)>/g), ([, attributes]) =>
    Object.fromEntries(Array.from(attributes.matchAll(/([\w-]+)="([^"]*)"/g), ([, key, value]) =>
      [key.toLowerCase(), value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;/g, "'")])));
}

function assertOptimized(src: string, srcSet: string | undefined, original: string, quality = 85) {
  assert.ok(srcSet, `Missing srcset for ${original}`);
  for (const candidate of [src, ...srcSet.split(", ").map((entry) => entry.split(" ")[0])]) {
    const url = new URL(candidate, "https://site.example");
    assert.equal(url.pathname, "/_next/image");
    assert.equal(url.searchParams.get("url"), original);
    assert.equal(url.searchParams.get("q"), String(quality));
    assert.ok(Number(url.searchParams.get("w")) > 0);
  }
}

test("assetPath preserves absolute URLs byte-for-byte, including query and fragment", () => {
  for (const source of [primary, legacy, foreign, "http://external.example:8080/a%20b.jpg?x=%2f#part", "//external.example/a.jpg?x=1#part"]) {
    assert.equal(assetPath(source), source);
  }
});

test("assetPath normalizes local paths, applies missing-asset fallbacks and preserves opaque sources", () => {
  for (const [source, expected] of [
    ["img/photo.jpg", "/img/photo.jpg"], ["./img/photo.jpg", "/img/photo.jpg"],
    ["/img/photo.jpg?version=2#crop", "/img/photo.jpg?version=2#crop"],
    ["img/clase-1.png", "/img/social-2.jpg"], ["img/clase-2.png", "/img/intro-e.jpg"],
    ["img/clase-3.png", "/img/social-3.jpg"],
    ["img/c0c8f2c3-1d13-4632-9fe8-1ad322e51abd.png", "/img/intro-e.jpg"],
    ["img/0429e735-6642-4339-8e1b-72bdade5c8ad.png", "/img/workshop-3.jpg"],
    ["img/5fd27c84-15dd-43ef-b039-2e8458a3f1a6.png", "/img/social-5.png"],
    ["data:image/png;base64,aGVsbG8=", "data:image/png;base64,aGVsbG8="],
    ["blob:https://site.example/image-id", "blob:https://site.example/image-id"], ["", ""],
  ]) assert.equal(assetPath(source), expected);
});

test("uppercase schemes remain exact through assetPath, public props and Markdown SSR", () => {
  for (const source of [primary, legacy, foreign].map((value) => value.replace(/^https:/, "HTTPS:"))) {
    assert.equal(assetPath(source), source);
    const props = getPublicImageProps({ src: source, alt: "Ceramics", width: 1600, height: 1600, sizes: "100vw", quality: 85 });
    const rendered = images(renderToStaticMarkup(createElement(MarkdownContent, { source: `![Ceramics](${source})` })));
    assert.equal(rendered.length, 1);
    assert.equal(rendered[0].alt, "Ceramics");
    assert.equal(rendered[0].width, undefined);
    assert.equal(rendered[0].height, undefined);
    if (source.startsWith(`HTTPS://${primaryHost}`) || source.startsWith(`HTTPS://${legacyHost}`)) {
      assertOptimized(props.src, props.srcSet, source);
      assertOptimized(rendered[0].src, rendered[0].srcset, source, 75);
    } else {
      assert.equal(props.src, source);
      assert.equal(props.srcSet, undefined);
      assert.equal(rendered[0].src, source);
      assert.equal(rendered[0].srcset, undefined);
    }
  }
  for (const source of ["DATA:image/png;base64,aGVsbG8=", "BLOB:https://site.example/image-id"]) {
    assert.equal(assetPath(source), source);
    const props = getPublicImageProps({ src: source, alt: "Opaque", width: 800, height: 600 });
    assert.equal(props.src, source);
    assert.equal(props.srcSet, undefined);
  }
});

test("SVG path detection ignores query and fragment and bypasses optimization case-insensitively", () => {
  for (const base of ["/img/logo", `https://${primaryHost}/storage/v1/object/public/photos/logo`, `https://${legacyHost}${legacyBucket}logo`]) {
    for (const suffix of [".svg#vista", ".SVG#vista", ".SVG?version=2#vista"]) {
      const source = `${base}${suffix}`;
      const props = getPublicImageProps({ src: source, alt: "Logo", width: 800, height: 600, sizes: "100vw" });
      assert.equal(props.src, source);
      assert.equal(props.srcSet, undefined);
      assert.equal(props.sizes, undefined);
      const style = buildHeaderInternoStyle({ image: source }) as Record<string, string>;
      assert.equal(style["--page-hero-image"], `url(${JSON.stringify(source)})`);
      assert.equal(style["--page-hero-image-mobile"], `url(${JSON.stringify(source)})`);
    }
  }
});

test("SVG-looking query parameters do not disable optimization of JPG paths", () => {
  for (const source of [
    "/img/photo.jpg?file=.svg", "/img/PHOTO.JPG?file=.SVG#vista",
    `https://${primaryHost}/storage/v1/object/public/photos/photo.jpg?file=.svg#vista`,
    `https://${legacyHost}${legacyBucket}photo.jpg?file=.svg`,
  ]) {
    const props = getPublicImageProps({ src: source, alt: "Ceramics", width: 800, height: 600, sizes: "100vw", quality: 85 });
    assertOptimized(props.src, props.srcSet, source);
  }
});

test("remote patterns honor the configured primary host and restrict the legacy bucket", () => {
  assert.deepEqual(imageRemotePatterns, [
    { protocol: "https", hostname: primaryHost, port: "", pathname: "/storage/v1/object/public/**" },
    { protocol: "https", hostname: legacyHost, port: "", pathname: `${legacyBucket}**` },
  ]);
  assert.deepEqual(nextConfig.images?.remotePatterns, imageRemotePatterns);
  assert.ok(nextConfig.images?.qualities?.includes(85));
});

test("public images route local/current/legacy sources through the real Next optimizer", () => {
  for (const [source, resolved] of [[local, local], ["img/clase-1.png", "/img/social-2.jpg"], [primary, primary], [legacy, legacy]]) {
    const props = getPublicImageProps({ src: source, alt: "Ceramics", width: 1000, height: 700, sizes: "100vw", quality: 85 });
    assertOptimized(props.src, props.srcSet, resolved);
    assert.equal(props.alt, "Ceramics");
    assert.equal(props.width, 1000);
    assert.equal(props.height, 700);
    assert.equal(props.sizes, "100vw");
  }
});

test("foreign and out-of-scope origins stay original without widening the legacy allowlist", () => {
  for (const source of [
    foreign, `https://${legacyHost}/storage/v1/object/public/other-bucket/photo.jpg`,
    `https://${legacyHost}/storage/v1/object/public/make-0ba58e95-uploads-evil/photo.jpg`,
    `https://${primaryHost}/storage/v1/object/sign/photos/photo.jpg?token=abc`,
    `http://${primaryHost}/storage/v1/object/public/photos/photo.jpg`,
    `https://${primaryHost}:8443/storage/v1/object/public/photos/photo.jpg`,
    `https://${primaryHost}.external.example/storage/v1/object/public/photos/photo.jpg`,
    "//external.example/photo.jpg", "data:image/png;base64,aGVsbG8=", "blob:https://site.example/image-id",
  ]) {
    const props = getPublicImageProps({ src: source, alt: "External", width: 800, height: 600, sizes: "100vw" });
    assert.equal(props.src, source);
    assert.equal(props.srcSet, undefined);
    assert.equal(props.sizes, undefined);
  }
  const explicit = getPublicImageProps({ src: local, alt: "Original", width: 800, height: 600, unoptimized: true });
  assert.equal(explicit.src, local);
  assert.equal(explicit.srcSet, undefined);
});

test("malformed https:// stays unoptimized and does not throw during HTML rendering", () => {
  assert.doesNotThrow(() => {
    const props = getPublicImageProps({ src: "https://", alt: "Malformed", width: 800, height: 600, sizes: "100vw" });
    assert.equal(props.src, "https://");
    assert.equal(props.srcSet, undefined);
    assert.equal(props.sizes, undefined);
    const rendered = images(renderToStaticMarkup(createElement("img", props)));
    assert.equal(rendered.length, 1);
    assert.equal(rendered[0].src, "https://");
    assert.equal(rendered[0].srcset, undefined);
  });
});

for (const alreadyFallback of [false, true]) {
  test(alreadyFallback ? "image fallback guard leaves an existing fallback unchanged"
    : "image fallback removes srcset and sizes before assigning the replacement src", () => {
    for (const fallbackSrc of [undefined, "/img/custom-fallback.jpg"]) {
      const fallback = fallbackSrc ?? DEFAULT_IMAGE_FALLBACK;
      const attributes = new Map([
        ["src", alreadyFallback ? fallback : "/_next/image?url=failed.jpg&w=1920&q=85"],
        ["srcset", "/_next/image?url=failed.jpg&w=640&q=85 640w"], ["sizes", "100vw"],
      ]);
      const before = new Map(attributes);
      const changes: string[] = [];
      let handler: (() => void) | null = () => {};
      const originalHandler = handler;
      const image = {
        getAttribute: (name: string) => attributes.get(name) ?? null,
        removeAttribute(name: string) { changes.push(`remove:${name}`); attributes.delete(name); },
        get onerror() { return handler; },
        set onerror(value: (() => void) | null) { changes.push("onerror"); handler = value; },
        get src() { return attributes.get("src") ?? ""; },
        set src(value: string) { changes.push(`src:${value}`); attributes.set("src", value); },
      };
      const event = { currentTarget: image } as unknown as Parameters<typeof applyImageFallback>[0];
      applyImageFallback(event, fallbackSrc);
      if (alreadyFallback) {
        assert.deepEqual(changes, []);
        assert.deepEqual(attributes, before);
        assert.equal(image.onerror, originalHandler);
      } else {
        assert.deepEqual(changes, ["onerror", "remove:srcset", "remove:sizes", `src:${fallback}`]);
        assert.deepEqual(attributes, new Map([["src", fallback]]));
        assert.equal(image.src, fallback);
        assert.equal(image.onerror, null);
      }
    }
  });
}

test("hero image-set uses desktop and mobile 1920 density candidates at q85", () => {
  for (const mobileImage of [legacy, undefined]) {
    const style = buildHeaderInternoStyle({ image: primary, mobileImage }) as Record<string, string>;
    for (const [key, source, widths] of [
      ["--page-hero-image", primary, [1920, 3840]],
      ["--page-hero-image-mobile", mobileImage ?? primary, [1920, 3840]],
    ] as const) {
      assert.match(style[key], /^image-set\(/);
      const candidates = Array.from(style[key].matchAll(/url\("([^"]+)"\) (\d+)x/g));
      assert.equal(candidates.length, 2);
      assert.deepEqual(candidates.map((match) => match[2]), ["1", "2"]);
      candidates.forEach((match, index) => {
        const url = new URL(match[1], "https://site.example");
        assert.equal(url.pathname, "/_next/image");
        assert.equal(url.searchParams.get("url"), source);
        assert.equal(url.searchParams.get("w"), String(widths[index]));
        assert.equal(url.searchParams.get("q"), "85");
      });
    }
  }
});

test("hero falls back to quoted url() for SVG and sources without srcset", () => {
  for (const source of ["/img/logo.svg?version=2#mark", foreign, "data:image/png;base64,aGVsbG8="]) {
    const style = buildHeaderInternoStyle({ image: source }) as Record<string, string>;
    assert.equal(style["--page-hero-image"], `url(${JSON.stringify(source)})`);
    assert.equal(style["--page-hero-image-mobile"], `url(${JSON.stringify(source)})`);
  }
});

for (const source of [local, primary, legacy]) {
  test(`gallery SSR ghost and main share identical q85 srcsets (${source})`, () => {
    const shop = images(renderToStaticMarkup(createElement(ShopItemGalleryView, {
      productName: "Ceramics", images: [source], activeIndex: 0, activeImage: source, badge: null,
      onSelectImage: () => {}, onOpenModal: () => {}, expandButtonRef: { current: null },
    })));
    const offering = { title: "Ceramics", galleryImages: [{ image: source, alt: "Ceramics" }] } as Parameters<typeof ClassDetailGallery>[0]["item"];
    const classes = images(renderToStaticMarkup(createElement(ClassDetailGallery, { item: offering })));
    for (const [entries, ghostClass, mainClass] of [
      [shop, "shop-item-gallery__ghost", "shop-item-gallery__img"],
      [classes, "class-gallery__main-ghost", "class-gallery__main"],
    ] as const) {
      assert.equal(entries.length, 2);
      const ghost = entries.find((entry) => entry.class === ghostClass)!;
      const main = entries.find((entry) => entry.class === mainClass)!;
      assert.ok(ghost && main);
      assertOptimized(main.src, main.srcset, source);
      assert.equal(ghost.src, main.src);
      assert.equal(ghost.srcset, main.srcset);
      assert.equal(ghost.sizes, main.sizes);
      assert.equal(ghost["aria-hidden"], "true");
    }
  });
}

test("previous gallery layers keep main image dimensions, sizes and q85 (SSR cannot enter swap state)", () => {
  for (const path of [shopGalleryPath, classGalleryPath]) {
    const source = ts.createSourceFile(path, readFileSync(resolve(root, path), "utf8"), ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX);
    const layers: Map<string, string>[] = [];
    function visit(node: ts.Node) {
      if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(source) === "Image") {
        const attrs = new Map(node.attributes.properties.filter(ts.isJsxAttribute)
          .map((attr) => [attr.name.getText(source), attr.initializer?.getText(source) ?? ""]));
        if (attrs.get("className")?.includes("__img") || attrs.get("className")?.includes("class-gallery__main")) layers.push(attrs);
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
    const previous = layers.find((attrs) => attrs.get("className")?.includes("--previous"));
    const main = layers.find((attrs) => !/ghost|previous/.test(attrs.get("className") ?? ""));
    assert.ok(previous && main);
    for (const attr of ["width", "height", "sizes", "quality"]) assert.equal(previous.get(attr), main.get(attr), `${path}: ${attr}`);
    assert.equal(previous.get("quality"), "{85}");
  }
});

for (const source of [local, primary, legacy, foreign]) {
  test(`Markdown and modal SSR preserve natural ratio and public image props (${source})`, () => {
    const common = { activeIndex: 0, onClose: () => {}, onSelect: () => {} };
    const renders = [
      { element: createElement(MarkdownContent, { source: `![Ceramics](${source})` }), sizes: "(max-width: 768px) 100vw, 1000px", quality: 75, loading: "lazy" },
      { element: createElement(MarkdownContent, { source: `<img src="${source}" alt="Ceramics" width="300" height="900">` }), sizes: "(max-width: 768px) 100vw, 1000px", quality: 75, loading: "lazy" },
      { element: createElement(ShopItemGalleryModal, { ...common, title: "Ceramics", images: [source] }), sizes: undefined, quality: 85, loading: "eager" },
      { element: createElement(ClassDetailGalleryModal, { ...common, offeringTitle: "Ceramics", items: [{ id: "image", kind: "image", poster: source, alt: "Ceramics" }] }), sizes: "(max-width: 760px) 100vw, 55vw", quality: 85, loading: "eager" },
    ];
    for (const { element, sizes, quality, loading } of renders) {
      const entries = images(renderToStaticMarkup(element));
      assert.equal(entries.length, 1);
      const img = entries[0];
      assert.equal(img.alt, "Ceramics");
      assert.equal(img.width, undefined);
      assert.equal(img.height, undefined);
      assert.equal(img.loading, loading);
      assert.equal(img.decoding, "async");
      if (source === foreign) {
        assert.equal(img.src, source);
        assert.equal(img.srcset, undefined);
        assert.equal(img.sizes, undefined);
      } else {
        assertOptimized(img.src, img.srcset, source, quality);
        assert.equal(img.sizes, sizes);
        if (sizes === undefined) {
          assert.equal(img.srcset, `${img.src} 1x`);
          assert.equal(new URL(img.src, "https://site.example").searchParams.get("w"), "3840");
        } else {
          assert.ok(img.srcset.split(", ").every((candidate) => / \d+w$/.test(candidate)));
        }
      }
    }
  });
}

test("/img cache headers use finite one-day caching, never immutable", async () => {
  assert.equal(typeof nextConfig.headers, "function");
  const rules = await nextConfig.headers!();
  const imageRules = rules.filter((rule) => rule.source === "/img/:path*");
  assert.equal(imageRules.length, 1);
  const cacheHeaders = imageRules[0].headers.filter((header) => header.key.toLowerCase() === "cache-control");
  assert.equal(cacheHeaders.length, 1);
  const value = cacheHeaders[0].value;
  assert.match(value, /(?:^|,\s*)public(?:,|$)/);
  assert.match(value, /(?:^|,\s*)max-age=86400(?:,|$)/);
  assert.doesNotMatch(value, /immutable/i);
  assert.ok(!rules.some((rule) => rule.source === "/:path*" && rule.headers.some((header) => header.key.toLowerCase() === "cache-control" && /immutable/i.test(header.value))));
});
