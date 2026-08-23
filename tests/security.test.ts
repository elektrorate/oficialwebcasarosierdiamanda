import assert from "node:assert/strict";
import test from "node:test";
import { ADMIN_ROLES, USER_ROLES, canManageUsers, isAdminRole, isUserRole } from "../src/lib/auth/roles.ts";
import {
  ALLOWED_UPLOAD_EXTENSIONS,
  hasAllowedFileSignature,
  MAX_UPLOAD_SIZE,
} from "../src/lib/security/file-upload.ts";
import {
  ApiRequestError,
  readJsonObject,
} from "../src/lib/security/request-validation.ts";

test("solo admin y editor pueden entrar al CMS", () => {
  assert.deepEqual(ADMIN_ROLES, ["admin", "editor"]);
  assert.equal(isAdminRole("admin"), true);
  assert.equal(isAdminRole("editor"), true);
  assert.equal(isAdminRole("teacher"), false);
  assert.equal(isAdminRole("collaborator"), false);
  assert.equal(isAdminRole("owner"), false);
});

test("acepta un objeto JSON valido", async () => {
  const request = new Request("http://localhost/api", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ email: "admin@example.com" }),
  });
  assert.deepEqual(await readJsonObject(request, 1024), { email: "admin@example.com" });
});

test("rechaza contenido que no sea JSON", async () => {
  const request = new Request("http://localhost/api", {
    method: "POST",
    headers: { "content-type": "text/plain" },
    body: "hola",
  });
  await assert.rejects(() => readJsonObject(request, 1024), (error: unknown) => {
    return error instanceof ApiRequestError && error.status === 415;
  });
});

test("rechaza JSON invalido y valores que no sean objetos", async () => {
  const invalid = new Request("http://localhost/api", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{",
  });
  await assert.rejects(() => readJsonObject(invalid, 1024), (error: unknown) => {
    return error instanceof ApiRequestError && error.code === "invalid_json";
  });

  const array = new Request("http://localhost/api", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "[]",
  });
  await assert.rejects(() => readJsonObject(array, 1024), (error: unknown) => {
    return error instanceof ApiRequestError && error.code === "invalid_json_object";
  });
});

test("aplica el limite real y el declarado del cuerpo", async () => {
  const declared = new Request("http://localhost/api", {
    method: "POST",
    headers: { "content-type": "application/json", "content-length": "2048" },
    body: "{}",
  });
  await assert.rejects(() => readJsonObject(declared, 1024), (error: unknown) => {
    return error instanceof ApiRequestError && error.status === 413;
  });

  const actual = new Request("http://localhost/api", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ value: "x".repeat(100) }),
  });
  await assert.rejects(() => readJsonObject(actual, 32), (error: unknown) => {
    return error instanceof ApiRequestError && error.status === 413;
  });
});

test("valida firmas reales de imágenes y PDF", () => {
  assert.equal(hasAllowedFileSignature(Buffer.from("ffd8ffe000104a46", "hex"), "jpg"), true);
  assert.equal(hasAllowedFileSignature(Buffer.from("89504e470d0a1a0a", "hex"), "png"), true);
  assert.equal(hasAllowedFileSignature(Buffer.from("474946383961", "hex"), "gif"), true);
  assert.equal(hasAllowedFileSignature(Buffer.from("524946460000000057454250", "hex"), "webp"), true);
  assert.equal(hasAllowedFileSignature(Buffer.from("000000186674797061766966", "hex"), "avif"), true);
  assert.equal(hasAllowedFileSignature(Buffer.from("%PDF-1.7"), "pdf"), true);
});

test("rechaza archivos renombrados y formatos activos", () => {
  assert.equal(hasAllowedFileSignature(Buffer.from("MZ executable"), "jpg"), false);
  assert.equal(hasAllowedFileSignature(Buffer.from("<svg><script/></svg>"), "svg"), false);
  assert.equal(ALLOWED_UPLOAD_EXTENSIONS.has("svg"), false);
  assert.equal(MAX_UPLOAD_SIZE, 10 * 1024 * 1024);
});

test("valida roles y reserva la gestión de usuarios al administrador", () => {
  assert.deepEqual(USER_ROLES, ["admin", "editor", "teacher", "collaborator"]);
  for (const role of USER_ROLES) assert.equal(isUserRole(role), true);
  assert.equal(isUserRole("owner"), false);
  assert.equal(isUserRole(null), false);
  assert.equal(canManageUsers("admin"), true);
  assert.equal(canManageUsers("editor"), false);
  assert.equal(canManageUsers("teacher"), false);
  assert.equal(canManageUsers("collaborator"), false);
});
