import { chromium } from "playwright-core";

const baseUrl = new URL(process.argv[2] || "http://localhost:3000");
const edgePath = process.env.EDGE_PATH || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const profile = process.argv[3] === "mobile"
  ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }
  : { viewport: { width: 1440, height: 900 } };

function toLocalUrl(rawUrl) {
  const source = new URL(rawUrl);
  return new URL(`${source.pathname}${source.search}`, baseUrl).href;
}

const browser = await chromium.launch({ executablePath: edgePath, headless: true });
const context = await browser.newContext({ ...profile, reducedMotion: "reduce" });
const sitemapResponse = await context.request.get(new URL("/sitemap.xml", baseUrl).href);
if (!sitemapResponse.ok()) throw new Error(`No se pudo leer sitemap.xml: HTTP ${sitemapResponse.status()}`);

const sitemap = await sitemapResponse.text();
const routes = [...new Set([
  baseUrl.href,
  ...[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => toLocalUrl(match[1])),
])];
const pages = [];

try {
  for (const url of routes) {
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(250);
    const images = await page.locator("img").evaluateAll((elements) => elements.map((image) => ({
      src: image.currentSrc || image.src,
      alt: image.alt,
      hasAltAttribute: image.hasAttribute("alt"),
      decorative: image.getAttribute("aria-hidden") === "true" || image.getAttribute("role") === "presentation",
      loading: image.loading || "eager",
      hasSizes: Boolean(image.getAttribute("sizes")),
      hasSrcset: Boolean(image.getAttribute("srcset")),
      loaded: image.complete && image.naturalWidth > 0,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
    })));
    pages.push({ url, images });
    await page.close();
  }
} finally {
  await browser.close();
}

const findings = pages.flatMap((page) => page.images.flatMap((image) => {
  const issues = [];
  // A lazy image fuera de pantalla puede no estar descargada todavía; no es un fallo.
  if (!image.loaded && image.loading !== "lazy") issues.push("imagen no cargada");
  if (!image.decorative && !image.hasAltAttribute) issues.push("atributo ALT ausente");
  if (image.hasSrcset && !image.hasSizes) issues.push("srcset sin sizes");
  return issues.map((issue) => ({ url: page.url, src: image.src, issue }));
}));

console.log(JSON.stringify({
  baseUrl: baseUrl.href,
  profile: profile.isMobile ? "mobile" : "desktop",
  checkedAt: new Date().toISOString(),
  pages: pages.length,
  images: pages.reduce((total, page) => total + page.images.length, 0),
  findings,
}, null, 2));

process.exitCode = findings.length ? 1 : 0;
