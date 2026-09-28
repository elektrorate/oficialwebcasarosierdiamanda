import type { Offering } from "./types.ts";

function duplicateSlugBase(slug: string, items: Offering[]) {
  const match = slug.match(/^(.*)-(\d+)$/);
  if (match?.[1] && items.some((item) => item.slug === match[1])) return match[1];
  return slug;
}

function uniqueSlug(items: Offering[], baseSlug: string) {
  const taken = new Set(items.map((item) => item.slug));
  if (!taken.has(baseSlug)) return baseSlug;

  let counter = 2;
  while (taken.has(`${baseSlug}-${counter}`)) counter++;
  return `${baseSlug}-${counter}`;
}

function duplicateLabelBase(value: string) {
  return value.replace(/\s+\(copia(?:\s+\d+)?\)$/i, "").trim() || value.trim();
}

function uniqueDuplicateLabel(base: string, takenLabels: Iterable<string>) {
  const taken = new Set(Array.from(takenLabels, (label) => label.trim().toLocaleLowerCase("es")));
  const first = `${base} (copia)`;
  if (!taken.has(first.toLocaleLowerCase("es"))) return first;

  let counter = 2;
  while (taken.has(`${base} (copia ${counter})`.toLocaleLowerCase("es"))) counter++;
  return `${base} (copia ${counter})`;
}

function offeringMenuTitle(offering: Offering) {
  return offering.details?.class?.menuTitle?.trim() || offering.title;
}

export function duplicateOfferingIdentity(original: Offering, offerings: Offering[]) {
  const title = uniqueDuplicateLabel(
    duplicateLabelBase(original.title),
    offerings.map((offering) => offering.title),
  );
  const menuTitle = uniqueDuplicateLabel(
    duplicateLabelBase(offeringMenuTitle(original)),
    offerings.map(offeringMenuTitle),
  );
  const details = structuredClone(original.details ?? {});

  details.class = { ...(details.class ?? {}), menuTitle };

  return {
    title,
    menuTitle,
    slug: uniqueSlug(offerings, duplicateSlugBase(original.slug, offerings)),
    details,
  };
}
