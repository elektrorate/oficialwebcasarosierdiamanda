import type { NavigationItem } from "@/data/types";

/** Split visible nav into left / right groups around a centered logo. */
export function splitNavigationColumns<T extends NavigationItem>(items: T[]) {

  const visible = items
    .filter((item) => item.visible)
    .sort((a, b) => a.order - b.order);
  const mid = Math.ceil(visible.length / 2);
  return {
    left: visible.slice(0, mid),
    right: visible.slice(mid),
  };
}
