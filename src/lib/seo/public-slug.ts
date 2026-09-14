const PUBLIC_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const URL_LIKE_SLUG_PATTERN = /^(?:https?|www)(?:-|$)/;

export function isValidPublicSlug(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const slug = value.trim();
  return (
    slug.length > 0 &&
    slug.length <= 160 &&
    PUBLIC_SLUG_PATTERN.test(slug) &&
    !URL_LIKE_SLUG_PATTERN.test(slug)
  );
}

export function publicSlugError(value: unknown) {
  if (isValidPublicSlug(value)) return null;
  return "El slug debe usar minúsculas, números y guiones, y no puede ser una URL completa.";
}
