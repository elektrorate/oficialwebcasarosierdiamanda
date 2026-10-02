import test from "node:test";
import assert from "node:assert/strict";
import {
  MODAL_CONTENT_LIMITS,
  offeringGalleryModalContentError,
  socialGalleryModalContentError,
} from "../src/lib/cms/modal-content.ts";

test("accepta contenido de modal dentro de los límites", () => {
  assert.equal(offeringGalleryModalContentError({
    details: { galleryImages: [{ modalTitle: "Título", modalDescription: "Descripción" }] },
  }), null);
  assert.equal(socialGalleryModalContentError({
    items: [{ title: "Post", description: "Texto" }],
  }), null);
});

test("rechaza contenido de modal que no cabe sin scroll", () => {
  assert.match(
    offeringGalleryModalContentError({
      details: { galleryImages: [{ modalTitle: "x".repeat(MODAL_CONTENT_LIMITS.title + 1) }] },
    }) ?? "",
    /máximo de 80 caracteres/,
  );
  assert.match(
    socialGalleryModalContentError({
      items: [{ description: "x".repeat(MODAL_CONTENT_LIMITS.description + 1) }],
    }) ?? "",
    /máximo de 280 caracteres/,
  );
});
