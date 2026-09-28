import assert from "node:assert/strict";
import test from "node:test";
import {
  isValidTimeZone,
  resolveSiteTimeZone,
  formatSiteDate,
  formatSiteDateBadge,
  DEFAULT_SITE_TIME_ZONE,
} from "../src/lib/seo/site-timezone.ts";

test("acepta zonas horarias IANA válidas", () => {
  assert.equal(isValidTimeZone("Europe/Madrid"), true);
  assert.equal(isValidTimeZone("America/New_York"), true);
});

test("rechaza zonas horarias inventadas", () => {
  assert.equal(isValidTimeZone("Galaxia/Andromeda"), false);
  assert.equal(isValidTimeZone(""), false);
  assert.equal(isValidTimeZone(42), false);
});

test("resolveSiteTimeZone devuelve el valor o el respaldo", () => {
  assert.equal(resolveSiteTimeZone("Europe/Madrid"), "Europe/Madrid");
  assert.equal(resolveSiteTimeZone(""), DEFAULT_SITE_TIME_ZONE);
  assert.equal(resolveSiteTimeZone(undefined), DEFAULT_SITE_TIME_ZONE);
  assert.equal(resolveSiteTimeZone("Zona/Inexistente"), DEFAULT_SITE_TIME_ZONE);
});

test("formatSiteDate formatea con la zona indicada", () => {
  const result = formatSiteDate("2026-07-14T10:00:00.000Z", "Europe/Madrid");
  assert.ok(result.includes("14"));
});

test("formatSiteDate devuelve vacío para valor vacío", () => {
  assert.equal(formatSiteDate("", "Europe/Madrid"), "");
  assert.equal(formatSiteDate(undefined, "Europe/Madrid"), "");
});

test("formatSiteDateBadge devuelve el badge en la zona del sitio", () => {
  const result = formatSiteDateBadge("2026-07-14T10:00:00.000Z", "Europe/Madrid");
  assert.ok(result.length > 0);
  assert.equal(formatSiteDateBadge("", "Europe/Madrid"), "");
});

test("formatSiteDate formatea con UTC cuando se pasa explícitamente", () => {
  const madrid = formatSiteDate("2026-07-14T23:00:00.000Z", "Europe/Madrid");
  const utc = formatSiteDate("2026-07-14T23:00:00.000Z", "UTC");
  assert.notEqual(madrid, utc);
});
