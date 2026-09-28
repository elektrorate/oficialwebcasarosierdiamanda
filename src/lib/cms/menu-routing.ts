/** Shared by the editor, publication planner and public routing. No server imports. */
export const SECTION_BASES: Record<string, string> = {
  clases: "/clases", workshops: "/workshops", experiencias: "/experiencias",
  giftcards: "/gift-cards", estudio: "/el-estudio", shop: "/shop",
};
export const SECTION_TYPES: Record<string, string> = {
  clases: "class", workshops: "workshop", experiencias: "experience", giftcards: "gift_card",
};
export type SectionRoute = { key: string; path: string; aliases: string[] };
export function menuSlug(label: string) {
  return label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
export function offeringBase(type: string) {
  return SECTION_BASES[Object.keys(SECTION_TYPES).find((key) => SECTION_TYPES[key] === type) ?? "clases"];
}
export function canonicalMenuPath(path: string, routes: SectionRoute[]) {
  for (const route of routes) {
    const base = SECTION_BASES[route.key];
    if (path === base || path.startsWith(`${base}/`)) return route.path + path.slice(base.length);
  }
  return path;
}
/** Normalize an old/custom prefix back to the stable application route. */
export function internalMenuPath(path: string, routes: SectionRoute[]) {
  for (const route of routes) {
    for (const prefix of [route.path, ...route.aliases]) {
      if (path === prefix || path.startsWith(`${prefix}/`)) return SECTION_BASES[route.key] + path.slice(prefix.length);
    }
  }
  return path;
}
export function validSectionPath(path: string) {
  return /^\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(path) && path.length <= 161;
}
