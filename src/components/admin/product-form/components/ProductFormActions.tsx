import { STATUS_LABELS } from "../constants";
import type { ProductFormFields, ProductFormMode, SaveIntent } from "../types";

type Props = {
  fields: ProductFormFields;
  mode: ProductFormMode;
  savingIntent: SaveIntent | null;
  isDeleting: boolean;
  onRequestDelete: () => void;
  disabled?: boolean;
};

export function ProductFormActions({
  fields,
  mode,
  savingIntent,
  isDeleting,
  onRequestDelete,
  disabled,
}: Props) {
  const isSaving = savingIntent !== null;
  const priceLabel = fields.price !== null ? `${fields.price} €` : "Sin precio";
  const stockLabel = fields.stock !== null ? `${fields.stock} en stock` : "Stock ilimitado";

  return (
    <div className="admin-sticky-actionbar shop-product-editor__actions">
      <span className="admin-sticky-actionbar__meta">
        {STATUS_LABELS[fields.status] ?? fields.status} · {priceLabel} · {stockLabel}
        {fields.gallery.length ? ` · ${fields.gallery.length} en galería` : ""}
      </span>
      {mode === "edit" ? (
        <button
          className="danger-btn"
          type="button"
          disabled={disabled || isSaving || isDeleting}
          onClick={onRequestDelete}
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            delete
          </span>
          {isDeleting ? "Eliminando..." : "Eliminar producto"}
        </button>
      ) : null}
      <button
        className="secondary-btn"
        type="submit"
        name="intent"
        value="draft"
        disabled={disabled || isSaving}
      >
        <span className="material-symbols-outlined" aria-hidden="true">
          save
        </span>
        {isSaving && savingIntent === "draft" ? "Guardando..." : "Borrador"}
      </button>
      <button
        className="primary-btn"
        type="submit"
        name="intent"
        value="publish"
        disabled={disabled || isSaving}
      >
        <span className="material-symbols-outlined" aria-hidden="true">
          publish
        </span>
        {isSaving && savingIntent === "publish" ? "Publicando..." : "Publicar producto"}
      </button>
    </div>
  );
}
