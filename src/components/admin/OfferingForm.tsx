"use client";

import Image from "next/image";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import type { Header, Offering } from "@/lib/cms/types";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Checkbox from "@/components/ui/Checkbox";
import Button from "@/components/ui/Button";
import MediaLibraryModal from "./MediaLibraryModal";
import { CmsRichTextField } from "@/components/admin/CmsRichTextField";
import SeoReview from "./SeoReview";
import { getActionWarnings } from "@/lib/admin/action-warnings";

function defaultOffering(type?: string): Partial<Offering> {
  return {
    type: (type as Offering["type"]) ?? "class",
    title: "",
    slug: "",
    subtitle: "",
    excerpt: "",
    description: "",
    price: null,
    currency: "USD",
    status: "draft",
    featured: false,
    duration: "",
    schedule: [],
    teacher: "",
    capacity: null,
    cover_image_url: "",
    gallery: [],
    seo_title: "",
    seo_description: "",
  };
}

function joinLines(items?: string[]) {
  return items?.join("\n") ?? "";
}

export default function OfferingForm({
  mode,
  offering,
  defaultType,
  returnHref = "/admin/offerings",
}: {
  mode: "create" | "edit";
  offering?: Offering;
  defaultType?: string;
  returnHref?: string;
}) {
  const router = useRouter();
  const current = offering ?? (defaultOffering(defaultType) as Offering);
  const [recordId, setRecordId] = useState(mode === "edit" ? offering?.id : undefined);
  const [seoWarnings, setSeoWarnings] = useState<string[]>([]);
  const [title, setTitle] = useState(current.title);
  const [seoTitle, setSeoTitle] = useState(current.seo_title);
  const [seoDescription, setSeoDescription] = useState(current.seo_description);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [coverUrl, setCoverUrl] = useState(current.cover_image_url);
  const [galleryUrls, setGalleryUrls] = useState<string[]>(current.gallery);
  const [excerpt, setExcerpt] = useState(current.excerpt);
  const [description, setDescription] = useState(current.description);
  const [pickerFor, setPickerFor] = useState<"cover" | "gallery" | null>(null);
  const [headers, setHeaders] = useState<Header[]>([]);
  const [headerId, setHeaderId] = useState(current.header_id ?? "");

  useEffect(() => {
    fetch("/api/admin/headers")
      .then((r) => r.json())
      .then((data) => setHeaders(data.headers ?? []))
      .catch(() => {});
  }, []);

  function handleSelectFromPicker(url: string) {
    if (pickerFor === "cover") {
      setCoverUrl(url);
    } else if (pickerFor === "gallery") {
      if (!galleryUrls.includes(url)) {
        setGalleryUrls([...galleryUrls, url]);
      }
    }
    setPickerFor(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const payload = {
      header_id: headerId || null,
      type: current.type,
      title: String(formData.get("title") || "").trim(),
      slug: String(formData.get("slug") || "").trim(),
      subtitle: String(formData.get("subtitle") || "").trim(),
      excerpt: excerpt.trim(),
      description: description.trim(),
      price: String(formData.get("price") || "").trim(),
      currency: String(formData.get("currency") || "USD").trim(),
      status: String(formData.get("status") || "draft").trim(),
      featured: formData.get("featured") === "on",
      duration: String(formData.get("duration") || "").trim(),
      schedule: String(formData.get("schedule") || ""),
      teacher: String(formData.get("teacher") || "").trim(),
      capacity: String(formData.get("capacity") || "").trim(),
      seo_title: String(formData.get("seo_title") || "").trim(),
      seo_description: String(formData.get("seo_description") || "").trim(),
      cover_image_url: coverUrl,
      gallery: galleryUrls,
    };

    if (!payload.title || !payload.type) {
      setError("El título y el tipo son obligatorios.");
      setIsLoading(false);
      return;
    }

    const body = JSON.stringify({
      ...payload,
      price: payload.price ? Number(payload.price) : null,
      capacity: payload.capacity ? Number(payload.capacity) : null,
      schedule: payload.schedule,
      gallery: payload.gallery,
    });

    const response = await fetch(recordId ? `/api/admin/offerings/${recordId}` : "/api/admin/offerings", {
      method: recordId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      setError(data.error || "No se pudo guardar el contenido.");
      setIsLoading(false);
      return;
    }

    const data = await response.json() as { offering: Offering; warnings?: string[] };
    const warnings = getActionWarnings(data.warnings);
    setRecordId(data.offering.id);
    setSeoWarnings(warnings);
    setIsLoading(false);
    if (!warnings.length) router.push(returnHref);
    router.refresh();
  }

  function removeGalleryUrl(index: number) {
    setGalleryUrls(galleryUrls.filter((_, i) => i !== index));
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
        <SeoReview kind="offering" id={recordId} title={seoTitle} description={seoDescription} fallbackTitle={title} fallbackDescription={excerpt} serverWarnings={seoWarnings} />
        {/* Información principal */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-4">
          <h3 className="text-headline-sm text-headline-sm text-on-surface">Información principal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Estado"
              name="status"
              defaultValue={current.status}
              options={[
                { value: "draft", label: "Borrador" },
                { value: "published", label: "Publicado" },
                { value: "archived", label: "Archivado" },
                { value: "deleted", label: "Eliminado" },
              ]}
            />
            <Select
              label="Header"
              value={headerId}
              onChange={(e) => setHeaderId(e.target.value)}
              placeholder="Sin header"
              options={headers
                .filter((h) => h.status === "published")
                .map((h) => ({ value: h.id, label: h.name }))}
            />
            <div className="md:col-span-2">
              <Input label="Título" name="title" value={title} onChange={(event) => setTitle(event.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Input
                label="Slug"
                name="slug"
                defaultValue={current.slug}
                helpText="Se genera automáticamente si lo dejas vacío"
              />
            </div>
            <div className="md:col-span-2">
              <Input label="Subtítulo" name="subtitle" defaultValue={current.subtitle} />
            </div>
            <div className="md:col-span-2">
              <CmsRichTextField label="Descripción corta" value={excerpt} onChange={setExcerpt} minHeight="130px" />
            </div>
            <div className="md:col-span-2">
              <CmsRichTextField label="Descripción completa" value={description} onChange={setDescription} minHeight="240px" />
            </div>
          </div>
        </section>

        {/* Detalles */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-4">
          <h3 className="text-headline-sm text-headline-sm text-on-surface">Detalles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Precio" name="price" type="number" step="0.01" defaultValue={current.price ?? ""} />
            <Input label="Moneda" name="currency" defaultValue={current.currency} />
            <Input label="Duración" name="duration" defaultValue={current.duration} />
            <Input label="Cupos" name="capacity" type="number" defaultValue={current.capacity ?? ""} />
            <div className="md:col-span-2">
              <Textarea label="Horario" name="schedule" rows={4} defaultValue={joinLines(current.schedule)} />
            </div>
            <div className="md:col-span-2">
              <Input label="Profesor" name="teacher" defaultValue={current.teacher} />
            </div>
            <div className="md:col-span-2">
              <Checkbox label="Destacado" name="featured" defaultChecked={Boolean(current.featured)} />
            </div>
          </div>
        </section>

        {/* Imagen y galería */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-4">
          <h3 className="text-headline-sm text-headline-sm text-on-surface">Imagen y galería</h3>
          <div className="space-y-4">
            <div>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Input
                    label="Imagen principal URL"
                    name="cover_image_url"
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <Button type="button" variant="outlined" onClick={() => setPickerFor("cover")}>
                  Biblioteca
                </Button>
              </div>
              {coverUrl && (
                <div className="relative mt-3 rounded-lg overflow-hidden border border-outline-variant w-48 h-28">
                  <Image src={coverUrl} alt="Preview" fill sizes="192px" className="object-cover" unoptimized />
                </div>
              )}
            </div>

            <div>
              <span className="block text-label-md text-on-surface-variant font-medium mb-1.5">Galería URLs</span>
              <Button type="button" variant="outlined" onClick={() => setPickerFor("gallery")}>
                Añadir desde biblioteca
              </Button>
              {galleryUrls.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-3">
                  {galleryUrls.map((url, i) => (
                    <div key={i} className="relative group rounded-lg overflow-hidden border border-outline-variant w-24 h-24">
                      <Image src={url} alt="" fill sizes="96px" className="object-cover" unoptimized />
                      <button
                        type="button"
                        onClick={() => removeGalleryUrl(i)}
                        className="absolute top-1 right-1 w-6 h-6 bg-error text-on-error rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SEO */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-4">
          <h3 className="text-headline-sm text-headline-sm text-on-surface">SEO</h3>
          <div className="space-y-4">
            <Input label="SEO title" name="seo_title" value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} />
            <Textarea label="SEO description" name="seo_description" rows={3} value={seoDescription} onChange={(event) => setSeoDescription(event.target.value)} />
          </div>
        </section>

        {error && (
          <div className="bg-error-container border border-error rounded-xl p-4 text-label-md text-on-error-container">
            {error}
          </div>
        )}

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Guardando..." : mode === "create" ? "Crear contenido" : "Guardar cambios"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>

      <MediaLibraryModal
        open={pickerFor !== null}
        onSelect={handleSelectFromPicker}
        onClose={() => setPickerFor(null)}
      />
    </>
  );
}
