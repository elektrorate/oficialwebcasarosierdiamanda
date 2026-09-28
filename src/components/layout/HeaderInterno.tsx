import { getPublicNavigationItems } from "@/lib/cms/navigation-public";
import { getSettings } from "@/lib/cms/settings";
import { resolveEditorialScrollMenu } from "@/components/layout/scroll-nav/resolveEditorialScrollMenu";
import { HeaderInternoView } from "./header-interno/HeaderInternoView";
import type { HeaderInternoProps } from "./header-interno/headerInternoTypes";

export type { HeaderInternoProps } from "./header-interno/headerInternoTypes";

export async function HeaderInterno(props: HeaderInternoProps) {
  const [navigationItems, settings] = await Promise.all([
    getPublicNavigationItems("main"),
    getSettings(),
  ]);

  return (
    <HeaderInternoView
      {...props}
      navigationItems={navigationItems}
      menu={resolveEditorialScrollMenu(settings.menu, settings.site)}
    />
  );
}
