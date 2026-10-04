import assert from "node:assert/strict";
import test from "node:test";
import { getActionWarnings } from "../src/lib/admin/action-warnings.ts";

test("action warnings accept responses without the optional warnings field", () => {
  for (const value of [undefined, null, "warning", {}, 42]) assert.deepEqual(getActionWarnings(value), []);
});

test("action warnings retain only text notices and never mutate the response", () => {
  const value = ["First notice", null, { message: "Invalid" }, 42, "Second notice"];
  const snapshot = structuredClone(value);
  assert.deepEqual(getActionWarnings(value), ["First notice", "Second notice"]);
  assert.deepEqual(value, snapshot);
});
