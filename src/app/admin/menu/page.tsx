import AdminShell from "@/components/admin/AdminShell";
import PublicMenuEditor from "@/components/admin/PublicMenuEditor";
import { getMenuByLocation } from "@/lib/cms/menus";
import { getPublicNavigationItems, invalidatePublicNavigationCache } from "@/lib/cms/navigation-public";
import { getSettings } from "@/lib/cms/settings";
import { getMenuPublicationSnapshot } from "@/lib/cms/menu-publication";

export default async function MenuPage() {
  invalidatePublicNavigationCache();

  const [menu, settings, navigationItems] = await Promise.all([
    getMenuByLocation("main"),
    getSettings(),
    getPublicNavigationItems("main"),
  ]);

  let revision = "";
  let publicationError = "";
  try { if (menu) revision = (await getMenuPublicationSnapshot(menu.id)).revision; }
  catch (error) { publicationError = error instanceof Error ? error.message : "No se pudo preparar la publicación."; }
  return (
    <AdminShell>
      {publicationError ? <p role="alert">{publicationError}</p> : null}
      <PublicMenuEditor initialMenu={menu} initialSettings={settings} availableNavigationItems={navigationItems} initialRevision={revision} />
    </AdminShell>
  );
}
