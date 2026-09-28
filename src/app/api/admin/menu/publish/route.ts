import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/auth/supabase-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { invalidateMenuCache } from "@/lib/cms/menus";
import { invalidateOfferingsCache } from "@/lib/cms/offerings";
import { invalidatePublicNavigationCache } from "@/lib/cms/navigation-public";
import { invalidatePublicRedirectCache } from "@/lib/cms/public-redirects";
import { invalidateSettingsCaches } from "@/lib/cms/settings-cache";
import { validateSettingsPayload } from "@/lib/cms/settings-schema";
import { getMenuPublicationSnapshot } from "@/lib/cms/menu-publication";
import { planMenuPublication } from "@/lib/cms/menu-publication-plan";

export async function PUT(request: NextRequest) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    if (typeof body.menuId !== "string" || !Array.isArray(body.items) || typeof body.revision !== "string") {
      return NextResponse.json({ error: "Recarga el editor para obtener una revisión válida." }, { status: 400 });
    }
    const snapshot = await getMenuPublicationSnapshot(body.menuId);
    if (snapshot.revision !== body.revision) return NextResponse.json({ error: "El contenido cambió en otra sesión. Recarga el editor antes de publicar." }, { status: 409 });
    const validation = validateSettingsPayload({ menu: body.settings?.menu });
    if (!validation.ok) return NextResponse.json({ error: "Revisa la configuración del menú.", errors: validation.errors }, { status: 422 });
    const plan = planMenuPublication(snapshot, body.items, body.confirmMoves === true);
    if (body.preview === true) return NextResponse.json({ messages: plan.messages, revision: snapshot.revision });
    const { data, error } = await createAdminClient().rpc("publish_menu_revision", {
      p_menu_id: body.menuId, p_revision: body.revision, p_plan: plan,
      p_visual: validation.value.menu ?? null, p_actor: session.userEmail,
    });
    if (error) return NextResponse.json({ error: error.code === "40001" ? "El contenido cambió en otra sesión. Recarga antes de publicar." : "No se pudo publicar. La operación se ha cancelado sin guardar parcialmente." }, { status: error.code === "40001" ? 409 : 500 });
    invalidateSettingsCaches(); invalidateMenuCache(); invalidateOfferingsCache();
    invalidatePublicNavigationCache(); invalidatePublicRedirectCache();
    revalidatePath("/", "layout"); revalidatePath("/sitemap.xml");
    revalidatePath("/admin", "layout");
    return NextResponse.json({ items: data.items, revision: data.revision, messages: plan.messages });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Publicación no válida." }, { status: 400 });
  }
}
