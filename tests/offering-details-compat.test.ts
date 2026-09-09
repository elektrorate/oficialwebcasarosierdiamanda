import assert from "node:assert/strict";
import test from "node:test";
import {
  clearLegacyOfferingContent,
  mergeCurrentOfferingDetails,
} from "../src/lib/cms/offering-details-compat.ts";

test("los valores modernos vacíos prevalecen sobre el contenido heredado", () => {
  const merged = mergeCurrentOfferingDetails({
    introHighlight: "Texto anterior",
    includedItems: ["Material anterior"],
    class: {
      class: { highlightDescription: "Copia interna anterior" },
      highlightDescription: "",
      includedItems: [],
      content: { modules: [] },
    },
  });

  assert.equal(merged.highlightDescription, "");
  assert.deepEqual(merged.includedItems, []);
  assert.deepEqual(merged.content, { modules: [] });
  assert.equal(Object.hasOwn(merged, "class"), false);
});

test("el guardado neutraliza aliases antiguos sin perder metadatos", () => {
  const cleared = clearLegacyOfferingContent({
    source: "legacy-import",
    legacyId: "old-1",
    introHighlight: "Texto anterior",
    program: [{ title: "Bloque anterior" }],
    included: ["Material anterior"],
    additionalInfo: "Información anterior",
    class: { highlightDescription: "Contenido actual" },
  });

  assert.equal(cleared.source, "legacy-import");
  assert.equal(cleared.legacyId, "old-1");
  assert.equal(cleared.introHighlight, "");
  assert.deepEqual(cleared.program, []);
  assert.deepEqual(cleared.included, []);
  assert.equal(cleared.additionalInfo, "");
  assert.equal(Object.hasOwn(cleared, "class"), false);
});
