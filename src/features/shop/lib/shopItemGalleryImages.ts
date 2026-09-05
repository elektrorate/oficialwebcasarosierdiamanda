import type { ShopItem } from "@/data/types";

const MAX_SHOP_GALLERY_IMAGES = 8;

export function shopItemGalleryImages(item: ShopItem): string[] {
  const candidates = [item.image, ...item.gallery];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const src of candidates) {
    const key = src.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(key);
    if (result.length >= MAX_SHOP_GALLERY_IMAGES) break;
  }
  return result;
}
