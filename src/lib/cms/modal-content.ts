export const MODAL_CONTENT_LIMITS = {
  title: 80,
  description: 280,
} as const;

function textLength(value: unknown) {
  return typeof value === "string" ? value.trim().length : 0;
}

export function modalTextError(
  value: unknown,
  limit: number,
  label: string,
) {
  const length = textLength(value);
  return length > limit
    ? `${label} admite un máximo de ${limit} caracteres (ahora tiene ${length}).`
    : null;
}

/**
 * Keeps offering-gallery copy within the fixed, non-scrollable mobile modal.
 * It is intentionally server-safe so direct API calls cannot bypass the CMS UI.
 */
export function offeringGalleryModalContentError(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;

  const details = (payload as { details?: unknown }).details;
  if (!details || typeof details !== "object") return null;

  const galleryImages = (details as { galleryImages?: unknown }).galleryImages;
  if (!Array.isArray(galleryImages)) return null;

  for (const [index, image] of galleryImages.entries()) {
    if (!image || typeof image !== "object") continue;
    const item = image as { modalTitle?: unknown; modalDescription?: unknown };
    const titleError = modalTextError(
      item.modalTitle,
      MODAL_CONTENT_LIMITS.title,
      `El título del modal de la imagen ${index + 1}`,
    );
    if (titleError) return titleError;

    const descriptionError = modalTextError(
      item.modalDescription,
      MODAL_CONTENT_LIMITS.description,
      `La descripción del modal de la imagen ${index + 1}`,
    );
    if (descriptionError) return descriptionError;
  }

  return null;
}

export function socialGalleryModalContentError(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const items = (payload as { items?: unknown }).items;
  if (!Array.isArray(items)) return null;

  for (const [index, item] of items.entries()) {
    if (!item || typeof item !== "object") continue;
    const post = item as { title?: unknown; description?: unknown };
    const titleError = modalTextError(
      post.title,
      MODAL_CONTENT_LIMITS.title,
      `El título de la foto ${index + 1}`,
    );
    if (titleError) return titleError;

    const descriptionError = modalTextError(
      post.description,
      MODAL_CONTENT_LIMITS.description,
      `El texto de la foto ${index + 1}`,
    );
    if (descriptionError) return descriptionError;
  }

  return null;
}
