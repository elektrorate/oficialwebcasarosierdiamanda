import type { BlogPost } from "@/lib/cms/types";

export const BITACORA_LIST_ADMIN_PATH = "/admin/bitacora";
export const BITACORA_CREATE_PATH = "/admin/bitacora/new";
export const BITACORA_EDIT_PATH = (id: string) => `/admin/bitacora/${id}/edit`;

export const BITACORA_POST_ENDPOINT = (id: string) => `/api/admin/bitacora/${id}`;

export const BITACORA_POSTS_ENDPOINT = "/api/admin/bitacora";

export type BlogPostSaveResult =
  | { ok: true; post: BlogPost }
  | { ok: false; error: string };

export async function saveBlogPostAction(
  mode: "create" | "edit",
  postId: string | undefined,
  payload: Record<string, unknown>,
  options: { autosave?: boolean } = {},
): Promise<BlogPostSaveResult> {
  try {
    const response = await fetch(mode === "create" ? BITACORA_POSTS_ENDPOINT : BITACORA_POST_ENDPOINT(postId!),
      {
        method: mode === "create" ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(options.autosave ? { "X-CMS-Autosave": "1" } : {}),
        },
        body: JSON.stringify(payload),
      },
    );

    const data = (await response.json().catch(() => ({}))) as {
      post?: BlogPost;
      error?: string;
    };

    if (!response.ok || !data.post) {
      return { ok: false, error: data.error || "No se pudo guardar la bitácora." };
    }

    return { ok: true, post: data.post };
  } catch {
    return { ok: false, error: "Revisa la conexión y vuelve a intentarlo." };
  }
}

export type BitacoraPatchAction =
  | "duplicate"
  | "trash"
  | "publish"
  | "draft"
  | "archive"
  | "feature"
  | "unfeature";

export type BitacoraActionResult =
  | { ok: true; post?: unknown }
  | { ok: false; error: string };

export function bitacoraPostEnabled(post: Pick<BlogPost, "status">) {
  return post.status === "published";
}

export function bitacoraListingEnabled(post: Pick<BlogPost, "status" | "visible_in_listing">) {
  return post.status === "published" && post.visible_in_listing !== false;
}

export function bitacoraEnableSuccessMessage(enabled: boolean) {
  return enabled
    ? "La bitácora está activa y visible en el sitio."
    : "La bitácora quedó inactiva (borrador, fuera del listado público).";
}

export function bitacoraActionSuccessMessage(action: BitacoraPatchAction) {
  if (action === "duplicate") return "Duplicado exitosamente.";
  if (action === "publish") return "Publicado exitosamente.";
  if (action === "draft") return "Borrador guardado correctamente.";
  if (action === "archive") return "Archivado exitosamente.";
  if (action === "feature") return "Bitácora agregada a destacados correctamente.";
  if (action === "unfeature") return "Bitácora retirada de destacados correctamente.";
  if (action === "trash") return "Movido a papelera exitosamente.";
  return "Acción completada correctamente.";
}

export async function patchBitacoraPostAction(id: string, action: BitacoraPatchAction): Promise<BitacoraActionResult> {
  try {
    const response = await fetch(BITACORA_POST_ENDPOINT(id), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    if (response.ok) {
      const data = (await response.json().catch(() => ({}))) as { post?: unknown };
      return { ok: true, post: data.post };
    }

    const data = (await response.json().catch(() => ({}))) as { error?: string };
    return { ok: false, error: data.error || "No se pudo completar la acción." };
  } catch {
    return { ok: false, error: "Revisa la conexión y vuelve a intentarlo." };
  }
}

export async function setBitacoraPostEnabledAction(id: string, enabled: boolean): Promise<BitacoraActionResult> {
  try {
    const response = await fetch(BITACORA_POST_ENDPOINT(id), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_enabled", enabled }),
    });

    if (response.ok) {
      const data = (await response.json().catch(() => ({}))) as { post?: unknown };
      return { ok: true, post: data.post };
    }

    const data = (await response.json().catch(() => ({}))) as { error?: string };
    return { ok: false, error: data.error || "No se pudo actualizar el estado." };
  } catch {
    return { ok: false, error: "Revisa la conexión y vuelve a intentarlo." };
  }
}

export const BLOG_POST_STATUS_LABELS: Record<BlogPost["status"], string> = {
  draft: "Borrador",
  published: "Publicado",
  archived: "Archivado",
  deleted: "Eliminado",
};
