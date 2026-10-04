import type { NavigationItem } from "../data/types.ts";

export type IdentifiedNavigationItem = Omit<NavigationItem, "id" | "children"> & {
  id: string;
  children?: IdentifiedNavigationItem[];
};

export function identifyNavigationItems(items: NavigationItem[], prefix = "navigation"): IdentifiedNavigationItem[] {
  return items.map((item, index) => {
    // Static previews can lack CMS IDs; their fallback must not depend on href.
    const id = item.id || `${prefix}:${index}`;
    return {
      ...item,
      id,
      children: item.children ? identifyNavigationItems(item.children, id) : undefined,
    };
  });
}

export function dropdownHorizontalOffset(left: number, width: number, viewportWidth: number, margin = 16): number {
  const lastLeft = Math.max(margin, viewportWidth - margin - width);
  return Math.min(Math.max(left, margin), lastLeft) - left;
}
