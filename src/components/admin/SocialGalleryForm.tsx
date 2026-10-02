"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { SocialGallery, SocialGalleryItem } from "@/lib/cms/types";
import AdminActionModal from "./AdminActionModal";
import MediaSelectField from "./MediaSelectField";
import { MODAL_CONTENT_LIMITS, socialGalleryModalContentError } from "@/lib/cms/modal-content";

type Notice = { type: "success" | "error"; title: string; message: string };

function createGalleryItem(order: number): SocialGalleryItem {
  const now = new Date().toISOString();
  return {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `new_${Date.now()}_${order}`,
    image_id: "",
    image_url: "",
    title: "",
    description: "",
    instagram_url: "",
    sort_order: order,
    is_visible: true,
    created_at: now,
    updated_at: now,
  };
}

export default function SocialGalleryForm({
  mode,
  item,
}: {
  mode: "create" | "edit";
  item?: SocialGallery;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(item?.title ?? "Y tu, cuando tuviste\ntu ultima idea?");
  const [description, setDescription] = useState(item?.description ?? "siguenos en instagram - @casarosier");
  const [items, setItems] = useState<SocialGalleryItem[]>(item?.items ?? []);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!notice || notice.type === "success") return;
    const timer = window.setTimeout(() => setNotice(null), 4200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function addItem() {
    setItems((current) =>
      [createGalleryItem(0), ...current].map((galleryItem, order) => ({ ...galleryItem, sort_order: order })),
    );
  }

  function updateItem(index: number, field: keyof SocialGalleryItem, value: SocialGalleryItem[keyof SocialGalleryItem]) {
    setItems((current) =>
      current.map((galleryItem, itemIndex) =>
        itemIndex === index
          ? { ...galleryItem, [field]: value, updated_at: new Date().toISOString() }
          : galleryItem,
      ),
    );
  }

  function moveItem(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return;
    const next = [...items];
    const current = next[index];
    next[index] = next[nextIndex];
    next[nextIndex] = current;
    setItems(next.map((galleryItem, order) => ({ ...galleryItem, sort_order: order })));
  }

  function removeItem(index: number) {
    setItems((current) =>
      current
        .filter((_, itemIndex) => itemIndex !== index)
        .map((galleryItem, order) => ({ ...galleryItem, sort_order: order })),
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setNotice(null);

    const body = {
      name: "Galeria social principal",
      slug: "galeria-social",
      status: "published",
      title,
      description,
      cta_text: "",
      cta_url: "",
      items: items.map((galleryItem, order) => ({ ...galleryItem, is_visible: true, sort_order: order })),
    };

    const contentError = socialGalleryModalContentError(body);
    if (contentError) {
      setIsLoading(false);
      setNotice({ type: "error", title: "Revisa el contenido", message: contentError });
      return;
    }

    try {
      const response = await fetch(
        mode === "create" ? "/api/admin/components/social-galleries" : `/api/admin/components/social-galleries/${item?.id}`,
        {
          method: mode === "create" ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "No se pudo guardar la galería social." }));
        setNotice({
          type: "error",
          title: "No se pudo completar",
          message: (data as { error?: string }).error || "No se pudo guardar la galería social.",
        });
        return;
      }

      setNotice({
        type: "success",
        title: "Acción completada",
        message: "Galería social publicada exitosamente.",
      });
      router.refresh();
    } catch {
      setNotice({
        type: "error",
        title: "No se pudo conectar",
        message: "No se pudo conectar con el servidor. Intenta nuevamente.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className="editor-form social-gallery-editor" onSubmit={handleSubmit}>
      <AdminActionModal
        open={Boolean(notice)}
        type={notice?.type}
        title={notice?.title ?? ""}
        message={notice?.message}
        confirmLabel="Entendido"
        onClose={() => setNotice(null)}
      />

      <section className="form-block">
        <h3>Contenido de la sección</h3>
        <div className="grid-2">
          <label className="field span-2">
            <span>Título de la sección</span>
            <textarea rows={2} value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label className="field span-2">
            <span>Descripción</span>
            <textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
          </label>
        </div>
      </section>

      <section className="form-block">
        <div className="menu-editor-head">
          <div>
            <h3>Fotos de la galería ({items.length})</h3>
            <p className="muted">Cada foto puede tener título, texto y link del post.</p>
          </div>
          <button type="button" className="primary-btn" onClick={addItem}>
            Añadir foto
          </button>
        </div>

        {items.length === 0 ? (
          <div className="empty-inline">
            <strong>Aún no hay fotos.</strong>
            <span>Añade la primera imagen para verla en la sección pública.</span>
          </div>
        ) : (
          <div className="social-gallery-item-list">
            {items.map((galleryItem, index) => (
              <article key={galleryItem.id} className="social-gallery-item-card">
                <MediaSelectField
                  label="Imagen"
                  value={galleryItem.image_url}
                  onChange={(url) => updateItem(index, "image_url", url)}
                  className="social-gallery-item-card__media"
                  previewClassName="social-gallery-item-card__preview"
                />
                <div className="social-gallery-item-card__content">
                  <div className="social-gallery-item-card__top">
                    <div>
                      <strong>Foto {index + 1}</strong>
                      <span>Se muestra en la web</span>
                    </div>
                    <div className="row-actions">
                      <button type="button" className="secondary-btn icon-btn" onClick={() => moveItem(index, -1)} disabled={index === 0} aria-label="Subir foto">
                        <span className="material-symbols-outlined">keyboard_arrow_up</span>
                      </button>
                      <button type="button" className="secondary-btn icon-btn" onClick={() => moveItem(index, 1)} disabled={index === items.length - 1} aria-label="Bajar foto">
                        <span className="material-symbols-outlined">keyboard_arrow_down</span>
                      </button>
                      <button type="button" className="danger-btn" onClick={() => removeItem(index)}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                  <div className="grid-2">
                    <label className="field">
                      <span>Título ({galleryItem.title.trim().length}/{MODAL_CONTENT_LIMITS.title})</span>
                      <input maxLength={MODAL_CONTENT_LIMITS.title} value={galleryItem.title} onChange={(event) => updateItem(index, "title", event.target.value)} />
                    </label>
                    <label className="field">
                      <span>Link del post</span>
                      <input value={galleryItem.instagram_url} onChange={(event) => updateItem(index, "instagram_url", event.target.value)} placeholder="https://instagram.com/p/..." />
                    </label>
                    <label className="field span-2">
                      <span>Texto ({galleryItem.description.trim().length}/{MODAL_CONTENT_LIMITS.description})</span>
                      <textarea maxLength={MODAL_CONTENT_LIMITS.description} rows={3} value={galleryItem.description} onChange={(event) => updateItem(index, "description", event.target.value)} />
                    </label>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="form-actions sticky-form-actions">
        <button className="primary-btn" type="submit" disabled={isLoading}>
          {isLoading ? "Guardando..." : "Guardar galería social"}
        </button>
      </div>
    </form>
  );
}
