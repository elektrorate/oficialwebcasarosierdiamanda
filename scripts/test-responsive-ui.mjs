import { chromium } from "playwright-core";

const baseUrl = new URL(process.argv[2] || "http://localhost:3000");
const offeringPath = process.env.E2E_OFFERING_PATH || "/cursos/coworking-de-investigacion-tecnica-de-esmaltes-y-engobes";
const edgePath = process.env.EDGE_PATH || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";

const mobileViewports = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
];

function fail(message) {
  throw new Error(`Responsive E2E: ${message}`);
}

async function assertNoHorizontalOverflow(page, label) {
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  if (hasOverflow) fail(`${label} tiene desplazamiento horizontal.`);
}

async function assertModalLayout(page, selector, label) {
  const result = await page.locator(selector).evaluate((modal) => {
    const panel = modal.querySelector(".ig-modal__panel");
    const media = modal.querySelector(".ig-modal__media");
    const image = media?.querySelector("img");
    const content = modal.querySelector(".ig-modal__content");
    if (!panel || !media || !image || !content) return null;
    const panelBox = panel.getBoundingClientRect();
    const mediaBox = media.getBoundingClientRect();
    const imageBox = image.getBoundingClientRect();
    const contentBox = content.getBoundingClientRect();
    return {
      panelHeight: panelBox.height,
      panelOverflow: panel.scrollHeight - panel.clientHeight,
      contentOverflow: content.scrollHeight - content.clientHeight,
      imageHeightDifference: Math.abs(imageBox.height - mediaBox.height),
      imageWidthDifference: Math.abs(imageBox.width - mediaBox.width),
      contentHeight: contentBox.height,
    };
  });

  if (!result) fail(`${label} no contiene su estructura esperada.`);
  if (result.panelHeight <= 0 || result.contentHeight <= 0) fail(`${label} no reserva espacio para contenido.`);
  if (result.panelOverflow > 1 || result.contentOverflow > 1) fail(`${label} genera scroll vertical.`);
  if (result.imageHeightDifference > 1 || result.imageWidthDifference > 1) fail(`${label} no llena por completo su área de imagen.`);
  return result;
}

async function openModal(page, trigger, selector, label) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await trigger.scrollIntoViewIfNeeded();
    await trigger.evaluate((element) => element.click());
    try {
      await page.locator(selector).waitFor({ state: "visible", timeout: 4000 });
      return;
    } catch {
      await page.waitForTimeout(500);
    }
  }
  fail(`${label} no se abre después de tres intentos.`);
}

const browser = await chromium.launch({ executablePath: edgePath, headless: true });
const report = { baseUrl: baseUrl.href, checkedAt: new Date().toISOString(), mobile: [], desktop: null };

try {
  for (const viewport of mobileViewports) {
    const context = await browser.newContext({ viewport, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto(baseUrl.href, { waitUntil: "domcontentloaded", timeout: 30000 });
    await assertNoHorizontalOverflow(page, `Inicio ${viewport.width}px`);

    const menuToggle = page.locator(".mobile-scroll-nav__toggle").first();
    if (!(await menuToggle.isVisible())) fail(`No se muestra el menú móvil a ${viewport.width}px.`);
    await menuToggle.click();
    const mobileMenu = page.locator("#mobile-scroll-menu");
    if (await mobileMenu.getAttribute("hidden")) fail(`El menú móvil no se abre a ${viewport.width}px.`);
    await assertNoHorizontalOverflow(page, `Menú móvil ${viewport.width}px`);
    await page.locator(".mobile-scroll-nav__toggle").first().click();

    report.mobile.push({ viewport, menu: "ok" });
    await context.close();
  }

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(baseUrl.href, { waitUntil: "domcontentloaded", timeout: 30000 });
  await mobilePage.waitForTimeout(1200);
  const socialTrigger = mobilePage.locator(".social__item:not([tabindex='-1'])").first();
  if (!(await socialTrigger.count())) fail("No hay un disparador para el modal social en Inicio.");
  await openModal(mobilePage, socialTrigger, ".social-gallery-modal", "El modal social");
  report.mobile[1].socialModal = await assertModalLayout(mobilePage, ".social-gallery-modal", "Modal social móvil");
  await mobilePage.locator(".social-gallery-modal .ig-modal__icon-btn--close").evaluate((element) => element.click());

  await mobilePage.goto(new URL(offeringPath, baseUrl).href, { waitUntil: "domcontentloaded", timeout: 30000 });
  await mobilePage.waitForTimeout(1200);
  const offeringTrigger = mobilePage.locator(".class-gallery__expand").first();
  if (!(await offeringTrigger.count())) fail("No hay imagen ampliable en el offering de prueba.");
  await openModal(mobilePage, offeringTrigger, ".offering-gallery-modal", "El modal de offering");
  report.mobile[1].offeringModal = await assertModalLayout(mobilePage, ".offering-gallery-modal", "Modal de offering móvil");
  await mobileContext.close();

  const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto(baseUrl.href, { waitUntil: "domcontentloaded", timeout: 30000 });
  await assertNoHorizontalOverflow(desktopPage, "Inicio desktop");
  report.desktop = { viewport: { width: 1440, height: 900 }, home: "ok" };
  await desktopContext.close();
} finally {
  await browser.close();
}

console.log(JSON.stringify(report, null, 2));
