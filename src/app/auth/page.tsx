import { redirect } from "next/navigation";
import LoginForm from "@/components/admin/LoginForm";
import { requireAdminProfile } from "@/lib/auth/supabase-auth";

export const metadata = {
  title: "Administracion | Casa Rosier",
  robots: { index: false, follow: false },
};

export default async function AuthPage() {
  const session = await requireAdminProfile();
  if (session) redirect("/admin/dashboard");

  return (
    <main className="cms-admin auth-screen">
      <section className="auth-panel" aria-labelledby="auth-title">
        <p className="auth-kicker">Casa Rosier CMS</p>
        <h1 id="auth-title">Administracion</h1>
        <p className="auth-copy">
          Accede al panel privado para publicar clases, contenidos, formularios y
          configuracion del sitio.
        </p>
        <LoginForm />
      </section>
    </main>
  );
}
