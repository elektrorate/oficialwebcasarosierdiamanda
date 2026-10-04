import assert from "node:assert/strict";
import { chromium } from "playwright-core";

// Requires an already running public site. No build, server, login or CMS CRUD.
const quick = process.argv.includes("--quick");
const routes = quick ? ["/experiencias/clases-regulares-de-modelado"] : ["/", "/experiencias/clases-regulares-de-modelado", "/cursos"];
const desktopWidths = quick ? [1100] : [1025, 1100, 1280, 1440, 1920];
const mobileWidths = quick ? [390] : [360, 390, 430];
const report = { baseUrl: process.argv[2] || "http://localhost:4050", checks: [], blockedRequests: [] };
const dropdownSelector = "[data-nav-dropdown]";
const desktopIdsByRoute = new Map();
let browser;
let baseUrl;

async function check(label, run) {
  try {
    const details = await run();
    if (details?.skip) {
      report.checks.push({ label, status: "skip", reason: details.skip });
      console.log(`SKIP ${label}: ${details.skip}`);
      return true;
    }
    report.checks.push({ label, status: "pass", ...(details ? { details } : {}) });
    console.log(`PASS ${label}`);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    report.checks.push({ label, status: "fail", error: message });
    console.log(`FAIL ${label}: ${message}`);
    return false;
  }
}

async function poll(read, verify, message) {
  const deadline = Date.now() + 5000;
  let value;
  do {
    value = await read();
    if (verify(value)) return value;
    await new Promise((resolve) => setTimeout(resolve, 80));
  } while (Date.now() < deadline);
  assert.fail(`${message}; actual=${JSON.stringify(value)}`);
}

async function visibleDropdowns(page) {
  return page.locator(`${dropdownSelector}:visible`).evaluateAll((panels) => panels.map((panel) => {
    const rect = panel.getBoundingClientRect();
    return {
      id: panel.getAttribute("data-nav-dropdown"), hidden: panel.hidden,
      left: rect.left, right: rect.right, width: rect.width, viewport: window.innerWidth,
    };
  }));
}

async function assertClosed(page, context = "Desktop dropdowns must all be closed") {
  await poll(() => visibleDropdowns(page), (panels) => panels.length === 0, context);
}

async function assertOpen(page, id) {
  const panels = await poll(() => visibleDropdowns(page),
    (panels) => {
      assert.ok(panels.length <= 1, `Multiple desktop dropdowns visible: ${JSON.stringify(panels)}`);
      return panels.length === 1 && panels[0].id === id && !panels[0].hidden &&
        panels[0].left >= 15 && panels[0].right <= panels[0].viewport - 15;
    },
    `Exactly one dropdown must open for ID ${id}`);
  const panel = panels[0];
  assert.ok(panel.width > 0, `Empty dropdown ${id}`);
  assert.ok(panel.left >= 15 && panel.right <= panel.viewport - 15,
    `Dropdown ${id} violates 16px viewport margin (+/-1px): ${JSON.stringify(panel)}`);
  return panel;
}

async function reset(page) {
  await page.mouse.move(1, page.viewportSize().height - 2);
  await focusOutside(page);
  await page.keyboard.press("Escape");
  await assertClosed(page);
}

async function goto(page, path) {
  const response = await page.goto(new URL(path, baseUrl).href, { waitUntil: "domcontentloaded", timeout: 30000 });
  assert.ok(response && response.ok(), `Public route ${path}: HTTP ${response?.status()}`);
  await page.locator('.site-nav-shell[data-navigation-ready="true"]').waitFor({ state: "attached" });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.evaluate(async () => { await document.fonts.ready; });
  // Let client hydration and the initial viewport effect settle before interacting.
  await page.waitForTimeout(600);
}

async function rootsFor(surface) {
  const roots = surface.locator(".hero__nav-list > li, .scroll-desktop-nav__list > li");
  const entries = await roots.evaluateAll((elements) => elements.map((root) => ({
    id: root.getAttribute("data-menu-id"),
    label: root.querySelector("a")?.textContent?.trim(),
    href: root.querySelector("a")?.getAttribute("href"),
    dropdownId: root.querySelector("[data-nav-dropdown]")?.getAttribute("data-nav-dropdown"),
    hasChildren: Boolean(root.querySelector("ul[role='menu']")),
  })));
  assert.ok(entries.length, "No desktop roots found");
  assert.ok(entries.every((entry) => entry.id), "Every desktop root requires data-menu-id");
  assert.equal(new Set(entries.map((entry) => entry.id)).size, entries.length, "Duplicate IDs in desktop surface");
  const children = entries.filter((entry) => entry.hasChildren);
  assert.ok(children.length, "No roots with children: coverage would be empty");
  for (const entry of children) assert.equal(entry.dropdownId, entry.id, `Dropdown identity mismatch for ${entry.label}`);
  return { roots, entries, children };
}

async function focusOutside(page) {
  await page.evaluate(() => {
    const element = document.querySelector("main") ?? document.body;
    const previous = element.getAttribute("tabindex");
    element.setAttribute("tabindex", "-1");
    element.focus({ preventScroll: true });
    if (previous === null) element.removeAttribute("tabindex");
    else element.setAttribute("tabindex", previous);
  });
}

async function clickOutside(page) {
  const point = await page.evaluate(() => {
    for (const y of [window.innerHeight - 20, window.innerHeight / 2]) {
      for (const x of [20, window.innerWidth / 2, window.innerWidth - 20]) {
        const element = document.elementFromPoint(x, y);
        if (element && !element.shadowRoot && !element.closest(".site-nav-shell, .desktop-sticky-nav-portal, nextjs-portal, a, button, input, textarea, select, [role='button']")) {
          return { x, y };
        }
      }
    }
    return null;
  });
  assert.ok(point, "Cannot find a safe non-interactive point outside navigation");
  await page.mouse.click(point.x, point.y);
}

async function desktopSurface(page, path, width, kind) {
  const label = `${path} ${width}px ${kind}`;
  await goto(page, path);
  if (kind === "sticky") {
    await page.evaluate(() => window.scrollTo({ top: Math.min(700, document.documentElement.scrollHeight - window.innerHeight), behavior: "instant" }));
    await page.locator(".desktop-sticky-nav-portal.is-sticky-active").waitFor({ state: "visible" });
  } else {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    if (path === "/" && !(await page.locator(".hero__nav").isVisible())) {
      return { skip: "Home hero desktop navigation is hidden by the existing design" };
    }
    await page.locator(".hero__nav").waitFor({ state: "visible" });
  }
  const surface = page.locator(kind === "hero" ? ".hero__nav" : ".desktop-sticky-nav-portal.is-sticky-active");
  const { roots, entries, children } = await rootsFor(surface);
  const knownIds = desktopIdsByRoute.get(path);
  if (!knownIds || entries.length > knownIds.length) desktopIdsByRoute.set(path, entries.map((entry) => entry.id));
  const rootFor = (entry) => roots.filter({ has: page.locator(`[data-nav-dropdown=${JSON.stringify(entry.id)}]`) });
  await reset(page);

  for (const entry of children) {
    await check(`${label} hover/focus ${entry.label} [${entry.id}]`, async () => {
      const root = rootFor(entry);
      const link = root.locator("a").first();
      await reset(page);
      await link.hover();
      const geometry = await assertOpen(page, entry.id);
      const panel = root.locator(dropdownSelector);
      await panel.hover();
      await page.waitForTimeout(450); // Longer than the 320ms scheduled-close delay.
      await assertOpen(page, entry.id);
      await page.keyboard.press("Escape");
      await assertClosed(page, `${label} ${entry.label}: closed after Escape`);

      await page.mouse.move(1, page.viewportSize().height - 2);
      await focusOutside(page);
      await link.focus();
      await assertOpen(page, entry.id);
      await focusOutside(page);
      await assertClosed(page, `${label} ${entry.label}: closed after focus leaves`);

      await link.hover();
      await assertOpen(page, entry.id);
      await clickOutside(page);
      await assertClosed(page, `${label} ${entry.label}: closed after outside click`);
      return geometry;
    });
  }

  await check(`${label} Clases/CURSOS independent shared href`, async () => {
    const classes = children.find((entry) => /^clases\b/i.test(entry.label ?? ""));
    const courses = children.find((entry) => /^cursos\b/i.test(entry.label ?? ""));
    assert.ok(classes && courses, "Both real Clases and CURSOS roots with children are required");
    assert.equal(classes.href, courses.href, "Clases/CURSOS no longer reproduce the shared canonical href");
    assert.notEqual(classes.id, courses.id);
    await reset(page);
    for (const entry of [classes, courses, classes]) {
      await rootFor(entry).locator("a").first().hover();
      await assertOpen(page, entry.id);
    }
    return { href: classes.href, ids: [classes.id, courses.id] };
  });

  await check(`${label} pointer and keyboard focus retain the owning dropdown`, async () => {
    const entry = children[0];
    const link = rootFor(entry).locator("a").first();
    await reset(page);
    await link.focus();
    await assertOpen(page, entry.id);
    await rootFor(entry).locator(dropdownSelector).hover();
    await focusOutside(page);
    await page.waitForTimeout(450);
    await assertOpen(page, entry.id);
    await page.mouse.move(1, page.viewportSize().height - 2);
    await assertClosed(page);

    await link.focus();
    await assertOpen(page, entry.id);
    await rootFor(entry).locator(dropdownSelector).hover();
    await page.mouse.move(1, page.viewportSize().height - 2);
    await page.waitForTimeout(450);
    await assertOpen(page, entry.id);
    await focusOutside(page);
    await assertClosed(page);

    const plain = entries.find((candidate) => !candidate.hasChildren);
    if (plain) {
      const plainLink = roots.nth(entries.indexOf(plain)).locator("a").first();
      await link.hover();
      await assertOpen(page, entry.id);
      await plainLink.focus();
      await page.mouse.move(1, page.viewportSize().height - 2);
      await focusOutside(page);
      await assertClosed(page);
    }
  });

  await check(`${label} navigation closes and returning to top has no stale root`, async () => {
    await reset(page);
    const entry = children.find((candidate) => candidate.href === "/cursos") ?? children[0];
    const root = rootFor(entry);
    await root.locator("a").first().hover();
    await assertOpen(page, entry.id);
    const link = root.locator(`${dropdownSelector} a[href]`).filter({ visible: true });
    let destination;
    let target;
    for (let index = 0; index < await link.count(); index++) {
      const candidate = link.nth(index);
      const href = await candidate.getAttribute("href");
      const url = new URL(href, baseUrl);
      if (url.origin === baseUrl.origin && url.pathname !== new URL(page.url()).pathname &&
          !/^\/(?:api|admin|auth|checkout|account)(?:\/|$)/.test(url.pathname) &&
          (await candidate.getAttribute("target")) !== "_blank") {
        destination = url;
        target = candidate;
        break;
      }
    }
    assert.ok(target && destination, "No safe public submenu link to a different page");
    await target.click();
    await page.waitForURL((url) => url.pathname === destination.pathname, { timeout: 15000 });
    await assertClosed(page);
    await page.goBack({ waitUntil: "domcontentloaded" });
    await page.waitForURL((url) => url.pathname === new URL(path, baseUrl).pathname);
    await page.mouse.move(1, page.viewportSize().height - 2);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await assertClosed(page);
    assert.equal(await page.locator(".hero__nav-item--open, .scroll-desktop-nav__item.is-open").count(), 0,
      "An old root remains marked open after navigation/back/top");
    return { destination: destination.pathname };
  });

  await check(`${label} desktop to mobile closes all desktop dropdowns`, async () => {
    await goto(page, path);
    if (kind === "sticky") {
      await page.evaluate(() => window.scrollTo({ top: 700, behavior: "instant" }));
      await page.locator(".desktop-sticky-nav-portal.is-sticky-active").waitFor({ state: "visible" });
    }
    await rootFor(children[0]).locator("a").first().hover();
    await assertOpen(page, children[0].id);
    await page.setViewportSize({ width: 390, height: 844 });
    await assertClosed(page);
    await page.setViewportSize({ width, height: 900 });
    await page.mouse.move(1, 880);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await assertClosed(page);
    assert.equal(await page.locator(".hero__nav-item--open, .scroll-desktop-nav__item.is-open").count(), 0,
      "Resize/top left a stale desktop root");
  });
  return { rootIds: entries.map((entry) => entry.id), testedChildren: children.length };
}

async function mobileMenu(page, path, width) {
  await goto(page, path);
  const toggle = page.locator(".mobile-scroll-nav__toggle:visible");
  assert.equal(await toggle.count(), 1, "Exactly one mobile menu toggle should be visible");
  await toggle.click();
  const menu = page.locator("#mobile-scroll-menu");
  await menu.waitFor({ state: "visible" });
  const roots = menu.locator(".mobile-menu__list > li");
  const entries = await roots.evaluateAll((elements) => elements.map((root) => ({
    id: root.getAttribute("data-menu-id"),
    label: root.querySelector(".mobile-menu__link")?.textContent?.trim(),
    panelId: root.querySelector(".mobile-submenu")?.id,
  })));
  assert.ok(entries.length > 0 && entries.every((entry) => entry.id), "Every mobile root needs an ID");
  assert.equal(new Set(entries.map((entry) => entry.id)).size, entries.length, "Duplicate mobile root IDs");
  const desktopIds = desktopIdsByRoute.get(path);
  assert.ok(desktopIds, "No desktop identity baseline was collected for this route");
  const mobileIds = entries.map((entry) => entry.id);
  assert.deepEqual(path === "/" ? mobileIds.filter((id) => desktopIds.includes(id)) : mobileIds, desktopIds,
    "Desktop/mobile root IDs or their order differ (home may add Inicio on mobile)");
  const duplicateDomIds = await page.locator(".site-nav-shell [id], .desktop-sticky-nav-portal [id]").evaluateAll((elements) => {
    const ids = elements.map((element) => element.id);
    return [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  });
  assert.deepEqual(duplicateDomIds, [], "Duplicate menu DOM IDs at mobile width");
  const classes = entries.find((entry) => /^clases\b/i.test(entry.label ?? ""));
  const courses = entries.find((entry) => /^cursos\b/i.test(entry.label ?? ""));
  assert.ok(classes?.panelId && courses?.panelId, "Real mobile Clases/CURSOS accordions are required");
  assert.notEqual(classes.id, courses.id);
  assert.notEqual(classes.panelId, courses.panelId);
  for (const entry of [classes, courses, classes]) {
    const root = roots.filter({ has: page.locator(`[id=${JSON.stringify(entry.panelId)}]`) });
    const button = root.locator(".mobile-menu__link--submenu");
    assert.equal(await button.getAttribute("aria-controls"), entry.panelId);
    await button.click();
    await poll(() => menu.locator(".mobile-submenu:visible").evaluateAll((panels) => panels.map((panel) => panel.id)),
      (ids) => ids.length === 1 && ids[0] === entry.panelId, "Only the selected mobile accordion may be visible");
    assert.equal(await button.getAttribute("aria-expanded"), "true");
    const openRoots = await roots.evaluateAll((elements) => elements.filter((root) =>
      root.querySelector('.mobile-menu__link--submenu[aria-expanded="true"]')).map((root) => root.getAttribute("data-menu-id")));
    assert.deepEqual(openRoots, [entry.id]);
    await assertClosed(page);
  }
  const last = roots.filter({ has: page.locator(`[id=${JSON.stringify(classes.panelId)}]`) });
  await last.locator(".mobile-menu__link--submenu").click();
  assert.equal(await menu.locator(".mobile-submenu:visible").count(), 0, "Clicking the open accordion should close it");
  await toggle.click();
  await menu.waitFor({ state: "hidden" });
  return { width, rootIds: entries.map((entry) => entry.id), accordionIds: [classes.id, courses.id] };
}

try {
  baseUrl = new URL(report.baseUrl);
  assert.ok(["http:", "https:"].includes(baseUrl.protocol) && !baseUrl.username && !baseUrl.password,
    "Provide a public HTTP(S) URL without credentials");
  browser = await chromium.launch({
    executablePath: process.env.EDGE_PATH || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    headless: true,
  });
  for (const width of [...desktopWidths, ...mobileWidths]) {
    const mobile = width < 1025;
    const context = await browser.newContext({
      viewport: { width, height: mobile ? 844 : 900 }, reducedMotion: "reduce",
      isMobile: mobile, hasTouch: mobile, serviceWorkers: "block",
    });
    try {
      // Block ALL mutating requests, including app actions, analytics and external DB endpoints.
      await context.route("**/*", async (route) => {
        const request = route.request();
        if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method()) ||
            /(?:google-analytics\.com|googletagmanager\.com|\/api\/(?:analytics|tracking)(?:[/?]|$))/i.test(request.url())) {
          report.blockedRequests.push({ method: request.method(), url: request.url().split("?")[0] });
          await route.abort("blockedbyclient");
        } else {
          await route.continue();
        }
      });
      // Next dev requires its own HMR connection to complete client hydration.
      await context.routeWebSocket((url) => !(url.host === baseUrl.host && url.pathname.startsWith("/_next/")),
        (socket) => socket.close());
      const page = await context.newPage();
      page.setDefaultTimeout(7000);
      for (const path of routes) {
        if (mobile) {
          await check(`${path} ${width}px mobile identity/accordion`, () => mobileMenu(page, path, width));
        } else {
          const surfaces = [];
          for (const kind of ["hero", "sticky"]) {
            await page.setViewportSize({ width, height: 900 });
            let details;
            await check(`${path} ${width}px ${kind} setup/coverage`, async () => {
              details = await desktopSurface(page, path, width, kind);
              return details;
            });
            if (details?.rootIds) surfaces.push(details);
          }
          if (surfaces.length === 2) {
            await check(`${path} ${width}px hero/sticky share IDs`, async () => {
              assert.deepEqual(surfaces[0].rootIds, surfaces[1].rootIds);
            });
          }
        }
      }
    } finally {
      await context.close();
    }
  }
} catch (error) {
  await check("E2E setup/runtime", () => { throw error; });
} finally {
  if (browser) await check("Browser cleanup", () => browser.close());
  report.summary = {
    passed: report.checks.filter((entry) => entry.status === "pass").length,
    failed: report.checks.filter((entry) => entry.status === "fail").length,
    skipped: report.checks.filter((entry) => entry.status === "skip").length,
    blockedRequests: report.blockedRequests.length,
  };
  console.log(JSON.stringify(report, null, 2));
  if (report.summary.failed > 0) process.exitCode = 1;
}
