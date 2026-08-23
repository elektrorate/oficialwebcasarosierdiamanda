import AdminShell from "@/components/admin/AdminShell";
import UsersManager from "@/components/admin/UsersManager";
import TopBar from "@/components/layout/TopBar";
import { requireAdminProfile } from "@/lib/auth/supabase-auth";
import { redirect } from "next/navigation";

export default async function UsersPage() {
  const session = await requireAdminProfile();
  if (!session) redirect("/auth");
  if (session.profile.role !== "admin") redirect("/admin/dashboard");

  return (
    <AdminShell>
      <TopBar
        title="Usuarios"
        subtitle="Crea usuarios, asigna roles y administra sus accesos al CMS."
      />
      <div className="page-card">
        <div className="page-header">
          <div>
            <p className="auth-kicker">Accesos CMS</p>
            <h2>Usuarios y roles</h2>
            <p className="muted">
              El super admin definido en el entorno no se muestra ni se puede modificar desde esta vista.
            </p>
          </div>
        </div>
        <UsersManager initialUsers={[]} />
      </div>
    </AdminShell>
  );
}
