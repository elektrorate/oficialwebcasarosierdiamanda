import { createAdminClient } from "../supabase/admin";
import { canonicalMenuPath, type SectionRoute } from "./menu-routing";

export async function getPublicSectionRoutes(): Promise<SectionRoute[]> {
  const { data, error } = await createAdminClient().from("public_section_routes").select("key,path,aliases");
  // Backward compatible until the additive migration is installed.
  if (error?.code === "PGRST205" || error?.code === "42P01") return [];
  if (error) throw new Error("No se pudieron consultar las rutas públicas.");
  return (data ?? []) as SectionRoute[];
}
export async function canonicalPublicPath(path: string) {
  return canonicalMenuPath(path, await getPublicSectionRoutes());
}
