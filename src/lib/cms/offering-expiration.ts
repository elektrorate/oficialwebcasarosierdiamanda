import type { Offering } from "./types";

export const OFFERING_EXPIRATION_TIMEZONE = "Europe/Madrid";

const madridFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: OFFERING_EXPIRATION_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/**
 * Formats an ISO instant as the parts the user edits, expressed in the CMS
 * timezone. Returns { date: "YYYY-MM-DD", time: "HH:mm" }.
 */
export function toLocalDateTimeParts(iso: string | null | undefined): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return { date: "", time: "" };

  const parts = madridFormatter.formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const hour = get("hour").replace(/^0/, "").padStart(2, "0");
  const time = `${hour.padStart(2, "0")}:${get("minute")}`;
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time };
}

/**
 * Combines local date/time input with the Europe/Madrid timezone and returns a
 * normalized UTC ISO string, or null when no date is provided.
 */
export function fromLocalDateTime(
  date: string | null | undefined,
  time: string | null | undefined,
  existingIso: string | null | undefined = null,
): string | null {
  const rawDate = (date ?? "").trim();
  if (!rawDate) return null;

  const existing = existingIso && new Date(existingIso);
  const fallbackTime =
    existing && !Number.isNaN(existing.getTime())
      ? toLocalDateTimeParts(existingIso).time
      : "23:59";

  const timeValue = (time ?? "").trim() || fallbackTime;

  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(rawDate);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeValue.padStart(5, "0"));
  if (!dateMatch || !timeMatch) return null;

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null;

  return madridLocalToUtc(year, month, day, hour, minute);
}

function madridLocalToUtc(year: number, month: number, day: number, hour: number, minute: number) {
  // Guess the instant assuming the wall time is already UTC, then correct with
  // the Europe/Madrid offset (CET/CEST) resolved through Intl for that instant.
  const guessUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
  const parts = madridFormatter.formatToParts(new Date(guessUtc));
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const guessWallMs = Date.UTC(
    Number(get("year")),
    Number(get("month")) - 1,
    Number(get("day")),
    Number(get("hour")),
    Number(get("minute")),
    0,
  );
  const offsetMs = guessWallMs - guessUtc;
  return new Date(guessUtc - offsetMs).toISOString();
}

/**
 * True when the offering is expired: a past (or missing) expires_at with
 * expiration enabled.
 */
export function isPastDueExpiration(offering: Pick<Offering, "expiration_enabled" | "expires_at">, now: Date = new Date()) {
  if (!offering.expiration_enabled) return false;
  if (!offering.expires_at) return true;
  return new Date(offering.expires_at).getTime() <= now.getTime();
}

/**
 * Validates an incoming save (create/update/publish) against the expiration
 * rules. Returns null when the save is allowed, or a user-facing message when
 * it must be rejected.
 */
export function expirationSaveError({
  expirationEnabled,
  expiresAt,
  status,
  now = new Date(),
}: {
  expirationEnabled: boolean;
  expiresAt: string | null | undefined;
  status?: string;
  now?: Date;
}): string | null {
  if (!expirationEnabled) return null;
  if (!expiresAt) return "La caducidad está activa, pero falta la fecha de finalización. Elige una fecha futura o desactiva la caducidad.";
  const parsed = new Date(expiresAt).getTime();
  if (Number.isNaN(parsed)) return "La fecha de finalización no es válida.";
  if (status === "published" && parsed <= now.getTime()) {
    return "No se puede publicar con una fecha de caducidad vencida. Elige una nueva fecha futura o desactiva la caducidad.";
  }
  return null;
}

/**
 * Short human summary shown in the CMS editor when a date exists.
 * Always uses the CMS timezone for "a las" display.
 */
export function formatExpirationSummary(offering: Pick<Offering, "expiration_enabled" | "expires_at" | "expired_at">) {
  if (!offering.expiration_enabled || !offering.expires_at) return null;
  if (offering.expired_at) return `Caducó el ${formatMadridDateTime(offering.expires_at)}`;
  return `Caduca el ${formatMadridDateTime(offering.expires_at)}`;
}

function formatMadridDateTime(iso: string): string {
  const { date, time } = toLocalDateTimeParts(iso);
  const [year, month, day] = date.split("-").map(Number);
  const label = new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("es-ES", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `${label} a las ${time}`;
}