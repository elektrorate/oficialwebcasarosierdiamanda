import assert from "node:assert/strict";
import test from "node:test";
import {
  copySessionState,
  SESSION_CACHE_HEADERS,
  shouldRefreshSession,
} from "../src/lib/auth/session-state.ts";

function fakeResponse() {
  const headers = new Headers();
  const cookies: Array<{ name: string; value: string; path?: string; httpOnly?: boolean }> = [];
  return {
    headers,
    cookies: {
      getAll: () => cookies,
      set(cookie: (typeof cookies)[number]) {
        cookies.push(cookie);
      },
    },
    list: cookies,
  };
}

test("refresca la sesión en las rutas del CMS y del login", () => {
  assert.equal(shouldRefreshSession("/admin"), true);
  assert.equal(shouldRefreshSession("/admin/dashboard"), true);
  assert.equal(shouldRefreshSession("/admin/offerings/nuevo"), true);
  assert.equal(shouldRefreshSession("/auth"), true);
});

test("no refresca la sesión en el sitio público", () => {
  assert.equal(shouldRefreshSession("/"), false);
  assert.equal(shouldRefreshSession("/clases"), false);
  assert.equal(shouldRefreshSession("/blog/una-entrada"), false);
  assert.equal(shouldRefreshSession("/shop"), false);
});

test("no confunde prefijos parecidos con el CMS", () => {
  assert.equal(shouldRefreshSession("/administracion"), false);
  assert.equal(shouldRefreshSession("/autenticacion"), false);
  assert.equal(shouldRefreshSession("/api/admin/pages"), false);
});

test("normaliza rutas sin barra inicial", () => {
  assert.equal(shouldRefreshSession("admin"), true);
  assert.equal(shouldRefreshSession("auth"), true);
  assert.equal(shouldRefreshSession("clases"), false);
});

test("copySessionState transfiere las cookies renovadas al destino", () => {
  const source = fakeResponse();
  source.cookies.set({ name: "sb-token", value: "nuevo", path: "/", httpOnly: true });
  const target = fakeResponse();

  copySessionState(target, source);

  assert.deepEqual(target.list, [{ name: "sb-token", value: "nuevo", path: "/", httpOnly: true }]);
});

test("copySessionState propaga las cabeceras anti-caché de Supabase", () => {
  const source = fakeResponse();
  source.headers.set("cache-control", "private, no-cache, no-store, must-revalidate, max-age=0");
  source.headers.set("expires", "0");
  const target = fakeResponse();

  copySessionState(target, source);

  for (const header of SESSION_CACHE_HEADERS) {
    if (source.headers.get(header)) assert.equal(target.headers.get(header), source.headers.get(header));
  }
  assert.equal(target.headers.get("cache-control"), "private, no-cache, no-store, must-revalidate, max-age=0");
});

test("copySessionState no pisa cabeceras del destino si Supabase no las envía", () => {
  const source = fakeResponse();
  const target = fakeResponse();
  target.headers.set("cache-control", "public, s-maxage=60");

  copySessionState(target, source);

  assert.equal(target.headers.get("cache-control"), "public, s-maxage=60");
});

test("copySessionState no toca el destino cuando no hay sesión", () => {
  const source = fakeResponse();
  const target = fakeResponse();

  copySessionState(target, source);

  assert.deepEqual(target.list, []);
  assert.equal(target.headers.get("cache-control"), null);
});
