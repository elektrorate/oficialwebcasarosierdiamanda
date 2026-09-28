import { HeaderInterno } from "@/components/layout/HeaderInterno";
import type { CmsHeroSettings } from "@/lib/cms/types";
import { mapShopHeroHeaderProps } from "../utils/mapShopHeroHeaderProps";

export async function ShopIndexHeader({ hero, siteName = "Casa Rosier" }: { hero: CmsHeroSettings; siteName?: string }) {
  return <HeaderInterno {...mapShopHeroHeaderProps(hero, siteName)} />;
}
