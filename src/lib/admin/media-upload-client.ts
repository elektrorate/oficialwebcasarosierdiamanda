import {
  CLIENT_UPLOAD_TARGET_BYTES,
  prepareFileForAdminUpload,
} from "./media-upload-prepare";

export const MEDIA_UPLOAD_ENDPOINT = "/api/admin/media/upload";

export const MEDIA_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
const MEDIA_REQUEST_SAFE_BYTES = 4 * 1024 * 1024;

export type MediaUploadOptimization = {
  optimized: boolean;
  originalSize: number;
  finalSize: number;
  savedBytes: number;
  reductionPercent: number;
  width?: number;
  height?: number;
};

export type MediaUploadResult =
  | { ok: true; fileUrl: string; optimization?: MediaUploadOptimization; clientCompressed?: boolean }
  | { ok: false; error: string };

export type UploadAdminMediaInput = {
  file: File;
  folder: string;
  title?: string;
  altText?: string;
  /** Skip browser resize/compress (e.g. when file was already prepared). */
  skipClientPrepare?: boolean;
};

function formatMegabytes(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

async function canDisplayUploadedImage(url: string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const loaded = await new Promise<boolean>((resolve) => {
      const image = new Image();
      const timeout = window.setTimeout(() => resolve(false), 5_000);
      image.onload = () => {
        window.clearTimeout(timeout);
        resolve(image.naturalWidth > 0 && image.naturalHeight > 0);
      };
      image.onerror = () => {
        window.clearTimeout(timeout);
        resolve(false);
      };
      const separator = url.includes("?") ? "&" : "?";
      image.src = `${url}${separator}upload_check=${Date.now()}_${attempt}`;
    });

    if (loaded) return true;
    if (attempt < 2) await wait(500 * (attempt + 1));
  }
  return false;
}

export function validateImageFileForUpload(file: File): string | null {
  if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
    return "Selecciona una imagen o PDF válido.";
  }
  if (file.size > MEDIA_UPLOAD_MAX_BYTES) {
    return `El archivo supera el límite de ${formatMegabytes(MEDIA_UPLOAD_MAX_BYTES)}.`;
  }
  return null;
}

export async function uploadAdminMediaFile(input: UploadAdminMediaInput): Promise<MediaUploadResult> {
  const prepared = input.skipClientPrepare
    ? { file: input.file, clientCompressed: false }
    : await prepareFileForAdminUpload(input.file);

  const validationError = validateImageFileForUpload(prepared.file);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  if (prepared.file.size > MEDIA_REQUEST_SAFE_BYTES) {
    return {
      ok: false,
      error: prepared.file.type === "application/pdf"
        ? `El PDF debe pesar menos de ${formatMegabytes(MEDIA_REQUEST_SAFE_BYTES)} para poder subirlo.`
        : `No se pudo reducir la imagen lo suficiente. Usa una imagen de menos de ${formatMegabytes(CLIENT_UPLOAD_TARGET_BYTES)} o guárdala como JPG/WebP.`,
    };
  }

  const formData = new FormData();
  formData.append("file", prepared.file);
  formData.append("folder", input.folder);
  if (input.title) formData.append("title", input.title);
  if (input.altText) formData.append("alt_text", input.altText);
  if (prepared.clientCompressed) {
    formData.append("client_compressed", "1");
  }

  try {
    const response = await fetch(MEDIA_UPLOAD_ENDPOINT, {
      method: "POST",
      body: formData,
    });

    const data = (await response.json().catch(() => ({}))) as {
      asset?: { file_url?: string };
      error?: string;
      optimization?: MediaUploadOptimization;
    };

    if (!response.ok || !data.asset?.file_url) {
      const fallbackError = response.status === 413
        ? "La imagen sigue siendo demasiado pesada para el servidor. Redúcela a menos de 3.5 MB."
        : `No se pudo subir el archivo (error ${response.status || "de conexión"}).`;
      return { ok: false, error: data.error || fallbackError };
    }

    if (prepared.file.type.startsWith("image/") && !(await canDisplayUploadedImage(data.asset.file_url))) {
      return {
        ok: false,
        error: "La carga termin\u00f3, pero la imagen no est\u00e1 disponible en Storage. Intenta subirla nuevamente.",
      };
    }

    return {
      ok: true,
      fileUrl: data.asset.file_url,
      optimization: data.optimization,
      clientCompressed: prepared.clientCompressed,
    };
  } catch {
    return { ok: false, error: "No se pudo conectar con el servidor de medios." };
  }
}

export { formatMegabytes as formatUploadMegabytes };
