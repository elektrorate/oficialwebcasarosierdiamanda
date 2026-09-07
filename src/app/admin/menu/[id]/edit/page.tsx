import AdminShell from "@/components/admin/AdminShell";
import MenuForm from "@/components/admin/MenuForm";
import SectionEmptyState from "@/components/admin/SectionEmptyState";
import { getMenuById } from "@/lib/cms/menus";

export default async function EditMenuPage({ params }: { params: Promise<{ id: string }> }) {
  const menu = await getMenuById((await params).id);
  if (!menu) {
    return (
      <AdminShell>
        <SectionEmptyState title="Menú no encontrado" description="El menú que intentas editar no existe o fue eliminado." actionHref="/admin/menu" actionLabel="Volver al listado" />
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="section-head">
        <div>
          <p className="auth-kicker">CMS</p>
          <h2>Editar menú</h2>
        </div>
      </div>
      <MenuForm mode="edit" menu={menu} />
    </AdminShell>
  );
}
