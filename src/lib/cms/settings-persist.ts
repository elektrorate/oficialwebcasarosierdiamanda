/**
 * Lógica de persistencia de la Configuración global, sin dependencias de
 * Supabase. Se puede testear inyectando funciones de escritura.
 */

import type { SiteSettings } from "./settings-types";

export type SettingsWriteResult = {
  ok: boolean;
  saved: string[];
  failed: string[];
  errors: string[];
};

/** Error de persistencia con detalle por tabla, para no mentir sobre el guardado. */
export class SettingsPersistenceError extends Error {
  readonly saved: string[];
  readonly failed: string[];

  constructor(message: string, saved: string[], failed: string[]) {
    super(message);
    this.name = "SettingsPersistenceError";
    this.saved = saved;
    this.failed = failed;
  }
}

function errorText(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === "string" && message.trim()) return message.trim();
  }
  return "error desconocido";
}

/**
 * Ejecuta las escrituras necesarias e informa con precisión de cada una.
 * No se considera éxito si alguna escritura necesaria falla.
 */
export async function persistSettings(
  next: SiteSettings,
  writers: {
    writeSiteSettings: (settings: SiteSettings, updatedAt: string) => Promise<void>;
    writeMenuVisualSettings: (settings: SiteSettings, updatedAt: string) => Promise<void>;
  },
): Promise<SettingsWriteResult> {
  const updatedAt = new Date().toISOString();
  const saved: string[] = [];
  const failed: string[] = [];
  const errors: string[] = [];

  try {
    await writers.writeSiteSettings(next, updatedAt);
    saved.push("site_settings");
  } catch (error) {
    failed.push("site_settings");
    errors.push(`site_settings: ${errorText(error)}`);
  }

  try {
    await writers.writeMenuVisualSettings(next, updatedAt);
    saved.push("menu_visual_settings");
  } catch (error) {
    failed.push("menu_visual_settings");
    errors.push(`menu_visual_settings: ${errorText(error)}`);
  }

  return { ok: failed.length === 0, saved, failed, errors };
}

export type UpdateSettingsResult = {
  settings: SiteSettings;
  write: SettingsWriteResult;
};
