import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";

const base = new URL(process.argv[2] || "http://localhost:9898");
const decode = value => value?.replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&#x27;", "'") || "";
const attr = (tag, key) => decode(tag.match(new RegExp(`\\b${key}="([^"]*)"`, "i"))?.[1]);
async function get(path, redirect = "follow") {
  return fetch(new URL(path, base), { redirect, headers: { "User-Agent": "bingbot" }, signal: AbortSignal.timeout(60000) });
}
const robotsResponse = await get("/robots.txt");
assert.equal(robotsResponse.status, 200);
const robots = await robotsResponse.text();
assert.ok(robots.includes(`Sitemap: ${base.origin}/sitemap.xml`));
const sitemap = await get("/sitemap.xml");
assert.equal(sitemap.status, 200);
const paths = [...(await sitemap.text()).matchAll(/<loc>(.*?)<\/loc>/g)].map(m => {
  const url = new URL(decode(m[1]));
  assert.equal(url.origin, base.origin, "Sitemap origin");
  return url.pathname;
});
assert.ok(paths.length > 0);
const pages = [];
const links = new Set();
for (const path of paths) {
  const response = await get(path);
  const html = await response.text();
  const tags = [...html.matchAll(/<meta\b[^>]*>/g)].map(m => m[0]);
  const meta = key => attr(tags.find(t => attr(t, "name") === key || attr(t, "property") === key) || "", "content");
  const canonical = attr([...html.matchAll(/<link\b[^>]*>/g)].map(m => m[0]).find(t => attr(t, "rel") === "canonical") || "", "href");
  const title = decode(html.match(/<title>(.*?)<\/title>/s)?.[1]);
  const jsonLd = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)].map(m => JSON.parse(m[1]));
  const row = { path, status: response.status, title, description: meta("description"), canonical, robots: meta("robots"), ogTitle: meta("og:title"), ogImage: meta("og:image"), twitterTitle: meta("twitter:title"), h1: [...html.matchAll(/<h1\b/g)].length, jsonLdTypes: jsonLd.map(j => j["@type"]) };
  assert.equal(row.status, 200, path);
  assert.ok(row.title && row.description && row.canonical, path);
  assert.equal(new URL(canonical).pathname, path, `Canonical path ${path}`);
  assert.equal(new URL(canonical).origin, base.origin, path);
  assert.ok(!/noindex/i.test(row.robots), path);
  assert.equal(row.h1, 1, `H1 ${path}`);
  if (path !== "/politica-privacidad") {
    assert.ok(row.ogImage && row.twitterTitle, `Social metadata ${path}`);
  }
  for (const [, raw] of html.matchAll(/<a\b[^>]*href="([^"]+)"/g)) {
    const url = new URL(decode(raw), base);
    if (url.origin === base.origin) links.add(url.pathname);
  }
  pages.push(row);
  console.log(`OK ${path}`);
}
const extraLinks = [];
for (const path of links) {
  if (paths.includes(path)) continue;
  const r = await get(path);
  await r.body?.cancel();
  extraLinks.push({ path, status: r.status });
  assert.ok(r.status < 400, `Internal link ${path}`);
}
const missing = await get("/shop/seo-verification-missing-1791183809053");
assert.equal(missing.status, 404);
assert.match(await missing.text(), /name="robots" content="noindex/);
const alias = await get("/clases", "manual");
assert.ok([301, 308].includes(alias.status));
assert.equal(new URL(alias.headers.get("location"), base).pathname, "/cursos");
await alias.body?.cancel();
const duplicates = field => pages.filter((p, i) => pages.findIndex(other => other[field] === p[field]) !== i).map(p => p.path);
const report = { checkedAt: new Date().toISOString(), base: base.origin, pages, extraLinks, duplicateTitles: duplicates("title"), duplicateDescriptions: duplicates("description"), missingPage: missing.status, aliasStatus: alias.status };
await writeFile(new URL("../reports/SEO_IMPLEMENTACION_2026-10-05.json", import.meta.url), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ pages: pages.length, internalLinks: links.size, duplicateTitles: report.duplicateTitles, duplicateDescriptions: report.duplicateDescriptions }));
