import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import type { CookieOptions } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import ts from "typescript";
import * as sessionState from "../src/lib/auth/session-state.ts";
import * as roles from "../src/lib/auth/roles.ts";

const { NextResponse } = createRequire(import.meta.url)("next/server") as typeof import("next/server");
const sessionEnv = { NEXT_PUBLIC_SUPABASE_URL: "https://auth.example", NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key" };

// Only these source modules and explicitly supplied imports can run; env and logs are isolated.
function loadModule<T>(
  path: "lib/auth/session-refresh.ts" | "lib/admin/users.ts",
  dependencies: Record<string, unknown>,
  env: Record<string, string | undefined> = {},
  errors: unknown[][] = [],
): T {
  const compiled = ts.transpileModule(readFileSync(new URL(`../src/${path}`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const exports = {};
  new Function("require", "exports", "process", "console", compiled)((name: string) => {
    if (Object.hasOwn(dependencies, name)) return dependencies[name];
    throw new Error(`Unmocked dependency: ${name}`);
  }, exports, { env }, { error: (...args: unknown[]) => errors.push(args) });
  return exports as T;
}

type SessionCookie = { name: string; value: string; options?: CookieOptions };
type ServerCookies = {
  getAll(): Array<{ name: string; value: string }>;
  setAll(cookies: SessionCookie[], headers: Record<string, string>): void;
};

function sessionFixture(
  onClaims: (cookies: ServerCookies) => void | Promise<void> = () => {},
  env: Record<string, string | undefined> = sessionEnv,
) {
  const incoming = new Map([
    ["sb-session.0", "expired-access-token"], ["sb-session.1", "expired-refresh-token"], ["preference", "dark"],
  ]);
  const headers = new Headers({ cookie: Array.from(incoming, ([name, value]) => `${name}=${value}`).join("; ") });
  const request = {
    headers,
    cookies: {
      getAll: () => Array.from(incoming, ([name, value]) => ({ name, value })),
      set(name: string, value: string) {
        incoming.set(name, value);
        headers.set("cookie", Array.from(incoming, ([name, value]) => `${name}=${value}`).join("; "));
      },
    },
  } as unknown as NextRequest;
  const errors: unknown[][] = [];
  const forwardedCookies: Array<string | null> = [];
  let clientCalls = 0;
  let claimsCalls = 0;
  const { createSessionRefresher } = loadModule<typeof import("../src/lib/auth/session-refresh.ts")>("lib/auth/session-refresh.ts", {
    "./session-state": sessionState,
    "next/server": { NextResponse: { next: (options: { request: NextRequest }) => {
      assert.equal(options.request, request);
      forwardedCookies.push(options.request.headers.get("cookie"));
      return NextResponse.next(options);
    } } },
    "@supabase/ssr": { createServerClient: (url: string, key: string, options: { cookies: ServerCookies }) => {
      clientCalls++;
      assert.equal(url, sessionEnv.NEXT_PUBLIC_SUPABASE_URL);
      assert.equal(key, sessionEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      return { auth: {
        getClaims: async () => { claimsCalls++; await onClaims(options.cookies); return { data: { claims: { sub: "user-id" } }, error: null }; },
        getSession: () => assert.fail("Refresh must validate claims, not trust getSession"),
      } };
    } },
  }, env, errors);
  return {
    refresher: createSessionRefresher(request), request, errors, forwardedCookies,
    get clientCalls() { return clientCalls; },
    get claimsCalls() { return claimsCalls; },
  };
}

test("SSR refresh uses request cookies and getClaims; all final response types retain cookie options and cache headers", async () => {
  const renewed: SessionCookie[] = [
    { name: "sb-session.0", value: "renewed-access-token", options: {
      path: "/", domain: "site.example", httpOnly: true, secure: true, sameSite: "lax", expires: new Date("2030-01-01T00:00:00Z"),
    } },
    { name: "sb-session.1", value: "", options: { path: "/", httpOnly: true, secure: true, sameSite: "strict", maxAge: 0, expires: new Date(0) } },
  ];
  const cacheHeaders = { "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0", Expires: "0", Pragma: "no-cache" };
  const fixture = sessionFixture((cookies) => {
    assert.deepEqual(cookies.getAll(), [
      { name: "sb-session.0", value: "expired-access-token" },
      { name: "sb-session.1", value: "expired-refresh-token" },
      { name: "preference", value: "dark" },
    ]);
    cookies.setAll(renewed, { ...cacheHeaders, "x-auth-debug": "private-token" });
    assert.deepEqual(cookies.getAll(), [
      { name: "sb-session.0", value: "renewed-access-token" },
      { name: "sb-session.1", value: "" },
      { name: "preference", value: "dark" },
    ]);
  });
  assert.equal(fixture.clientCalls, 1);
  assert.equal(fixture.claimsCalls, 0);
  assert.equal(await fixture.refresher.refresh(), undefined);
  assert.equal(fixture.claimsCalls, 1);
  assert.deepEqual(fixture.errors, []);
  assert.deepEqual(fixture.forwardedCookies, [
    "sb-session.0=expired-access-token; sb-session.1=expired-refresh-token; preference=dark",
    "sb-session.0=renewed-access-token; sb-session.1=; preference=dark",
  ]);

  for (const target of [
    NextResponse.next({ request: fixture.request }),
    NextResponse.redirect(new URL("https://site.example/auth")),
    NextResponse.rewrite(new URL("https://site.example/admin/dashboard")),
  ]) {
    const routing = [target.status, target.headers.get("location"), target.headers.get("x-middleware-next"), target.headers.get("x-middleware-rewrite")];
    target.cookies.set("preference", "dark", { path: "/" });
    target.headers.set("cache-control", "public, s-maxage=60");
    target.headers.set("expires", "stale");
    target.headers.set("pragma", "cached");
    target.headers.set("x-app-header", "preserved");
    assert.equal(fixture.refresher.applyTo(target), target);
    assert.deepEqual(target.cookies.getAll(), [
      { name: "preference", value: "dark", path: "/" },
      ...renewed.map(({ name, value, options }) => ({ name, value, ...options })),
    ]);
    for (const [name, value] of Object.entries(cacheHeaders)) assert.equal(target.headers.get(name), value);
    assert.equal(target.headers.get("x-auth-debug"), null);
    assert.equal(target.headers.get("x-app-header"), "preserved");
    assert.deepEqual([target.status, target.headers.get("location"), target.headers.get("x-middleware-next"), target.headers.get("x-middleware-rewrite")], routing);
    assert.match(target.headers.get("set-cookie") ?? "", /sb-session\.0=renewed-access-token/);
    assert.match(target.headers.get("set-cookie") ?? "", /Max-Age=0/);
  }
});

test("missing Supabase env is a no-op without creating a client or touching the response", async () => {
  for (const env of [{}, { NEXT_PUBLIC_SUPABASE_URL: sessionEnv.NEXT_PUBLIC_SUPABASE_URL }, { NEXT_PUBLIC_SUPABASE_ANON_KEY: sessionEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY }]) {
    const fixture = sessionFixture(() => assert.fail("Unexpected Auth access"), env);
    const target = NextResponse.redirect(new URL("https://site.example/auth"));
    target.cookies.set("preference", "dark", { path: "/", httpOnly: true });
    target.headers.set("cache-control", "public, s-maxage=60");
    const before = { headers: Array.from(target.headers), cookies: target.cookies.getAll() };
    assert.equal(await fixture.refresher.refresh(), undefined);
    assert.equal(fixture.refresher.applyTo(target), target);
    assert.deepEqual({ headers: Array.from(target.headers), cookies: target.cookies.getAll() }, before);
    assert.equal(fixture.clientCalls, 0);
    assert.equal(fixture.claimsCalls, 0);
    assert.deepEqual(fixture.forwardedCookies, []);
    assert.deepEqual(fixture.errors, []);
  }
});

test("Auth failures never reject or log tokens, cookies, error messages or raw objects", async () => {
  const authError = new Error("access-token-secret; refresh-token-secret; sb-session=private-cookie", { cause: "private-cause" });
  authError.name = "AuthRetryableFetchError";
  for (const error of [authError, { message: authError.message, token: "access-token-secret", cookie: "private-cookie" }]) {
    const fixture = sessionFixture(() => { throw error; });
    assert.equal(await fixture.refresher.refresh(), undefined);
    assert.equal(fixture.claimsCalls, 1);
    assert.deepEqual(fixture.errors, [["Fallo al refrescar la sesion de Supabase:", error instanceof Error ? error.name : "desconocido"]]);
    assert.doesNotMatch(JSON.stringify(fixture.errors), /secret|private-cookie|private-cause|sb-session/);
    const target = NextResponse.next();
    target.headers.set("cache-control", "no-store");
    assert.equal(fixture.refresher.applyTo(target), target);
    assert.deepEqual(target.cookies.getAll(), []);
    assert.equal(target.headers.get("cache-control"), "no-store");
  }
});

const userInput = { email: "  NEW.User@Example.COM  ", password: "test-password-strong", full_name: "  New User  ", role: "editor" as const, actorEmail: "actor@example.com" };

function userFixture(options: { authError?: unknown; profileError?: unknown; rollbackError?: unknown; missingUser?: boolean } = {}) {
  const createdUser = { id: "created-user-id", email: "new.user@example.com" };
  const calls: Array<[string, ...unknown[]]> = [];
  const users = loadModule<Pick<typeof import("../src/lib/admin/users.ts"), "createCmsAdminUser">>("lib/admin/users.ts", {
    "@/lib/auth/local-auth": { LOCAL_ADMIN_EMAIL: "owner@example.com" },
    "@/lib/auth/roles": roles,
    "@/lib/supabase/admin": { createAdminClient: () => {
      calls.push(["client"]);
      return {
        auth: { admin: {
          createUser: async (input: unknown) => {
            calls.push(["createUser", input]);
            return { data: { user: options.missingUser ? null : createdUser }, error: options.authError ?? null };
          },
          deleteUser: async (id: string) => { calls.push(["deleteUser", id]); return { error: options.rollbackError ?? null }; },
        } },
        from: (table: string) => {
          calls.push(["from", table]);
          assert.equal(table, "profiles");
          return { upsert: async (profile: unknown, config: unknown) => {
            calls.push(["upsert", profile, config]);
            return { error: options.profileError ?? null };
          } };
        },
      };
    } },
    "@/lib/cms/history-logs": { logAction: async (entry: unknown) => { calls.push(["logAction", entry]); } },
  });
  return { users, createdUser, calls };
}

test("createCmsAdminUser normalizes input, persists the requested role, audits success and never rolls back", async () => {
  const { users, createdUser, calls } = userFixture();
  assert.equal(await users.createCmsAdminUser(userInput), createdUser);
  assert.deepEqual(calls, [
    ["client"],
    ["createUser", { email: "new.user@example.com", password: userInput.password, email_confirm: true, user_metadata: { full_name: "New User" } }],
    ["from", "profiles"],
    ["upsert", { id: createdUser.id, email: "new.user@example.com", full_name: "New User", role: "editor", avatar_url: null }, { onConflict: "id" }],
    ["logAction", { action: "create", entity_type: "admin_user", entity_id: createdUser.id, entity_title: "new.user@example.com", new_data: { email: "new.user@example.com", full_name: "New User", role: "editor" }, user_email: userInput.actorEmail }],
  ]);
});

test("Auth creation errors or a missing created user never upsert, roll back or audit", async () => {
  const authError = { message: "Email already registered", status: 422 };
  for (const options of [{ authError }, { missingUser: true }]) {
    const { users, calls } = userFixture(options);
    await assert.rejects(users.createCmsAdminUser(userInput), (error: unknown) => {
      if ("authError" in options) assert.equal(error, authError);
      else { assert.ok(error instanceof Error); assert.equal(error.message, "No se pudo crear el usuario."); }
      return true;
    });
    assert.deepEqual(calls.map(([operation]) => operation), ["client", "createUser"]);
  }
});

test("profile upsert errors delete only the just-created Auth user and rethrow the original error without auditing", async () => {
  const profileError = { message: "Profile write denied", code: "42501" };
  const { users, createdUser, calls } = userFixture({ profileError });
  await assert.rejects(users.createCmsAdminUser(userInput), (error: unknown) => { assert.equal(error, profileError); return true; });
  assert.deepEqual(calls.map(([operation]) => operation), ["client", "createUser", "from", "upsert", "deleteUser"]);
  assert.deepEqual(calls.at(-1), ["deleteUser", createdUser.id]);
});

test("a failed rollback reports the orphaned Auth account clearly and preserves the profile error as cause", async () => {
  const profileError = new Error("Profile write failed");
  const rollbackError = new Error("Auth deletion failed");
  const { users, createdUser, calls } = userFixture({ profileError, rollbackError });
  await assert.rejects(users.createCmsAdminUser(userInput), (error: unknown) => {
    assert.ok(error instanceof Error);
    assert.notEqual(error, profileError);
    assert.notEqual(error, rollbackError);
    assert.match(error.message, /crear el perfil.*tampoco.*revertir la cuenta.*Supabase Auth/);
    assert.equal(error.cause, profileError);
    return true;
  });
  assert.deepEqual(calls.map(([operation]) => operation), ["client", "createUser", "from", "upsert", "deleteUser"]);
  assert.deepEqual(calls.at(-1), ["deleteUser", createdUser.id]);
});
