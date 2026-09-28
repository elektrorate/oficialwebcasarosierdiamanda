import { HomeHeroView } from "@/components/layout/HomeHeroView";
import { resolveEditorialScrollMenu } from "@/components/layout/scroll-nav/resolveEditorialScrollMenu";
import { getHomePageSettings } from "@/lib/cms/home-page";
import { getPublicNavigationItems } from "@/lib/cms/navigation-public";
import { getSettings } from "@/lib/cms/settings";

export async function HeaderHome() {
  const [navigationItems, settings, homePage] = await Promise.all([
    getPublicNavigationItems("main"),
    getSettings(),
    getHomePageSettings(),
  ]);

  return (
    <HomeHeroView
      hero={homePage.hero}
      navigationItems={navigationItems}
      menu={resolveEditorialScrollMenu(settings.menu, settings.site)}
    />
  );
}
