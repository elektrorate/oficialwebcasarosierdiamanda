import { chromium } from "playwright-core";

const baseUrl = new URL(process.argv[2] || "http://localhost:3000");
const profile = process.argv[3] === "mobile" ? "mobile" : "desktop";
const edgePath = process.env.EDGE_PATH ||
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";

function localUrl(rawUrl) {
  const url = new URL(rawUrl, baseUrl);
  if (url.origin !== baseUrl.origin) return null;
  url.protocol = baseUrl.protocol;
  url.host = baseUrl.host;
  url.hash = "";
  return url.href;
}

function sitemapUrl(rawUrl) {
  const source = new URL(rawUrl);
  return new URL(`${source.pathname}${source.search}`, baseUrl).href;
}

const browser = await chromium.launch({ executablePath: edgePath, headless: true });
const context = await browser.newContext({
  viewport: profile === "mobile" ? { width: 390, height: 844 } : { width: 1440, height: 1000 },
  isMobile: profile === "mobile",
  hasTouch: profile === "mobile",
  reducedMotion: "reduce",
});

const sitemapResponse = await context.request.get(new URL("/sitemap.xml", baseUrl).href);
if (!sitemapResponse.ok()) {
  throw new Error(`No se pudo leer sitemap.xml: HTTP ${sitemapResponse.status()}`);
}

const sitemapXml = await sitemapResponse.text();
const sitemapRoutes = [...sitemapXml.matchAll(/<loc>(.*?)<\/loc>/g)]
  .map((match) => sitemapUrl(match[1]));
const routes = [...new Set([baseUrl.href, ...sitemapRoutes])];
const internalLinks = new Set();
const failures = [];
const pageResults = [];

for (const url of routes) {
  const page = await context.newPage();
  const consoleErrors = [];
  const requestFailures = [];
  const badResponses = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      const location = message.location();
      consoleErrors.push(`${message.text()}${location.url ? ` — ${location.url}` : ""}`);
    }
  });
  page.on("requestfailed", (request) => {
    requestFailures.push(`${request.method()} ${request.url()} — ${request.failure()?.errorText || "falló"}`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400) badResponses.push(`${response.status()} ${response.url()}`);
  });

  let status = 0;
  let title = "";
  let hasContent = false;
  let hasErrorOverlay = false;
  let brokenImages = [];

  try {
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    status = response?.status() || 0;
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(400);
    await page.evaluate(() => window.scrollTo(0, 0));
    title = await page.title();
    hasContent = await page.evaluate(() => document.body.innerText.trim().length > 0);
    hasErrorOverlay = await page.evaluate(() => Boolean(
      document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay"),
    ));
    brokenImages = await page.locator("img").evaluateAll((images) => images
      .filter((image) => image.complete && image.naturalWidth === 0)
      .map((image) => ({
        src: image.currentSrc || image.src,
        alt: image.alt,
        className: image.className,
      })));
    const links = await page.locator("a[href]").evaluateAll((anchors) => anchors.map((anchor) => anchor.href));
    for (const href of links) {
      const parsed = localUrl(href);
      if (parsed) internalLinks.add(parsed);
    }
  } catch (error) {
    failures.push({ url, error: error instanceof Error ? error.message : String(error) });
  } finally {
    pageResults.push({
      url,
      status,
      title,
      hasContent,
      hasErrorOverlay,
      brokenImages: brokenImages.filter((image, index, images) =>
        images.findIndex((candidate) => candidate.src === image.src) === index
      ),
      consoleErrors: [...new Set(consoleErrors)],
      requestFailures: [...new Set(requestFailures)],
      badResponses: [...new Set(badResponses)],
    });
    await page.close();
  }
}

const linkResults = [];
for (const url of internalLinks) {
  const response = await context.request.get(url, { maxRedirects: 5, timeout: 30000 });
  linkResults.push({ url, status: response.status() });
}

await browser.close();

const unhealthyPages = pageResults.filter((result) =>
  result.status >= 400 ||
  result.status === 0 ||
  !result.hasContent ||
  result.hasErrorOverlay ||
  result.brokenImages.length > 0 ||
  result.consoleErrors.length > 0 ||
  result.requestFailures.length > 0 ||
  result.badResponses.length > 0
);
const brokenLinks = linkResults.filter((result) => result.status >= 400 || result.status === 0);
const report = {
  baseUrl: baseUrl.href,
  profile,
  checkedAt: new Date().toISOString(),
  sitemapRoutes: routes.length,
  renderedInternalLinks: linkResults.length,
  healthyPages: pageResults.length - unhealthyPages.length,
  unhealthyPages,
  brokenLinks,
  navigationFailures: failures,
};

console.log(JSON.stringify(report, null, 2));
process.exitCode = unhealthyPages.length || brokenLinks.length || failures.length ? 1 : 0;
