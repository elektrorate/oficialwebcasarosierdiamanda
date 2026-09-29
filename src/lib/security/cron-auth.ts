/**
 * Fail-closed authorization for Vercel cron routes.
 *
 * Vercel sends the configured `CRON_SECRET` as `Authorization: Bearer <secret>`.
 * When the secret is not configured the request is rejected, so a missing
 * environment variable can never leave a write endpoint open.
 */
export function isAuthorizedCronRequest(authorization: string | null, secret: string | undefined | null): boolean {
  if (typeof secret !== "string") return false;
  const expected = secret.trim();
  if (expected.length === 0) return false;
  if (typeof authorization !== "string") return false;
  const match = /^Bearer\s+(\S+)$/i.exec(authorization.trim());
  if (!match) return false;
  return timingSafeEqualStrings(match[1], expected);
}

function timingSafeEqualStrings(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return mismatch === 0;
}
