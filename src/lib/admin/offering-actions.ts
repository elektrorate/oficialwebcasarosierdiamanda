import type { Offering } from "@/lib/cms/types";
import { getActionWarnings } from "./action-warnings";

export type OfferingPatchAction = "duplicate" | "publish" | "draft" | "trash";

export type OfferingStatusResult = {
  ok: boolean;
  offering?: Offering;
  enabled?: boolean;
  error?: string;
  warnings?: string[];
};

async function parseOfferingResponse(response: Response): Promise<OfferingStatusResult> {
  const data = (await response.json().catch(() => ({}))) as {
    error?: string;
    offering?: Offering;
    warnings?: string[];
  };

  if (!response.ok) {
    return { ok: false, error: data.error || "No se pudo completar la acción." };
  }

  return { ok: true, offering: data.offering, warnings: getActionWarnings(data.warnings) };
}

export async function patchOfferingAction(
  id: string,
  action: OfferingPatchAction,
): Promise<OfferingStatusResult> {
  try {
    const response = await fetch(`/api/admin/offerings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    return parseOfferingResponse(response);
  } catch {
    return { ok: false, error: "No se pudo conectar con el servidor. Intenta nuevamente." };
  }
}

export async function setOfferingEnabledAction(id: string, enabled: boolean): Promise<OfferingStatusResult> {
  try {
    const response = await fetch(`/api/admin/offerings/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      offering?: Offering;
      enabled?: boolean;
      warnings?: string[];
    };

    if (!response.ok) {
      return { ok: false, error: data.error || "No se pudo actualizar el estado." };
    }

    return { ok: true, offering: data.offering, enabled: data.enabled, warnings: getActionWarnings(data.warnings) };
  } catch {
    return { ok: false, error: "No se pudo conectar con el servidor. Intenta nuevamente." };
  }
}

export async function deleteOfferingPermanentlyAction(id: string): Promise<OfferingStatusResult> {
  try {
    const response = await fetch(`/api/admin/offerings/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      return { ok: false, error: data.error || "No se pudo eliminar el contenido." };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo conectar con el servidor. Intenta nuevamente." };
  }
}

export function isOffering(value: unknown): value is Offering {
  return Boolean(value && typeof value === "object" && "id" in value && "type" in value && "title" in value);
}

export function offeringActionSuccessMessage(typeLabel: string, action: OfferingPatchAction | "delete" | "toggle_on" | "toggle_off") {
  if (action === "duplicate") return `${typeLabel} duplicado correctamente.`;
  if (action === "publish" || action === "toggle_on") return `${typeLabel} publicado y visible en el sitio.`;
  if (action === "draft" || action === "toggle_off") return `${typeLabel} desactivado. Ya no es visible públicamente.`;
  if (action === "trash") return `${typeLabel} enviado a la papelera correctamente.`;
  if (action === "delete") return `${typeLabel} eliminado permanentemente junto con sus archivos asociados.`;
  return "Acción completada correctamente.";
}
