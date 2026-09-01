/** Compress in the browser before upload when photos are large (faster upload + less server Sharp work). */
export const CLIENT_COMPRESS_MIN_BYTES = 2 * 1024 * 1024;
const CLIENT_MAX_EDGE = 2560;
export const CLIENT_UPLOAD_TARGET_BYTES = 3.5 * 1024 * 1024;
const CLIENT_JPEG_QUALITIES = [0.85, 0.75, 0.65];

const SKIP_CLIENT_COMPRESS_TYPES = new Set(["image/svg+xml", "image/gif", "image/avif"]);

export type PrepareUploadFileResult = {
  file: File;
  clientCompressed: boolean;
};

export async function prepareFileForAdminUpload(file: File): Promise<PrepareUploadFileResult> {
  if (typeof window === "undefined" || typeof createImageBitmap !== "function") {
    return { file, clientCompressed: false };
  }

  if (!file.type.startsWith("image/") || SKIP_CLIENT_COMPRESS_TYPES.has(file.type)) {
    return { file, clientCompressed: false };
  }

  if (file.size < CLIENT_COMPRESS_MIN_BYTES) {
    return { file, clientCompressed: false };
  }

  try {
    const bitmap = await createImageBitmap(file);
    const longest = Math.max(bitmap.width, bitmap.height);
    const scale = longest > CLIENT_MAX_EDGE ? CLIENT_MAX_EDGE / longest : 1;
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      bitmap.close();
      return { file, clientCompressed: false };
    }

    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    let blob: Blob | null = null;
    for (const quality of CLIENT_JPEG_QUALITIES) {
      blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", quality);
      });
      if (blob && blob.size <= CLIENT_UPLOAD_TARGET_BYTES) break;
    }

    if (!blob || blob.size >= file.size * 0.95) {
      return { file, clientCompressed: false };
    }

    const baseName = file.name.replace(/\.[^.]+$/u, "") || "upload";
    const compressed = new File([blob], `${baseName}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });

    return { file: compressed, clientCompressed: true };
  } catch {
    return { file, clientCompressed: false };
  }
}
