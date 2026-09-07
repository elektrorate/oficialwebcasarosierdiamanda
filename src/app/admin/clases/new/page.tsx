import AdminShell from "@/components/admin/AdminShell";
import ClassEditForm from "@/components/admin/ClassEditForm";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/ui/Button";
import { getClassEditorPreviewChrome } from "@/lib/cms/class-editor-preview";
import type { Offering } from "@/lib/cms/types";

function newClassOffering(): Offering {
  const now = new Date().toISOString();
  return {
    id: "new",
    type: "class",
    title: "",
    slug: "",
    subtitle: "",
    excerpt: "",
    description: "",
    price: null,
    currency: "EUR",
    status: "draft",
    featured: false,
    header_id: null,
    duration: "",
    schedule: [],
    teacher: "",
    capacity: null,
    cover_image_url: "",
    gallery: [],
    details: {},
    seo_title: "",
    seo_description: "",
    expiration_enabled: false,
    expires_at: null,
    expired_at: null,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };
}

export default async function NewClassPage() {
  const previewChrome = await getClassEditorPreviewChrome();

  return (
    <AdminShell>
      <TopBar
        title="Nueva clase"
        subtitle="Crea una página de producto personalizada"
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

      <ClassEditForm offering={newClassOffering()} mode="create" previewChrome={previewChrome} />
    </AdminShell>
  );
}
