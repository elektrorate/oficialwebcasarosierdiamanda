import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import ClassEditForm from "@/components/admin/ClassEditForm";
import TopBar from "@/components/layout/TopBar";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import { requireAdminProfile } from "@/lib/auth/supabase-auth";
import { getClassEditorPreviewChrome } from "@/lib/cms/class-editor-preview";
import { getOfferingById } from "@/lib/cms/offerings";

export default async function EditClassPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminProfile();
  if (!session) redirect("/auth");

  const [offering, previewChrome] = await Promise.all([
    getOfferingById((await params).id),
    getClassEditorPreviewChrome(),
  ]);
  if (!offering || offering.type !== "class") {
    return (
      <AdminShell>
        <EmptyState
          icon="school"
          title="Clase no encontrada"
          description="La clase que intentas editar no existe o fue eliminada."
          action={<Button href="/admin/clases">Volver al listado</Button>}
        />
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <TopBar
        title={offering.title || "Editar clase"}
        subtitle="Edición personalizada de página de producto"
        actions={
          <>
            <Button href="/admin/clases" variant="ghost">
              Volver
            </Button>
            <Button type="submit" form="class-edit-form" name="intent" value="draft" variant="outlined">
              Borrador
            </Button>
            <Button type="submit" form="class-edit-form" name="intent" value="publish">
              Publicar
            </Button>
          </>
        }
      />

      <ClassEditForm key={offering.id} offering={offering} previewChrome={previewChrome} />
    </AdminShell>
  );
}
