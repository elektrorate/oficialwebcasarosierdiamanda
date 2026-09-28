import assert from "node:assert/strict";
import test from "node:test";
import { validateSettingsPayload } from "../src/lib/cms/settings-schema.ts";

test("acepta un payload completo y válido", () => {
  const result = validateSettingsPayload({
    site: { site_name: "Casa Rosier", default_language: "es", timezone: "Europe/Madrid" },
    seo: { robots_index: true, robots_follow: true },
  });
  assert.equal(result.ok, true);
  assert.equal((result.value as { site: Record<string, unknown> }).site.site_name, "Casa Rosier");
});

test("rechaza estructuras que no son objetos", () => {
  const result = validateSettingsPayload("bad");
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("objeto de ajustes")));
});

test("rechaza secciones desconocidas", () => {
  const result = validateSettingsPayload({ bogus: { x: 1 } });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("sección desconocida")));
});

test("rechaza colores que no son hexadecimal", () => {
  const result = validateSettingsPayload({ menu: { scroll_menu_background_color: "red" } });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("color hexadecimal")));
});

test("rechaza URLs inseguras", () => {
  const result = validateSettingsPayload({ contact: { map_url: "javascript:alert(1)" } });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("URL http(s)")));
});

test("rechaza campos desconocidos dentro de una sección", () => {
  const result = validateSettingsPayload({ seo: { robots_index: true, badField: 1 } });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("campo desconocido")));
});

test("normaliza colores a mayúsculas y recorta texto", () => {
  const result = validateSettingsPayload({ menu: { scroll_menu_background_color: " #f9f8f3 " } });
  assert.equal(result.ok, true);
  assert.equal((result.value as { menu: Record<string, unknown> }).menu.scroll_menu_background_color, "#F9F8F3");
});

test("rechaza zona horaria IANA no válida", () => {
  const result = validateSettingsPayload({ site: { timezone: "Galaxia/Andromeda" } });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("zona horaria IANA")));
});

test("rechaza idioma no admitido", () => {
  const result = validateSettingsPayload({ site: { default_language: "klingon" } });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("idioma no admitido")));
});

test("rechaza site_name vacío", () => {
  const result = validateSettingsPayload({ site: { site_name: "", default_language: "es", timezone: "Europe/Madrid" } });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("no puede quedar vacío")));
});

test("permite campos server-managed sin error", () => {
  const result = validateSettingsPayload({ system: { updated_at: "2026-01-01T00:00:00.000Z" } });
  assert.equal(result.ok, true);
});
