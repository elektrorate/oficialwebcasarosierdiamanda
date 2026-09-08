import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import ClassEditForm from "@/components/admin/ClassEditForm";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { requireAdminProfile } from "@/lib/auth/supabase-auth";
import { getClassEditorPreviewChrome } from "@/lib/cms/class-editor-preview";
import { getOfferingById } from "@/lib/cms/offerings";
import type { Offering, OfferingType } from "@/lib/cms/types";

export function newProductOffering(type: OfferingType): Offering {
  const now = new Date().toISOString();
  return {
    id: "new",
    type,
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

function productLabel(typeLabel: string) {
  return typeLabel.toLowerCase();
}

export async function EditProductOfferingPage({
  id,
  expectedType,
  typeLabel,
  basePath,
}: {
  id: string;
  expectedType: OfferingType;
  typeLabel: string;
  basePath: string;
}) {
  const session = await requireAdminProfile();
  if (!session) redirect("/auth");

  const [offering, previewChrome] = await Promise.all([
    getOfferingById(id),
    getClassEditorPreviewChrome(),
  ]);
  if (!offering || offering.type !== expectedType) {
    return (
      <AdminShell>
        <EmptyState
          icon={expectedType === "gift_card" ? "card_giftcard" : "school"}
          title={`${typeLabel} no encontrado`}
          description={`El ${productLabel(typeLabel)} que intentas editar no existe o fue eliminado.`}
          action={<Button href={basePath}>Volver al listado</Button>}
        />
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <TopBar
        title={offering.title || `Editar ${productLabel(typeLabel)}`}
        subtitle="Edición personalizada de página de producto"
        actions={
          <>
            <Button href={basePath} variant="ghost">
              Volver
            </Button>
            <Button type="submit" form="class-edit-form" name="intent" value="draft" variant="outlined" data-default-label="Borrador">
              Borrador
            </Button>
            <Button type="submit" form="class-edit-form" name="intent" value="publish" data-default-label="Publicar">
              Publicar
            </Button>
          </>
        }
      />

      <ClassEditForm key={offering.id} offering={offering} basePath={basePath} previewChrome={previewChrome} />
    </AdminShell>
  );
}

export async function NewProductOfferingPage({
  type,
  typeLabel,
  basePath,
}: {
  type: OfferingType;
  typeLabel: string;
  basePath: string;
}) {
  const previewChrome = await getClassEditorPreviewChrome();

  return (
    <AdminShell>
      <TopBar
        title={`Nuevo ${productLabel(typeLabel)}`}
        subtitle="Crea una página de producto personalizada"
        actions={
          <>
            <Button href={basePath} variant="ghost">
              Volver
            </Button>
            <Button type="submit" form="class-edit-form" name="intent" value="draft" variant="outlined" data-default-label="Borrador">
              Borrador
            </Button>
            <Button type="submit" form="class-edit-form" name="intent" value="publish" data-default-label="Publicar">
              Publicar
            </Button>
          </>
        }
      />

      <ClassEditForm offering={newProductOffering(type)} mode="create" basePath={basePath} previewChrome={previewChrome} />
    </AdminShell>
  );
}
