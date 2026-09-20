import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { LOCAL_SESSION_COOKIE, readLocalSessionToken } from "./local-auth-core";

export { LOCAL_ADMIN_EMAIL, LOCAL_ADMIN_PASSWORD, LOCAL_ADMIN_PASSWORD_HASH, LOCAL_AUTH_SECRET, LOCAL_SESSION_COOKIE, createLocalSessionToken, readLocalSessionToken, validateLocalCredentials } from "./local-auth-core";

const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

type SessionCookieOptions = {
  httpOnly: boolean;
  sameSite: "lax";
  path: string;
  secure: boolean;
  maxAge: number;
};

export async function getCurrentLocalSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(LOCAL_SESSION_COOKIE)?.value;
  return readLocalSessionToken(token);
}

export function createLocalSessionCookie(value: string): { name: string; value: string; options: SessionCookieOptions } {
  return {
    name: LOCAL_SESSION_COOKIE,
    value,
    options: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_DURATION_SECONDS,
    },
  };
}

export function clearLocalSessionCookie(): { name: string; value: string; options: SessionCookieOptions } {
  return {
    name: LOCAL_SESSION_COOKIE,
    value: "",
    options: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
    },
  };
}

export async function isRequestAuthenticated(request: NextRequest) {
  const token = request.cookies.get(LOCAL_SESSION_COOKIE)?.value;
  return readLocalSessionToken(token);
}
