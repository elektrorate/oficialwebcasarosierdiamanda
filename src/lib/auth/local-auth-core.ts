export const LOCAL_ADMIN_EMAIL = process.env.LOCAL_ADMIN_EMAIL ?? "name@admin.com";
export const LOCAL_ADMIN_PASSWORD_HASH = process.env.LOCAL_ADMIN_PASSWORD_HASH ?? "";
export const LOCAL_AUTH_SECRET = process.env.LOCAL_AUTH_SECRET ?? "";

export const LOCAL_SESSION_COOKIE = "casa_rosier_admin_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

export type LocalSessionPayload = {
  email: string;
  issuedAt: number;
  expiresAt: number;
};

function getEncoder() {
  return new TextEncoder();
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function importSecretKey() {
  if (!LOCAL_AUTH_SECRET) {
    throw new Error("LOCAL_AUTH_SECRET is required for local bootstrap auth.");
  }
  return crypto.subtle.importKey("raw", getEncoder().encode(LOCAL_AUTH_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

function toPayload(email: string): LocalSessionPayload {
  const issuedAt = Date.now();
  return {
    email,
    issuedAt,
    expiresAt: issuedAt + SESSION_DURATION_SECONDS * 1000,
  };
}

function encodePayload(payload: LocalSessionPayload) {
  return bytesToBase64Url(getEncoder().encode(JSON.stringify(payload)));
}

function decodePayload(token: string): LocalSessionPayload | null {
  try {
    const bytes = base64UrlToBytes(token);
    const decoded = new TextDecoder().decode(bytes);
    return JSON.parse(decoded) as LocalSessionPayload;
  } catch {
    return null;
  }
}

async function signPayload(payload: string) {
  const key = await importSecretKey();
  const signature = await crypto.subtle.sign("HMAC", key, getEncoder().encode(payload));
  return bytesToBase64Url(new Uint8Array(signature));
}

async function verifySignature(payload: string, signature: string) {
  const key = await importSecretKey();
  return crypto.subtle.verify("HMAC", key, base64UrlToBytes(signature), getEncoder().encode(payload));
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", getEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function validateLocalCredentials(email: string, password: string) {
  if (!LOCAL_AUTH_SECRET) return false;
  if (email.trim().toLowerCase() !== LOCAL_ADMIN_EMAIL.trim().toLowerCase()) return false;
  if (!LOCAL_ADMIN_PASSWORD_HASH) return false;
  return timingSafeEqual(await sha256Hex(password), LOCAL_ADMIN_PASSWORD_HASH.trim().toLowerCase());
}

export async function createLocalSessionToken(email: string) {
  if (!LOCAL_AUTH_SECRET) {
    throw new Error("LOCAL_AUTH_SECRET is required for local bootstrap auth.");
  }
  const payload = encodePayload(toPayload(email.trim().toLowerCase()));
  const signature = await signPayload(payload);
  return `${payload}.${signature}`;
}

export async function readLocalSessionToken(token: string | undefined | null) {
  if (!token) {
    return null;
  }
  if (!LOCAL_AUTH_SECRET) {
    return null;
  }

  const [payloadPart, signature] = token.split(".");
  if (!payloadPart || !signature) {
    return null;
  }

  const isValid = await verifySignature(payloadPart, signature);
  if (!isValid) {
    return null;
  }

  const payload = decodePayload(payloadPart);
  if (!payload || payload.expiresAt < Date.now()) {
    return null;
  }

  if (payload.email.trim().toLowerCase() !== LOCAL_ADMIN_EMAIL.trim().toLowerCase()) {
    return null;
  }

  return payload;
}
