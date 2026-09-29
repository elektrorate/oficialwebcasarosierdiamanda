import assert from "node:assert/strict";
import test from "node:test";
import type { ExperienceItem } from "../src/data/types.ts";
import { getClassAndExperienceItems } from "../src/features/home/homeFeaturedItems.ts";

function item(id: string, kind: ExperienceItem["kind"]) {
  return { id, kind } as ExperienceItem;
}

test("agrupa clases y experiencias para los destacados del Home", () => {
  const result = getClassAndExperienceItems([
    item("class-1", "class"),
    item("experience-1", "private-booking"),
    item("workshop-1", "workshop"),
    item("gift-1", "gift-card"),
  ]);

  assert.deepEqual(result.map(({ id }) => id), ["class-1", "experience-1"]);
});
