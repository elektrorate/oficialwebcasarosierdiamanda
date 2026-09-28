import assert from "node:assert/strict";
import test from "node:test";
import {
  isMaintenanceExemptPath,
  resolveMaintenanceDecision,
  maintenancePageHtml,
  MAINTENANCE_STATUS,
} from "../src/lib/cms/maintenance.ts";

test("las rutas admin y auth nunca se bloquean", () => {
  assert.equal(isMaintenanceExemptPath("/admin"), true);
  assert.equal(isMaintenanceExemptPath("/admin/dashboard"), true);
  assert.equal(isMaintenanceExemptPath("/auth"), true);
  assert.equal(isMaintenanceExemptPath("/auth/login"), true);
});

test("las rutas API nunca se bloquean", () => {
  assert.equal(isMaintenanceExemptPath("/api/admin/settings"), true);
  assert.equal(isMaintenanceExemptPath("/api/auth/login"), true);
});

test("los recursos estáticos nunca se bloquean", () => {
  assert.equal(isMaintenanceExemptPath("/favicon.ico"), true);
  assert.equal(isMaintenanceExemptPath("/robots.txt"), true);
  assert.equal(isMaintenanceExemptPath("/sitemap.xml"), true);
  assert.equal(isMaintenanceExemptPath("/_next/static/main.js"), true);
});

test("las rutas públicas SÍ se bloquean en mantenimiento", () => {
  assert.equal(isMaintenanceExemptPath("/"), false);
  assert.equal(isMaintenanceExemptPath("/clases"), false);
  assert.equal(isMaintenanceExemptPath("/blog"), false);
});

test("sin modo mantenimiento se permite todo", () => {
  assert.equal(resolveMaintenanceDecision({ maintenanceMode: false, pathname: "/" }), "allow");
});

test("con modo mantenimiento se bloquean las públicas", () => {
  assert.equal(resolveMaintenanceDecision({ maintenanceMode: true, pathname: "/" }), "block");
});

test("con modo mantenimiento se permite admin y auth", () => {
  assert.equal(resolveMaintenanceDecision({ maintenanceMode: true, pathname: "/admin" }), "allow");
  assert.equal(resolveMaintenanceDecision({ maintenanceMode: true, pathname: "/auth" }), "allow");
  assert.equal(resolveMaintenanceDecision({ maintenanceMode: true, pathname: "/api/forms" }), "allow");
});

test("la página de mantenimiento incluye metadatos de robots y el código de estado", () => {
  const html = maintenancePageHtml("Casa Rosier", "es");
  assert.ok(html.includes('name="robots" content="noindex, nofollow"'));
  assert.ok(html.includes("<h1>Estamos Actualizando</h1>"));
  assert.ok(html.includes(`<meta name="viewport" content="width=device-width, initial-scale=1">`));
});

test("la página de mantenimiento en inglés funciona", () => {
  const html = maintenancePageHtml("Casa Rosier", "en");
  assert.ok(html.includes("We are updating"));
});

test("escape de HTML en la página de mantenimiento", () => {
  const html = maintenancePageHtml("<script>alert(1)</script>", "es");
  assert.ok(!html.includes("<script>alert(1)</script>"));
  assert.ok(html.includes("&lt;script&gt;"));
});

test("MAINTENANCE_STATUS es 503", () => {
  assert.equal(MAINTENANCE_STATUS, 503);
});
