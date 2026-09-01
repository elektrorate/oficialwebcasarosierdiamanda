import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ApiRequestError } from "./request-validation";
export { ApiRequestError, readJsonObject } from "./request-validation";

type LocalRateLimitEntry = {
  count: number;
  windowStartedAt: number;
};

const localRateLimits = new Map<string, LocalRateLimitEntry>();

function shouldUseLocalRateLimit() {
  return process.env.NODE_ENV !== "production" && !process.env.SUPABASE_SERVICE_ROLE_KEY;
}

function localRateLimitKey(request: Request, route: string) {
  return `${route}:${clientIdentifier(request)}`;
}

function enforceLocalRateLimit(
  request: Request,
  input: { route: string; limit: number; windowSeconds: number },
) {
  const key = localRateLimitKey(request, input.route);
  const now = Date.now();
  const windowMs = input.windowSeconds * 1000;
  const current = localRateLimits.get(key);
  const entry = !current || current.windowStartedAt <= now - windowMs
    ? { count: 1, windowStartedAt: now }
    : { ...current, count: current.count + 1 };

  localRateLimits.set(key, entry);
  if (entry.count > input.limit) {
    const retryAfter = Math.max(1, Math.ceil((entry.windowStartedAt + windowMs - now) / 1000));
    throw new ApiRequestError(
      "Demasiadas solicitudes. Intentalo de nuevo mas tarde.",
      429,
      String(retryAfter),
    );
  }
}

function clientIdentifier(request: Request) {
  const forwarded = request.headers.get("x-vercel-forwarded-for")
    ?? request.headers.get("x-forwarded-for")
    ?? request.headers.get("x-real-ip")
    ?? "unknown";
  const address = forwarded.split(",", 1)[0].trim().slice(0, 128) || "unknown";
  const salt = process.env.RATE_LIMIT_SALT ?? process.env.LOCAL_AUTH_SECRET ?? "casa-rosier-rate-limit";
  return createHash("sha256").update(`${salt}:${address}`).digest("hex");
}

export async function resetRateLimit(request: Request, route: string) {
  if (shouldUseLocalRateLimit()) {
    localRateLimits.delete(localRateLimitKey(request, route));
    return;
  }

  const { error } = await createAdminClient().rpc("reset_api_rate_limit", {
    p_route: route,
    p_identifier_hash: clientIdentifier(request),
  });
  if (error) throw error;
}

export async function enforceRateLimit(
  request: Request,
  input: { route: string; limit: number; windowSeconds: number },
) {
  if (shouldUseLocalRateLimit()) {
    enforceLocalRateLimit(request, input);
    return;
  }

  const { data, error } = await createAdminClient().rpc("check_api_rate_limit", {
    p_route: input.route,
    p_identifier_hash: clientIdentifier(request),
    p_limit: input.limit,
    p_window_seconds: input.windowSeconds,
  });

  if (error || !Array.isArray(data) || !data[0]) {
    throw new ApiRequestError("Proteccion temporalmente no disponible.", 503, "rate_limit_unavailable");
  }

  const result = data[0] as { allowed?: boolean; retry_after_seconds?: number };
  if (!result.allowed) {
    throw new ApiRequestError(
      "Demasiadas solicitudes. Intentalo de nuevo mas tarde.",
      429,
      String(Math.max(1, result.retry_after_seconds ?? input.windowSeconds)),
    );
  }
}

export function apiErrorResponse(error: unknown) {
  if (error instanceof ApiRequestError) {
    const headers = error.status === 429 ? { "Retry-After": error.code } : undefined;
    return NextResponse.json({ error: error.message }, { status: error.status, headers });
  }
  return NextResponse.json({ error: "No se pudo procesar la solicitud." }, { status: 500 });
}
