import assert from "node:assert/strict";
import test from "node:test";
import { isAuthorizedCronRequest } from "../src/lib/security/cron-auth.ts";

test("rechaza cuando CRON_SECRET no está definido (fail-closed)", () => {
  assert.equal(isAuthorizedCronRequest("Bearer cualquier-secreto", undefined), false);
  assert.equal(isAuthorizedCronRequest("Bearer cualquier-secreto", null), false);
});

test("rechaza cuando el secreto configurado está vacío", () => {
  assert.equal(isAuthorizedCronRequest("Bearer ", ""), false);
  assert.equal(isAuthorizedCronRequest("Bearer ", "   "), false);
});

test("rechaza cuando falta el header Authorization", () => {
  assert.equal(isAuthorizedCronRequest(null, "secreto-valido"), false);
  assert.equal(isAuthorizedCronRequest("", "secreto-valido"), false);
  assert.equal(isAuthorizedCronRequest("Bearer ", "secreto-valido"), false);
});

test("rechaza un secreto incorrecto", () => {
  assert.equal(isAuthorizedCronRequest("Bearer secreto-incorrecto", "secreto-valido"), false);
  assert.equal(isAuthorizedCronRequest("secreto-valido", "secreto-valido"), false);
  assert.equal(isAuthorizedCronRequest("Bearer secreto-valido-extra", "secreto-valido"), false);
});

test("acepta el secreto correcto en el formato que usa Vercel", () => {
  assert.equal(isAuthorizedCronRequest("Bearer secreto-valido", "secreto-valido"), true);
  assert.equal(isAuthorizedCronRequest("bearer secreto-valido", "secreto-valido"), true);
  assert.equal(isAuthorizedCronRequest("Bearer  secreto-valido ", "secreto-valido"), true);
});

test("no acepta un prefijo parcial del secreto", () => {
  assert.equal(isAuthorizedCronRequest("Bearer secre", "secreto-valido"), false);
});
