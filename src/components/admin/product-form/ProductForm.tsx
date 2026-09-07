"use client";

import AdminActionModal from "@/components/admin/AdminActionModal";
import { ProductCharacteristicsSection } from "./components/ProductCharacteristicsSection";
import { ProductContentSection } from "./components/ProductContentSection";
import { ProductCtaSection } from "./components/ProductCtaSection";
import { ProductFormActions } from "./components/ProductFormActions";
import { ProductFormHero } from "./components/ProductFormHero";
import { ProductGeneralSection } from "./components/ProductGeneralSection";
import { ProductMediaSection } from "./components/ProductMediaSection";
import { ProductPricingSection } from "./components/ProductPricingSection";
import { ProductSeoSection } from "./components/ProductSeoSection";
import { useProductForm } from "./hooks/useProductForm";
import type { ProductFormProps } from "./types";

export default function ProductForm({ mode, item }: ProductFormProps) {
  const form = useProductForm(mode, item);

  return (
    <form className="shop-product-editor" onSubmit={form.handleSubmit} noValidate>
      <AdminActionModal
        open={Boolean(form.modal)}
        type={form.modal?.type ?? "info"}
        title={form.modal?.title ?? ""}
        message={form.modal?.message}
        details={form.modal?.details}
        confirmLabel="Entendido"
        onClose={form.closeModal}
      />
      <AdminActionModal
        open={form.deleteConfirmOpen}
        type="confirm"
        title="Eliminar producto"
        message={`Se moverá “${form.fields.name || "este producto"}” a la papelera. Podrás restaurarlo después.`}
        confirmLabel="Mover a papelera"
        cancelLabel="Cancelar"
        onConfirm={() => void form.trashProduct()}
        onClose={form.closeDeleteConfirm}
      />

      <ProductFormHero mode={mode} name={form.fields.name} status={form.fields.status} />

      <div className="shop-product-editor__layout">
        <div className="shop-product-editor__main">
          <ProductGeneralSection
            fields={form.fields}
            categories={form.categories}
            categoriesLoading={form.categoriesLoading}
            categoriesError={form.categoriesError}
            disabled={form.isSaving}
            onNameChange={(value) => form.updateField("name", value)}
            onCategoryChange={(value) => form.updateField("categoryId", value)}
          />

          <ProductContentSection
            fields={form.fields}
            disabled={form.isSaving}
            onExcerptChange={(value) => form.updateField("excerpt", value)}
            onDescriptionChange={(value) => form.updateField("description", value)}
          />

          <ProductPricingSection
            fields={form.fields}
            disabled={form.isSaving}
            onPriceChange={(value) => form.updateField("price", value)}
            onStockChange={(value) => form.updateField("stock", value)}
            onLowStockChange={(value) => form.updateField("lowStockThreshold", value)}
          />

          <ProductCharacteristicsSection
            fields={form.fields}
            disabled={form.isSaving}
            onCharacteristicsChange={(value) => form.updateField("characteristics", value)}
            onWeightChange={(value) => form.updateField("weight", value)}
            onDimensionsChange={(value) => form.updateField("dimensions", value)}
          />
        </div>

        <aside className="shop-product-editor__side">
          <ProductMediaSection
            mainImageId={form.fields.mainImageId}
            gallery={form.fields.gallery}
            disabled={form.isSaving}
            onMainImageChange={(value) => form.updateField("mainImageId", value)}
            onGalleryAdd={form.addGalleryImages}
            onGalleryRemove={form.removeGalleryImage}
            onGalleryMove={form.moveGalleryImage}
          />

          <ProductCtaSection
            fields={form.fields}
            disabled={form.isSaving}
            onLabelChange={(value) => form.updateField("ctaLabel", value)}
            onUrlChange={(value) => form.updateField("ctaUrl", value)}
          />

          <ProductSeoSection
            fields={form.fields}
            disabled={form.isSaving}
            onTitleChange={(value) => form.updateField("seoTitle", value)}
            onDescriptionChange={(value) => form.updateField("seoDescription", value)}
            onImageChange={(value) => form.updateField("seoImage", value)}
          />
        </aside>
      </div>

      {form.error ? <p className="form-error">{form.error}</p> : null}

      <ProductFormActions
        fields={form.fields}
        mode={mode}
        savingIntent={form.savingIntent}
        isDeleting={form.isDeleting}
        onRequestDelete={form.requestDelete}
        disabled={form.isSaving}
      />
    </form>
  );
}
