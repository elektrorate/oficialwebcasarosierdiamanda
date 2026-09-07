import assert from "node:assert/strict";
import test from "node:test";
import {
  expirationSaveError,
  formatExpirationSummary,
  fromLocalDateTime,
  isPastDueExpiration,
  toLocalDateTimeParts,
} from "../src/lib/cms/offering-expiration.ts";

test("toLocalDateTimeParts devuelve componentes locales de Europa/Madrid", () => {
  // 2026-12-31 23:59 CET (UTC+1)
  const winter = toLocalDateTimeParts("2026-12-31T22:59:00.000Z");
  assert.equal(winter.date, "2026-12-31");
  assert.equal(winter.time, "23:59");

  // 2026-07-15 10:00 UTC = 12:00 CEST (UTC+2)
  const summer = toLocalDateTimeParts("2026-07-15T10:00:00.000Z");
  assert.equal(summer.date, "2026-07-15");
  assert.equal(summer.time, "12:00");

  assert.deepEqual(toLocalDateTimeParts(null), { date: "", time: "" });
});

test("fromLocalDateTime convierte la hora madrileña a UTC (invierno y verano)", () => {
  const winter = fromLocalDateTime("2026-12-31", "23:59", null);
  assert.equal(winter, "2026-12-31T22:59:00.000Z");

  const summer = fromLocalDateTime("2026-07-15", "12:00", null);
  assert.equal(summer, "2026-07-15T10:00:00.000Z");
});

test("fromLocalDateTime redondea el viaje de ida y vuelta", () => {
  const original = "2026-09-30T20:15:00.000Z";
  const parts = toLocalDateTimeParts(original);
  const converted = fromLocalDateTime(parts.date, parts.time, original);
  assert.ok(converted);
  assert.equal(new Date(converted).getTime(), new Date(original).getTime());
});

test("fromLocalDateTime usa 23:59 como hora por defecto", () => {
  assert.equal(fromLocalDateTime("2026-08-01", "", null), "2026-08-01T21:59:00.000Z");
});

test("expirationSaveError valida activación sin fecha", () => {
  const error = expirationSaveError({ expirationEnabled: true, expiresAt: null });
  assert.ok(error && error.includes("falta la fecha"));
});

test("expirationSaveError no bloquea publicar con fecha futura", () => {
  const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  assert.equal(expirationSaveError({ expirationEnabled: true, expiresAt: future, status: "published" }), null);
});

test("expirationSaveError bloquea publicar con fecha vencida", () => {
  const past = new Date(Date.now() - 60 * 1000).toISOString();
  const error = expirationSaveError({ expirationEnabled: true, expiresAt: past, status: "published" });
  assert.ok(error && error.includes("vencida"));
});

test("expirationSaveError permite borrador con fecha pasada", () => {
  const past = new Date(Date.now() - 60 * 1000).toISOString();
  assert.equal(expirationSaveError({ expirationEnabled: true, expiresAt: past, status: "draft" }), null);
});

test("expirationSaveError ignora caducidad desactivada", () => {
  assert.equal(expirationSaveError({ expirationEnabled: false, expiresAt: undefined }), null);
});

test("isPastDueExpiration evalúa solo la caducidad activa", () => {
  const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const past = new Date(Date.now() - 60 * 1000).toISOString();
  assert.equal(isPastDueExpiration({ expiration_enabled: true, expires_at: past }), true);
  assert.equal(isPastDueExpiration({ expiration_enabled: true, expires_at: null }), true);
  assert.equal(isPastDueExpiration({ expiration_enabled: true, expires_at: future }), false);
  assert.equal(isPastDueExpiration({ expiration_enabled: false, expires_at: past }), false);
});

test("formatExpirationSummary muestra el texto con hora madrileña", () => {
  const summary = formatExpirationSummary({
    expiration_enabled: true,
    expires_at: "2026-12-31T22:59:00.000Z",
    expired_at: null,
  });
  assert.ok(summary && summary.startsWith("Caduca el 31 de diciembre de 2026"));
  assert.ok(summary!.includes("23:59"));
});