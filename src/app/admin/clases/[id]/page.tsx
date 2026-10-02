import Link from "@/components/admin/AdminLink";
import { formatAdminDateTime } from "@/lib/admin/date-format";
import Image from "next/image";
import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import MetricCard from "@/components/ui/MetricCard";
import EmptyState from "@/components/ui/EmptyState";
import { requireAdminProfile } from "@/lib/auth/supabase-auth";
import { getOfferingById } from "@/lib/cms/offerings";

function statusLabel(status: string) {
  if (status === "published") return { label: "Publicado", variant: "success" as const };
  if (status === "draft") return { label: "Borrador", variant: "warning" as const };
  if (status === "archived") return { label: "Archivado", variant: "neutral" as const };
  return { label: "Eliminado", variant: "error" as const };
}

export default async function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminProfile();
  if (!session) redirect("/auth");

  const offering = await getOfferingById((await params).id);
  if (!offering || offering.type !== "class") {
    return (
      <AdminShell>
        <EmptyState
          icon="school"
          title="Curso no encontrado"
          description="El curso que intentas ver no existe o fue eliminado."
          action={<Button href="/admin/clases">Volver al listado</Button>}
        />
      </AdminShell>
    );
  }

  const status = statusLabel(offering.status);
  const scheduleItems = offering.schedule.length ? offering.schedule : ["Sin horario definido"];

  return (
    <AdminShell>
      <TopBar
        title={offering.title}
        subtitle={offering.subtitle || "Detalle de curso"}
        actions={
          <>
            <Button href={`/admin/clases/${offering.id}/edit`} variant="outlined">
              Editar
            </Button>
            <Button href="/admin/clases" variant="ghost">
              Volver
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-section-gap">
        <MetricCard icon="price_check" iconBg="bg-primary-container" value={offering.price ? `${offering.currency} ${offering.price}` : "Sin precio"} label="Tarifa" />
        <MetricCard icon="schedule" iconBg="bg-tertiary-container" iconClassName="text-on-tertiary-container" value={offering.duration || "Sin duración"} label="Duración" />
        <MetricCard icon="group" iconBg="bg-secondary-container" iconClassName="text-on-secondary" value={offering.capacity ?? "∞"} label="Cupos" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.8fr] gap-6">
        <Card padding="lg" className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Badge variant={status.variant}>{status.label}</Badge>
              <h2 className="text-headline-md text-on-surface mt-3">{offering.title}</h2>
              <p className="text-body-md text-on-surface-variant mt-1">{offering.excerpt}</p>
            </div>
            {offering.featured ? <Badge variant="info">Destacada</Badge> : null}
          </div>

          {offering.cover_image_url ? (
            <div className="relative h-64 rounded-xl overflow-hidden border border-outline-variant">
              <Image src={offering.cover_image_url} alt={offering.title} fill sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" unoptimized />
            </div>
          ) : null}

          <div>
            <h3 className="text-headline-sm text-on-surface mb-2">Descripción</h3>
            <p className="text-body-md leading-7 text-on-surface-variant whitespace-pre-line">{offering.description || "Sin descripción."}</p>
          </div>

          <div>
            <h3 className="text-headline-sm text-on-surface mb-3">Horario</h3>
            <div className="flex flex-wrap gap-2">
              {scheduleItems.map((item) => (
                <Badge key={item} variant="neutral">{item}</Badge>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-headline-sm text-on-surface mb-3">Galería</h3>
            {offering.gallery.length ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {offering.gallery.map((url) => (
                  <div key={url} className="relative rounded-lg overflow-hidden border border-outline-variant aspect-square">
                    <Image src={url} alt="Galería del curso" fill sizes="(min-width: 640px) 33vw, 50vw" className="object-cover" unoptimized />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-body-md text-on-surface-variant">Sin imágenes adicionales.</p>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card padding="lg">
            <h3 className="text-headline-sm text-on-surface mb-4">Información</h3>
            <dl className="space-y-4 text-body-md">
              <div>
                <dt className="text-on-surface-variant text-label-md">Profesor</dt>
                <dd className="text-on-surface">{offering.teacher || "Sin profesor"}</dd>
              </div>
              <div>
                <dt className="text-on-surface-variant text-label-md">Slug</dt>
                <dd className="text-on-surface">/{offering.slug}</dd>
              </div>
              <div>
                <dt className="text-on-surface-variant text-label-md">Header vinculado</dt>
                <dd className="text-on-surface">{offering.header_id ?? "Sin header"}</dd>
              </div>
              <div>
                <dt className="text-on-surface-variant text-label-md">SEO title</dt>
                <dd className="text-on-surface">{offering.seo_title || "Sin SEO title"}</dd>
              </div>
              <div>
                <dt className="text-on-surface-variant text-label-md">SEO description</dt>
                <dd className="text-on-surface">{offering.seo_description || "Sin SEO description"}</dd>
              </div>
            </dl>
          </Card>

          <Card padding="lg">
            <h3 className="text-headline-sm text-on-surface mb-4">Sistema</h3>
            <div className="space-y-3 text-body-md text-on-surface-variant">
              <p>Creada: {formatAdminDateTime(offering.created_at)}</p>
              <p>Actualizada: {formatAdminDateTime(offering.updated_at)}</p>
              {offering.deleted_at ? <p>Eliminada: {formatAdminDateTime(offering.deleted_at)}</p> : null}
            </div>
          </Card>

          <Card padding="lg">
            <h3 className="text-headline-sm text-on-surface mb-4">Acciones</h3>
            <div className="flex flex-col gap-3">
              <Button href={`/admin/clases/${offering.id}/edit`} icon="edit">
                Editar curso
              </Button>
              <Link href="/admin/clases" className="text-label-md text-primary font-semibold hover:underline">
                Volver al listado
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
