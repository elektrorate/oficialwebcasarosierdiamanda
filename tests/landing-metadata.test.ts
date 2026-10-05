import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import type { Metadata } from "next";

function load(file: string, dependencies: Record<string, unknown>) {
  const exports: Record<string, unknown> = {};
  const source = readFileSync(new URL(`../src/${file}`, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  new Function("require", "exports", compiled)((name: string) => {
    assert.ok(name in dependencies, `Unexpected dependency ${name}`);
    return dependencies[name];
  }, exports);
  return exports;
}

test("landing metadata uses CMS text and its own image, then global fallback", async () => {
  const helper = load("lib/seo/page-metadata.ts", {
    "../assets": { assetPath: (value: string) => value },
    "./site-language": { siteOpenGraphLocale: () => "es_ES" },
  });
  let image = "/landing.jpg";
  let published = true;
  const route = load("app/landing/[slug]/page.tsx", {
    "react/jsx-runtime": {},
    "next/navigation": {},
    "@/features/landing-pages/LandingPageView": {},
    "@/lib/cms/landing-pages": { getPublishedLandingPageBySlug: async () => published ? {
      slug: "ceramica", seo_title: "Cerámica en grupo", seo_description: "Una experiencia de taller", seo_image: image,
    } : null },
    "@/lib/cms/settings": { getSettings: async () => ({ site: { site_name: "Casa Rosier", default_language: "es" }, seo: { default_og_image_url: "/global.jpg" } }) },
    "@/lib/seo/content": {
      getSeoContentFields: (_kind: string, item: { seo_title: string; seo_description: string }) => ({ title: item.seo_title, description: item.seo_description }),
      resolveSeoText: (fields: unknown) => fields,
    },
    "@/lib/seo/page-metadata": helper,
  });
  const generate = route.generateMetadata as (input: { params: Promise<{ slug: string }> }) => Promise<Metadata>;
  for (const expected of ["/landing.jpg", "/global.jpg"]) {
    const meta = await generate({ params: Promise.resolve({ slug: "ceramica" }) });
    assert.deepEqual(meta.title, { absolute: "Cerámica en grupo" });
    assert.equal(meta.description, "Una experiencia de taller");
    assert.equal(meta.alternates?.canonical, "/landing/ceramica");
    assert.equal(meta.openGraph?.title, "Cerámica en grupo");
    assert.equal(meta.twitter?.title, "Cerámica en grupo");
    assert.deepEqual(meta.openGraph?.images, [expected]);
    assert.deepEqual(meta.twitter?.images, [expected]);
    image = "";
  }
  published = false;
  assert.deepEqual(await generate({ params: Promise.resolve({ slug: "ceramica" }) }), {});
});
