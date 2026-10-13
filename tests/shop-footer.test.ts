import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { chromium } from "playwright-core";
import { compile } from "tailwindcss";
import ts from "typescript";
import type { CartItem, ShopItem } from "../src/data/types.ts";
import type { PublicFooterViewModel } from "../src/lib/cms/public-footer-model.ts";
import { SHOP_LABELS } from "../src/features/shop/lib/shopLabels.ts";

const require = createRequire(import.meta.url);

// Evaluate UI and its purchase hook with explicit boundaries, never CMS or browser storage.
function loadModule<T>(path: string, dependencies: Record<string, unknown>): T {
  const compiled = ts.transpileModule(readFileSync(new URL(`../src/${path}`, import.meta.url), "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    },
  }).outputText;
  const exports = {};
  new Function("require", "exports", compiled)((name: string) => {
    if (Object.hasOwn(dependencies, name)) return dependencies[name];
    if (["react", "react/jsx-runtime"].includes(name)) return require(name);
    throw new Error(`Unmocked UI dependency: ${name}`);
  }, exports);
  return exports as T;
}

const item: ShopItem = {
  id: "piece-1", slug: "ceramic-cup", name: "Ceramic cup", category: "ceramics", categoryLabel: "Ceramics",
  price: "25 EUR", compareAtPrice: null, priceAmount: 25, compareAtPriceAmount: null,
  badge: null, availability: "available", image: "/img/cup.jpg", gallery: [], description: "", details: {},
  availabilityNote: "", ctaLabel: "", ctaUrl: "", seoTitle: "", seoDescription: "", order: 0,
  isPublished: true, createdAt: "2026-01-01T00:00:00Z",
};

function purchaseFixture(product: ShopItem) {
  const selections: CartItem[] = [];
  const hook = loadModule<typeof import("../src/features/shop/hooks/useShopItemPurchase.ts")>("features/shop/hooks/useShopItemPurchase.ts", {
    react: { useCallback: (callback: unknown) => callback },
    "@/lib/cart": { addCartItem: (selection: CartItem) => selections.push(selection) },
    "../lib/shopLabels": { SHOP_LABELS },
  });
  const { ShopItemPurchasePanel } = loadModule<typeof import("../src/features/shop/components/item-detail/ShopItemPurchasePanel.tsx")>("features/shop/components/item-detail/ShopItemPurchasePanel.tsx", {
    "../../hooks/useShopItemPurchase": hook,
    "../../lib/shopLabels": { SHOP_LABELS },
    "./ShopItemPrice": { ShopItemPrice: () => null },
    "@/components/ui/MarkdownContent": { MarkdownContent: () => null },
  });
  const view = ShopItemPurchasePanel({ item: product });
  const action = view.props.children[2].props.children as ReactElement<{ onClick?: () => void }>;
  return { selections, action, markup: renderToStaticMarkup(view) };
}

for (const ctaUrl of ["", "   "]) {
  test(`available products retain a working cart button when the purchase URL is ${ctaUrl ? "whitespace" : "empty"}`, () => {
    const { action, selections, markup } = purchaseFixture({ ...item, ctaUrl });
    assert.match(markup, /<button\b/);
    assert.doesNotMatch(markup, /disabled|<a\b/);
    assert.ok(markup.includes(SHOP_LABELS.buyNowAlt));
    assert.equal(typeof action.props.onClick, "function");
    action.props.onClick!();
    assert.equal(selections.length, 1);
    assert.equal(selections[0].productId, item.id);
    assert.equal(selections[0].slug, item.slug);
    assert.equal(selections[0].quantity, 1);
  });
}

test("products with a purchase URL keep their external link and custom label", () => {
  const { action, selections, markup } = purchaseFixture({ ...item, ctaUrl: "https://checkout.example/cup", ctaLabel: "  Order cup  " });
  assert.match(markup, /href="https:\/\/checkout\.example\/cup"/);
  assert.match(markup, /target="_blank" rel="noopener noreferrer"/);
  assert.match(markup, />Order cup<\/a>/);
  assert.doesNotMatch(markup, /<button\b/);
  assert.equal(action.props.onClick, undefined);
  assert.deepEqual(selections, []);
});

test("sold products cannot be purchased with or without a URL", () => {
  for (const ctaUrl of ["", "https://checkout.example/cup"]) {
    const { action, selections, markup } = purchaseFixture({ ...item, badge: "sold", ctaUrl });
    assert.match(markup, /<button\b[^>]*disabled/);
    assert.ok(markup.includes(SHOP_LABELS.soldOut));
    assert.equal(action.props.onClick, undefined);
    assert.deepEqual(selections, []);
  }
});

test("catalog cards keep their product route without the action hook", () => {
  const { ShopProductCard } = loadModule<typeof import("../src/features/shop/components/catalog/ShopProductCard.tsx")>("features/shop/components/catalog/ShopProductCard.tsx", {
    "next/link": { __esModule: true, default: "a" },
    "next/image": { __esModule: true, default: () => null },
    "@/lib/assets": { assetPath: (path: string) => path },
    "@/features/shop/lib/shopLabels": { SHOP_LABELS },
    "./ShopProductBadgeLabel": { ShopProductBadgeLabel: () => null },
    "./ShopProductCardFooter": { ShopProductCardFooter: () => null },
    "./ShopProductIcons": { ShopIconEye: () => null },
    "@/lib/image-fallback": { applyImageFallback: () => {} },
  });
  const markup = renderToStaticMarkup(createElement(ShopProductCard, { item }));
  assert.match(markup, /href="\/shop\/ceramic-cup"/);
  assert.match(markup, /aria-label="Ver Ceramic cup"/);
});

function footerMarkup() {
  const model: PublicFooterViewModel = {
    themeStyle: {}, theme: { socialButtonColor: "", socialIconColor: "" },
    contactTitle: "", contactLines: [], socialTitle: "", extraAddress: null, mapUrl: null,
    mapLinkLines: ["", ""], socialLinks: [], legalCopy: "", brandText: null, logoUrl: null,
    showContactInfo: false, showSocialLinks: false,
    contactForm: { form: null, slug: "", submitSubject: "", defaultSuccessMessage: "" },
  };
  const { PublicFooterContent } = loadModule<typeof import("../src/components/layout/footer/PublicFooterContent.tsx")>("components/layout/footer/PublicFooterContent.tsx", {
    "@/lib/cms/public-footer-model": { buildPublicFooterViewModel: () => assert.fail("Unexpected CMS model construction") },
    "./FooterContactForm": { FooterContactForm: () => null },
    "./FooterContactInfo": { FooterContactInfo: () => null },
    "./FooterSocialMarquee": { FooterSocialMarquee: () => null },
  });
  return renderToStaticMarkup(createElement(PublicFooterContent, { model }));
}

test("legal footer links keep their destinations, explicit shared row and accessible admin name", () => {
  const markup = footerMarkup();
  const links = Array.from(markup.matchAll(/<a\b([^>]*)>/g), ([, attributes]) => attributes);
  assert.equal(links.length, 2);
  assert.ok(links.every((attributes) => /\brow-start-1\b/.test(attributes)));
  assert.match(links[0], /href="\/auth"/);
  assert.match(links[0], /aria-label="Administraci[^"]+"/);
  assert.match(links[1], /href="\/politica-privacidad"/);
});

const edgePath = process.env.EDGE_PATH || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";

test("footer links share one row without overflow on mobile and desktop", { skip: !existsSync(edgePath) }, async () => {
  const markup = footerMarkup();
  const candidates = Array.from(markup.matchAll(/class="([^"]*)"/g)).flatMap((match) => match[1].split(/\s+/));
  const css = (await compile("@tailwind utilities;")).build(candidates);
  const browser = await chromium.launch({ executablePath: edgePath, headless: true });
  try {
    const page = await browser.newPage();
    await page.route("**/*", (route) => route.abort());
    for (const width of [320, 360, 390, 640, 641, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.setContent(`<style>${css} body{margin:0} .container{width:min(560px,calc(100% - 32px));margin:auto}</style>${markup}`);
      const nav = page.locator("footer nav");
      const admin = await nav.locator('a[href="/auth"]').boundingBox();
      const privacy = await nav.locator('a[href="/politica-privacidad"]').boundingBox();
      assert.ok(admin && privacy);
      assert.ok(Math.abs((admin.y + admin.height / 2) - (privacy.y + privacy.height / 2)) < 1, `Different rows at ${width}px`);
      assert.ok(privacy.x + privacy.width <= admin.x, `Overlapping links at ${width}px`);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, `Overflow at ${width}px`);
    }
  } finally {
    await browser.close();
  }
});
