"use client";

import { memo, useCallback, type DragEvent } from "react";
import Button from "@/components/ui/Button";
import { AdminInput, AdminTextarea } from "@/components/ui/AdminField";
import Switch from "@/components/ui/Switch";
import type { OfferingGalleryImage } from "@/lib/cms/types";
import type { ClassEditFormState } from "../hooks/useClassEditForm";
import { useGalleryDragDrop } from "../hooks/useGalleryDragDrop";
import { formatFileSize } from "../utils";
import { ImagePreview } from "../fields/ImagePreview";
import { ListItemActions } from "./ListItemActions";
import { SectionCard } from "./SectionCard";
import { MAX_GALLERY_IMAGES } from "../constants";

type GalleryImagesSectionProps = {
  form: ClassEditFormState;
};

function galleryItemKey(item: { image: string; order: number }) {
  // ALT is editable content and must never be part of the React key: changing
  // it would remount the row on every keystroke, losing focus and scroll.
  return `${item.order}-${item.image}`;
}

function GalleryImagesSectionComponent({ form }: GalleryImagesSectionProps) {
  const {
    details,
    errors,
    uploadingTarget,
    galleryUploadInfo,
    setPickerTarget,
    uploadImage,
    updateGalleryImage,
    moveGalleryImage,
    removeGalleryImage,
  } = form;

  const dragDrop = useGalleryDragDrop(form);
  const isAtLimit = details.galleryImages.length >= MAX_GALLERY_IMAGES;

  const openGalleryLibrary = useCallback(
    () => setPickerTarget("gallery"),
    [setPickerTarget],
  );

  const uploadNewGalleryImage = useCallback(
    (file: File) => void uploadImage("gallery:new", file),
    [uploadImage],
  );

  return (
    <SectionCard
      compact
      description={`Ordena las imágenes y agrega un texto alternativo breve para accesibilidad. ${details.galleryImages.length}/${MAX_GALLERY_IMAGES} imágenes.`}
      action={(
        <GalleryUploadActions
          isUploading={uploadingTarget === "gallery:new"}
          isAtLimit={isAtLimit}
          onOpenLibrary={openGalleryLibrary}
          onUpload={uploadNewGalleryImage}
        />
      )}
    >
      <div className="grid grid-cols-1 gap-3">
        {details.galleryImages.map((item, index) => (
          <GalleryImageRow
            key={galleryItemKey(item)}
            item={item}
            index={index}
            error={errors[`gallery-${index}`]}
            uploadInfo={galleryUploadInfo[item.image]}
            onDragStart={() => dragDrop.onDragStart(index)}
            onDragOver={dragDrop.onDragOver}
            onDrop={() => dragDrop.onDrop(index)}
            onMoveUp={() => moveGalleryImage(index, index - 1)}
            onMoveDown={() => moveGalleryImage(index, index + 1)}
            onRemove={() => removeGalleryImage(index)}
            onReplace={() => setPickerTarget(`gallery:${index}`)}
            onUploadFile={(file) => uploadImage(`gallery:${index}`, file)}
            isUploading={uploadingTarget === `gallery:${index}`}
            onAltChange={(alt) => updateGalleryImage(index, { alt })}
            onSeoTitleChange={(seoTitle) => updateGalleryImage(index, { seoTitle })}
            onSeoDescriptionChange={(seoDescription) => updateGalleryImage(index, { seoDescription })}
            onModalDescriptionChange={(modalDescription) => updateGalleryImage(index, { modalDescription })}
            onShowCtaChange={(showCta) => updateGalleryImage(index, { showCta })}
            onCtaLabelChange={(ctaLabel) => updateGalleryImage(index, { ctaLabel })}
            onCtaHrefChange={(ctaHref) => updateGalleryImage(index, { ctaHref })}
            onCtaNewTabChange={(ctaNewTab) => updateGalleryImage(index, { ctaNewTab })}
          />
        ))}
      </div>
    </SectionCard>
  );
}

const GalleryUploadActions = memo(function GalleryUploadActions({
  isUploading,
  isAtLimit,
  onOpenLibrary,
  onUpload,
}: {
  isUploading: boolean;
  isAtLimit: boolean;
  onOpenLibrary: () => void;
  onUpload: (file: File) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <label
        className={`secondary-btn cms-hero-image-field__button ${isAtLimit ? "pointer-events-none cursor-not-allowed opacity-50" : ""}`}
        htmlFor="gallery-new-upload"
        aria-disabled={isUploading || isAtLimit}
      >
        {isUploading ? "Subiendo..." : isAtLimit ? "Límite alcanzado" : "Subir imagen"}
      </label>
      <input
        id="gallery-new-upload"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="sr-only"
        disabled={isUploading || isAtLimit}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onUpload(file);
          event.target.value = "";
        }}
      />
      <Button type="button" variant="outlined" disabled={isUploading || isAtLimit} onClick={onOpenLibrary}>
        Anadir imagen
      </Button>
    </div>
  );
});

const GalleryImageRow = memo(function GalleryImageRow({
  item,
  index,
  error,
  uploadInfo,
  onDragStart,
  onDragOver,
  onDrop,
  onMoveUp,
  onMoveDown,
  onRemove,
  onReplace,
  onUploadFile,
  isUploading,
  onAltChange,
  onSeoTitleChange,
  onSeoDescriptionChange,
  onModalDescriptionChange,
  onShowCtaChange,
  onCtaLabelChange,
  onCtaHrefChange,
  onCtaNewTabChange,
}: {
  item: OfferingGalleryImage;
  index: number;
  error?: string;
  uploadInfo?: { originalSize: number; finalSize: number; reductionPercent: number };
  onDragStart: () => void;
  onDragOver: (event: DragEvent) => void;
  onDrop: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onReplace: () => void;
  onUploadFile: (file: File) => void;
  isUploading: boolean;
  onAltChange: (alt: string) => void;
  onSeoTitleChange: (seoTitle: string) => void;
  onSeoDescriptionChange: (seoDescription: string) => void;
  onModalDescriptionChange: (modalDescription: string) => void;
  onShowCtaChange: (showCta: boolean) => void;
  onCtaLabelChange: (ctaLabel: string) => void;
  onCtaHrefChange: (ctaHref: string) => void;
  onCtaNewTabChange: (ctaNewTab: boolean) => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="rounded-xl border border-outline-variant bg-surface-container-lowest p-3"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-label-md font-bold uppercase tracking-wide text-on-surface-variant">
          Imagen {index + 1}
        </span>
        <ListItemActions
          size="sm"
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onRemove={onRemove}
          removeLabel="Eliminar imagen"
        />
      </div>
      <div className="grid gap-3 md:grid-cols-[160px_minmax(0,1fr)] md:items-start">
        <div className="space-y-2">
          <ImagePreview
            src={item.image}
            alt={item.alt || `Imagen ${index + 1}`}
            aspect="h-24 w-full md:h-[104px]"
          />
          {uploadInfo ? (
            <p className="text-xs leading-5 text-on-surface-variant">
              Original: {formatFileSize(uploadInfo.originalSize)}.
              Optimizada: {formatFileSize(uploadInfo.finalSize)} (
              {uploadInfo.reductionPercent}% menos).
            </p>
          ) : null}
          <label
            className={`secondary-btn cms-hero-image-field__button ${isUploading ? "pointer-events-none cursor-not-allowed opacity-50" : ""}`}
            htmlFor={`gallery-upload-${index}`}
          >
            {isUploading ? "Subiendo..." : "Subir imagen"}
          </label>
          <input
            id={`gallery-upload-${index}`}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="sr-only"
            disabled={isUploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onUploadFile(file);
              event.target.value = "";
            }}
          />
          <Button type="button" variant="outlined" size="sm" className="w-full" onClick={onReplace}>
            Sustituir
          </Button>
        </div>
        <AdminInput
          label="Texto alternativo (ALT)"
          required
          value={item.alt}
          error={error}
          validationKey={`gallery-${index}`}
          onChange={(event) => onAltChange(event.target.value)}
        />
        <AdminInput
          label="SEO title (opcional)"
          placeholder="Título para SEO de esta imagen"
          value={item.seoTitle ?? ""}
          onChange={(event) => onSeoTitleChange(event.target.value)}
        />
        <AdminInput
          label="SEO description (opcional)"
          placeholder="Descripción para SEO de esta imagen"
          value={item.seoDescription ?? ""}
          onChange={(event) => onSeoDescriptionChange(event.target.value)}
        />
        <AdminTextarea
          label="Descripción pública de la imagen"
          help="Se mostrará junto a la imagen cuando se abra la galería ampliada."
          placeholder="Describe la imagen, la pieza o el proceso..."
          value={item.modalDescription ?? ""}
          onChange={(event) => onModalDescriptionChange(event.target.value)}
        />
        <div className="grid gap-3 md:col-start-2">
          <Switch
            checked={item.showCta === true}
            label="Mostrar botón CTA"
            description="Añade una acción opcional dentro del modal de esta imagen."
            onCheckedChange={onShowCtaChange}
          />
          {item.showCta ? (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                <AdminInput
                  label="Texto del botón CTA"
                  placeholder="Más información"
                  value={item.ctaLabel ?? ""}
                  onChange={(event) => onCtaLabelChange(event.target.value)}
                />
                <AdminInput
                  label="Enlace del botón CTA"
                  placeholder="/contacto o https://..."
                  value={item.ctaHref ?? ""}
                  onChange={(event) => onCtaHrefChange(event.target.value)}
                />
              </div>
              <Switch
                checked={item.ctaNewTab === true}
                label="Abrir CTA en una pestaña nueva"
                onCheckedChange={onCtaNewTabChange}
              />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
});

export const GalleryImagesSection = memo(GalleryImagesSectionComponent);
