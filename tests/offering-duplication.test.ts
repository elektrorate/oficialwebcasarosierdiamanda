import assert from "node:assert/strict";
import test from "node:test";
import { duplicateOfferingIdentity } from "../src/lib/cms/offering-duplication.ts";
import type { Offering } from "../src/lib/cms/types.ts";

function offering(overrides: Partial<Offering> = {}): Offering {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    type: "class",
    title: "Curso de cerámica",
    slug: "curso-de-ceramica",
    subtitle: "",
    excerpt: "",
    description: "",
    price: null,
    currency: "EUR",
    status: "published",
    featured: false,
    header_id: null,
    duration: "",
    schedule: [],
    teacher: "",
    capacity: null,
    cover_image_url: "",
    gallery: [],
    details: { class: { menuTitle: "Curso de cerámica" } },
    seo_title: "",
    seo_description: "",
    expiration_enabled: false,
    expires_at: null,
    expired_at: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    deleted_at: null,
    ...overrides,
  };
}

test("la primera copia recibe título, nombre de menú y slug únicos", () => {
  const original = offering({ id: "original" });
  const identity = duplicateOfferingIdentity(original, [original]);

  assert.equal(identity.title, "Curso de cerámica (copia)");
  assert.equal(identity.menuTitle, "Curso de cerámica (copia)");
  assert.equal(identity.details.class?.menuTitle, "Curso de cerámica (copia)");
  assert.equal(identity.slug, "curso-de-ceramica-2");
});

test("las copias sucesivas avanzan título, nombre de menú y slug sin colisiones", () => {
  const original = offering({ id: "original" });
  const firstCopy = offering({
    id: "copy-1",
    title: "Curso de cerámica (copia)",
    slug: "curso-de-ceramica-2",
    details: { class: { menuTitle: "Curso de cerámica (copia)" } },
  });
  const identity = duplicateOfferingIdentity(firstCopy, [original, firstCopy]);

  assert.equal(identity.title, "Curso de cerámica (copia 2)");
  assert.equal(identity.menuTitle, "Curso de cerámica (copia 2)");
  assert.equal(identity.slug, "curso-de-ceramica-3");
});
