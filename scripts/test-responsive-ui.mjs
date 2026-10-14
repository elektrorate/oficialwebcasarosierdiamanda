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

async function assertStudioLayout(page, label) {
  await page.locator("body.studio-page").waitFor({ state: "attached" });
  await page.locator(".social__viewport").waitFor({ state: "visible" });
  await page.locator(".testimonial__dots").waitFor({ state: "visible" });
  await page.locator("#contacto-footer > .container").waitFor({ state: "visible" });
  await page.evaluate(async () => { await document.fonts.ready; });
  await assertNoHorizontalOverflow(page, label);

  const result = await page.evaluate(() => {
    const social = document.querySelector(".social--home-strip");
    const socialContainer = social?.querySelector(".container");
    const socialViewport = social?.querySelector(".social__viewport");
    const socialTrack = social?.querySelector(".social__track");
    const cards = [...(social?.querySelectorAll(".social__slide") ?? [])];
    const testimonialContainer = document.querySelector(".testimonial__container");
    const testimonialViewport = document.querySelector(".testimonial__viewport");
    const slides = [...document.querySelectorAll(".testimonial__slide")];
    const dots = document.querySelector(".testimonial__dots");
    const footer = document.querySelector("#footer");
    const footerContainer = footer?.querySelector("#contacto-footer > .container");
    if (!social || !socialContainer || !socialViewport || !socialTrack || !cards.length ||
        !testimonialContainer || !testimonialViewport || !slides.length || !dots || !footer || !footerContainer) return null;

    const errors = [];
    const check = (condition, message) => { if (!condition) errors.push(message); };
    const center = (box) => box.left + box.width / 2;
    const within = (box, parent) => box.width > 0 && box.left >= parent.left - 1 && box.right <= parent.right + 1;
    const clips = (element) => {
      const style = getComputedStyle(element);
      return style.overflowX === "hidden" && style.overflowY === "hidden";
    };
    const socialBox = socialContainer.getBoundingClientRect();
    const socialViewportBox = socialViewport.getBoundingClientRect();
    const cardBox = cards[0].getBoundingClientRect();
    const visibleCards = window.innerWidth <= 640 ? 2 : window.innerWidth <= 992 ? 3 : 5;
    const gap = Number.parseFloat(getComputedStyle(socialTrack).columnGap);
    check(clips(socialViewport), "el viewport social no tiene overflow hidden");
    check(within(socialBox, social.getBoundingClientRect()) && Math.abs(center(socialBox) - window.innerWidth / 2) <= 1,
      "el contenedor social no esta centrado dentro de la seccion");
    check(Math.abs(socialViewportBox.width - socialBox.width) <= 1 && Math.abs(center(socialViewportBox) - center(socialBox)) <= 1,
      "el viewport social no conserva el ancho y centro de su contenedor");
    check(cards.length >= visibleCards && Number.isFinite(gap) &&
      Math.abs(cardBox.width * visibleCards + gap * (visibleCards - 1) - socialViewportBox.width) <= 1,
    `la galeria social no muestra ${visibleCards} tarjetas por viewport`);
    for (const card of cards) {
      const box = card.getBoundingClientRect();
      const item = card.querySelector(".social__item")?.getBoundingClientRect();
      check(box.width > 0 && box.height > 0 && Math.abs(box.width - cardBox.width) <= 1 &&
        Math.abs(box.height - box.width * 5 / 4) <= 1 && item &&
        Math.abs(item.width - box.width) <= 1 && Math.abs(item.height - box.height) <= 1,
      "las tarjetas sociales no conservan su proporcion 4/5");
    }
    // El track puede desbordar dentro del viewport, pero no sus contenedores exteriores.
    check(social.scrollWidth <= social.clientWidth + 1 && socialContainer.scrollWidth <= socialContainer.clientWidth + 1,
      "la seccion social tiene scrollWidth exterior extra");

    const testimonialBox = testimonialContainer.getBoundingClientRect();
    const testimonialViewportBox = testimonialViewport.getBoundingClientRect();
    check(testimonialBox.width > 0 && testimonialBox.width <= 561 && Math.abs(center(testimonialBox) - window.innerWidth / 2) <= 1,
      "el contenedor testimonial supera 560px o no esta centrado");
    check(clips(testimonialViewport) && within(testimonialViewportBox, testimonialBox) &&
      Math.abs(center(testimonialViewportBox) - center(testimonialBox)) <= 1,
    "el viewport testimonial no esta centrado o no tiene overflow hidden");
    for (const slide of slides) {
      const box = slide.getBoundingClientRect();
      check(getComputedStyle(slide).display === "grid" && box.height > 0 && Math.abs(box.width - testimonialViewportBox.width) <= 1,
        "el slide testimonial no es grid o no ocupa el ancho del viewport");
    }
    check(getComputedStyle(dots).display === "flex", "los dots del testimonial no usan flex");

    const footerBox = footerContainer.getBoundingClientRect();
    const form = footerContainer.querySelector("form");
    const formBox = form?.getBoundingClientRect();
    check(footerBox.width > 0 && footerBox.width <= 561 && Math.abs(center(footerBox) - window.innerWidth / 2) <= 1,
      "el contenedor del footer supera 560px o no esta centrado");
    check(footer.scrollWidth <= footer.clientWidth + 1 && footerContainer.scrollWidth <= footerContainer.clientWidth + 1,
      "el footer tiene desplazamiento horizontal");
    if (form) {
      check(within(formBox, footerBox) && form.scrollWidth <= form.clientWidth + 1, "el formulario sale del contenedor del footer");
      for (const field of form.querySelectorAll("input:not([type='hidden']), textarea, select, button")) {
        check(within(field.getBoundingClientRect(), formBox), "un campo del footer sale del formulario");
      }
      for (const row of form.querySelectorAll(":scope > .grid")) {
        const style = getComputedStyle(row);
        check(style.display === "grid" && style.gridTemplateColumns.split(/\s+/).length === (window.innerWidth <= 640 ? 1 : 2),
          "las columnas del formulario no respetan el breakpoint de 640px");
      }
    }
    const legalNav = footerContainer.querySelector("nav[aria-label='Enlaces legales del sitio']");
    if (legalNav) {
      const style = getComputedStyle(legalNav);
      check(style.display === "grid" && style.gridTemplateColumns.split(/\s+/).length === (window.innerWidth <= 640 ? 2 : 3),
        "las columnas legales del footer no respetan el breakpoint de 640px");
    }

    return {
      errors,
      dimensions: {
        socialWidth: socialViewportBox.width, socialCenter: center(socialViewportBox),
        socialCardWidth: cardBox.width, socialCardHeight: cardBox.height,
        testimonialContainerWidth: testimonialBox.width,
        testimonialWidth: testimonialViewportBox.width, testimonialHeight: testimonialViewportBox.height,
        testimonialCenter: center(testimonialViewportBox), testimonialSlideWidth: slides[0].getBoundingClientRect().width,
        footerWidth: footerBox.width, footerCenter: center(footerBox),
        footerFormWidth: formBox?.width ?? 0, footerFormHeight: formBox?.height ?? 0,
      },
    };
  });

  if (!result) fail(`${label} no contiene la estructura social, testimonial y footer esperada.`);
  if (result.errors.length) fail(`${label}: ${result.errors.join("; ")}.`);
  return result.dimensions;
}

const browser = await chromium.launch({ executablePath: edgePath, headless: true });
const report = { baseUrl: baseUrl.href, checkedAt: new Date().toISOString(), mobile: [], desktop: null, studio: [] };

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

  for (const viewport of [{ width: 1440, height: 900 }, { width: 768, height: 1024 }, ...mobileViewports]) {
    const isMobile = viewport.width <= 640;
    // La primera carga de cada contexto debe ser El estudio, sin CSS heredado de Inicio.
    const context = await browser.newContext({ viewport, isMobile, hasTouch: isMobile, reducedMotion: "reduce" });
    const page = await context.newPage();
    const label = `El estudio ${viewport.width}px`;
    await page.goto(new URL("/el-estudio", baseUrl).href, { waitUntil: "domcontentloaded", timeout: 30000 });
    const direct = await assertStudioLayout(page, `${label} directo`);

    const dots = page.locator(".testimonial__dot");
    if (await dots.count() < 2) fail(`${label} necesita dos testimonios para comprobar la transicion.`);
    if (await dots.first().getAttribute("aria-pressed") !== "true") fail(`${label} no inicia en el primer testimonio.`);
    await dots.nth(1).click();
    await page.waitForFunction(() => {
      const dots = [...document.querySelectorAll(".testimonial__dot")];
      const viewport = document.querySelector(".testimonial__viewport")?.getBoundingClientRect();
      const slide = document.querySelectorAll(".testimonial__slide")[1]?.getBoundingClientRect();
      return dots[1]?.getAttribute("aria-pressed") === "true" && dots[1].classList.contains("is-active") &&
        dots.filter((dot) => dot.getAttribute("aria-pressed") === "true").length === 1 &&
        dots.filter((dot) => dot.classList.contains("is-active")).length === 1 && viewport && slide &&
        Math.abs(slide.left - viewport.left) <= 1;
    }, null, { timeout: 5000 });

    const activeSlide = page.locator(".testimonial__slide").nth(1);
    const author = (await activeSlide.locator(".testimonial__author").textContent()).trim();
    await openModal(page, activeSlide, ".testimonial-modal", `${label}: modal testimonial`);
    const modal = page.locator(".testimonial-modal");
    if ((await modal.locator(".testimonial-modal__author").textContent()).trim() !== author) {
      fail(`${label} no abre el testimonio del slide activo.`);
    }
    await page.waitForFunction(() => document.body.classList.contains("modal-open"));
    await page.keyboard.press("Escape");
    await modal.waitFor({ state: "hidden" });
    await page.waitForFunction(() => !document.body.classList.contains("modal-open"));

    await page.goto(baseUrl.href, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.locator(".site-nav-shell--home[data-navigation-ready='true']").waitFor({ state: "attached" });
    let studioLink;
    if (viewport.width < 1025) {
      await page.locator(".mobile-scroll-nav__toggle").first().click();
      await page.locator("#mobile-scroll-menu").waitFor({ state: "visible" });
      studioLink = page.locator("#mobile-scroll-menu a[href='/el-estudio']").first();
      if (!(await studioLink.isVisible())) {
        await page.locator("#mobile-scroll-menu .mobile-menu__item")
          .filter({ has: page.locator("a[href='/el-estudio']") }).locator(".mobile-menu__link--submenu").click();
      }
    } else {
      await page.locator(".social__viewport").scrollIntoViewIfNeeded();
      studioLink = page.locator(".scroll-desktop-nav__link[href='/el-estudio']").first();
    }
    await studioLink.waitFor({ state: "visible" });
    await page.evaluate(() => { window.__responsiveStudioNavigation = true; });
    await studioLink.click();
    await page.waitForURL((url) => url.pathname === "/el-estudio", { timeout: 30000 });
    const navigated = await assertStudioLayout(page, `${label} tras Inicio`);
    if (!(await page.evaluate(() => window.__responsiveStudioNavigation === true))) {
      fail(`${label} no se ha abierto mediante navegacion cliente.`);
    }
    for (const [name, value] of Object.entries(direct)) {
      if (Math.abs(navigated[name] - value) > 1) {
        fail(`${label} cambia ${name} tras navegar desde Inicio: ${value} -> ${navigated[name]}.`);
      }
    }
    report.studio.push({ viewport, direct, testimonialDot: "ok", testimonialModal: "ok", clientNavigation: "ok" });
    await context.close();
  }
} finally {
  await browser.close();
}

console.log(JSON.stringify(report, null, 2));
