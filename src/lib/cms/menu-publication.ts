import { createAdminClient } from "../supabase/admin";
import type { PublicationSnapshot } from "./menu-publication-plan";

export async function getMenuPublicationSnapshot(menuId: string): Promise<PublicationSnapshot> {
  const { data, error } = await createAdminClient().rpc("menu_publication_snapshot", { p_menu_id: menuId });
  if (error) throw new Error("No se puede publicar: falta la migración de menú o no se pudo leer la base de datos. Los cambios no se han guardado.");
  if (!data?.menu) throw new Error("Menú no encontrado.");
  return data as PublicationSnapshot;
}
