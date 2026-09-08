export function slugifyBlogPost(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function parseTagsInput(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export const LISTING_EXCERPT_MAX_LENGTH = 240;

export function clampListingExcerpt(value: string) {
  return value.slice(0, LISTING_EXCERPT_MAX_LENGTH);
}
