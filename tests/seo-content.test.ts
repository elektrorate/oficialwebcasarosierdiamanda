import assert from "node:assert/strict";
import test from "node:test";
import { getSeoContentFields, getSeoWarnings, resolveSeoText, seoPlainText, validateSeoInput, type SeoPeer } from "../src/lib/seo/content.ts";

test("SEO text strips HTML, Markdown, escaped tags and non-visible content", () => {
  assert.equal(seoPlainText('### **Ceramica**\n\n&lt;h2&gt;Torno&lt;/h2&gt; &amp; [esmaltes](https://example.com)'), "Ceramica Torno & esmaltes");
  assert.equal(seoPlainText('&amp;lt;p&amp;gt;Texto&amp;lt;/p&amp;gt;'), "Texto");
  assert.equal(seoPlainText('<script>alert(1)</script><style>.x{}</style><!-- ignored --><p>Visible</p>'), "Visible");
  assert.equal(seoPlainText('- Uno\n2. Dos\n![foto](image.jpg) `Tres`'), "Uno Dos Tres");
});

test("SEO entities handle Unicode and malformed code points without throwing", () => {
  assert.equal(seoPlainText('Espa&#241;a &quot;arte&quot; &#x1F600;'), 'Espa\u00f1a "arte" \ud83d\ude00');
  assert.equal(seoPlainText('&#999999999; &#xD800; &#0;'), "");
  assert.equal(seoPlainText(undefined), "");
});

test("SEO normalization preserves literal punctuation and quoted HTML attributes", () => {
  assert.equal(seoPlainText('C# color_code #20: 3 > 2 y 1 < 2'), 'C# color_code #20: 3 > 2 y 1 < 2');
  assert.equal(seoPlainText('<p title="A > B">Texto <em>visible</em></p>'), 'Texto visible');
  assert.equal(seoPlainText('_Texto_ **marcado** ~~viejo~~ \\*literal\\*'), 'Texto marcado viejo *literal*');
});

test("fallback descriptions are brief and do not cut words or modify the source", () => {
  const source = '### **Torno**\n' + 'Una experiencia ceramica para compartir. '.repeat(20);
  const snapshot = source;
  const metadata = resolveSeoText({ fallbackTitle: '<b>Clase</b>', fallbackDescription: source });
  assert.equal(metadata.title, "Clase");
  assert.ok(metadata.description.length <= 160);
  assert.ok(metadata.description.endsWith("..."));
  const words = metadata.description.slice(0, -3).split(" ");
  assert.ok(["Torno", "Una", "experiencia", "ceramica", "para", "compartir."].includes(words.at(-1)!));
  assert.equal(source, snapshot);
  assert.equal(resolveSeoText({ fallbackDescription: 'x'.repeat(200) }).description, "");
});

test("explicit SEO retains editorial length and only normalizes the rendered text", () => {
  const fields = { title: '  <b>Mi titulo</b> ', description: '**Contenido** ' + 'largo '.repeat(80) };
  const original = structuredClone(fields);
  const metadata = resolveSeoText(fields);
  assert.equal(metadata.title, "Mi titulo");
  assert.ok(metadata.description.length > 160);
  assert.deepEqual(fields, original);
  assert.ok(getSeoWarnings(fields).some(warning => warning.includes("recomendados")));
});

test("empty or formatting-only explicit values use clean fallbacks", () => {
  assert.deepEqual(resolveSeoText({ title: '<br>', description: '** **', fallbackTitle: 'Titulo', fallbackDescription: 'Descripcion' }), { title: 'Titulo', description: 'Descripcion' });
  assert.equal(resolveSeoText({ fallbackDescription: 'x'.repeat(160) }).description.length, 160);
});

test("SEO warnings are non-mutating and do not flag ordinary entities as markup", () => {
  const fields = { title: 'Arcilla &amp; torno', description: 'Una descripcion breve.' };
  assert.deepEqual(getSeoWarnings(fields), []);
  assert.equal(getSeoWarnings({}).length, 2);
  assert.ok(getSeoWarnings({ title: '# Titulo', description: '<p>Texto</p>' }).some(warning => warning.includes("Markdown")));
  validateSeoInput({ seo_title: 'x'.repeat(100), seo_description: 'x'.repeat(500) });
});

test("duplicate warnings compare visible text across kinds and exclude self", () => {
  const peers: SeoPeer[] = [
    { id: 'same', kind: 'blog_post', label: 'Self', path: '/blog/self', title: 'Ceramica', description: 'Texto' },
    { id: 'same', kind: 'product', label: 'Peer', path: '/shop/peer', title: '<b>CERAMICA</b>', description: 'Texto' },
  ];
  const warnings = getSeoWarnings({ id: 'same', kind: 'blog_post', title: ' Ceramica ', description: 'Texto' }, peers);
  assert.equal(warnings.length, 2);
  assert.ok(warnings.every(warning => warning.includes('/shop/peer')));
  assert.ok(warnings.every(warning => !warning.includes('/blog/self')));
});

test("structural SEO validation rejects invalid data but accepts recommendations exceeded", () => {
  for (const value of [42, false, [], {}]) assert.throws(() => validateSeoInput({ seo_title: value }), /texto/);
  assert.throws(() => validateSeoInput({ seo_description: 'x'.repeat(50_001) }), /seguridad/);
  validateSeoInput({ seo_title: null, seo_description: undefined });
  validateSeoInput({ seo_title: 'x'.repeat(500), seo_description: 'x'.repeat(2000) });
});

test("content fallbacks share public branding, global product description and landing priority", () => {
  assert.deepEqual(resolveSeoText(getSeoContentFields("product", { name: "Vaso" }, {
    siteName: "Estudio", defaultSeoDescription: "Descripcion global",
  })), { title: "Vaso | Estudio", description: "Descripcion global" });
  assert.deepEqual(resolveSeoText(getSeoContentFields("offering", { title: "Clase", excerpt: "Resumen" })), {
    title: "Clase | Casa Rosier", description: "Resumen",
  });
  assert.equal(resolveSeoText(getSeoContentFields("landing_page", {
    title: "Landing", hero_subtitle: "Subtitulo del hero", intro_text: "Introduccion distinta",
  })).description, "Subtitulo del hero");
});

test("duplicate titles distinguish blog and branded product fallbacks", () => {
  const product = getSeoContentFields("product", { id: "cup", name: "Vaso", excerpt: "Una pieza" });
  const peer: SeoPeer = { ...product, id: "cup", kind: "product", label: "Vaso", path: "/shop/vaso" };
  assert.ok(!getSeoWarnings(getSeoContentFields("blog_post", { title: "Vaso", excerpt: "Un articulo" }), [peer])
    .some(warning => warning.includes("Titulo SEO coincide")));
  assert.ok(getSeoWarnings({ title: "Vaso | Casa Rosier", description: "Un articulo" }, [peer])
    .some(warning => warning.includes("Titulo SEO coincide")));
});
