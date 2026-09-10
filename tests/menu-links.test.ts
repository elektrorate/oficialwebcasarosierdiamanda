import assert from "node:assert/strict";
import test from "node:test";
import {
  menuUrlValidationMessage,
  normalizeMenuUrl,
  systemMenuRootId,
  systemMenuRootKey,
} from "../src/lib/cms/menu-links.ts";

test("acepta rutas internas y conserva query y fragmento", () => {
  assert.equal(normalizeMenuUrl(" /experiencias?tipo=grupo#reserva "), "/experiencias?tipo=grupo#reserva");
  assert.equal(normalizeMenuUrl("/#hero"), "/#hero");
});

test("acepta enlaces web absolutos seguros", () => {
  assert.equal(normalizeMenuUrl("https://example.com/reservar"), "https://example.com/reservar");
  assert.equal(normalizeMenuUrl("http://example.com"), "http://example.com");
});

test("rechaza rutas vacías, relativas o con protocolos no admitidos", () => {
  assert.equal(normalizeMenuUrl(""), null);
  assert.equal(normalizeMenuUrl("experiencias"), null);
  assert.equal(normalizeMenuUrl("//example.com"), null);
  assert.equal(normalizeMenuUrl("javascript:alert(1)"), null);
  assert.match(menuUrlValidationMessage("experiencias") ?? "", /empiece por/);
});

test("mantiene una identidad estable para las raíces del menú", () => {
  const identity = systemMenuRootId("experiencias");
  assert.equal(identity, "menu-root:experiencias");
  assert.equal(systemMenuRootKey(identity), "experiencias");
  assert.equal(systemMenuRootKey("offering-id"), null);
});
