import assert from "node:assert/strict";
import test from "node:test";
import { isValidPublicSlug, publicSlugError } from "../src/lib/seo/public-slug.ts";

test("acepta slugs públicos normalizados", () => {
  assert.equal(isValidPublicSlug("clases-de-torno-ceramico-barcelona"), true);
  assert.equal(publicSlugError("producto-2026"), null);
});

test("rechaza slugs con forma de URL", () => {
  assert.equal(
    isValidPublicSlug("https-www-casarosierceramica-com-workshops-formulacion-esmaltes-barcelona"),
    false,
  );
  assert.equal(isValidPublicSlug("www-ejemplo-com"), false);
});

test("rechaza slugs vacíos, demasiado largos o sin normalizar", () => {
  assert.equal(isValidPublicSlug(""), false);
  assert.equal(isValidPublicSlug("Con Mayúsculas"), false);
  assert.equal(isValidPublicSlug("a".repeat(161)), false);
});
