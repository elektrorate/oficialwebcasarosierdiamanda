"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CATEGORIES_ENDPOINT,
  PRODUCT_LIST_PATH,
  PRODUCTS_ENDPOINT,
} from "../constants";
import type {
  Product,
  ProductCategory,
  ProductFormFieldKey,
  ProductFormFields,
  ProductFormMode,
  ProductFormModal,
  SaveIntent,
} from "../types";
import {
  applyNameDerivedFields,
  buildProductPayload,
  fieldsFromProduct,
  uniqueGalleryUrls,
  validateProductForm,
} from "../utils";

export function useProductForm(mode: ProductFormMode, item?: Product) {
  const router = useRouter();
  const productId = item?.id;
  const syncKey = `${productId ?? "new"}:${item?.updated_at ?? "create"}`;
  const [previousSyncKey, setPreviousSyncKey] = useState(syncKey);
  const [fields, setFields] = useState<ProductFormFields>(() => fieldsFromProduct(item));
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingIntent, setSavingIntent] = useState<SaveIntent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [modal, setModal] = useState<ProductFormModal>(null);
  const saveInFlightRef = useRef(false);

  if (syncKey !== previousSyncKey) {
    setPreviousSyncKey(syncKey);
    setFields(fieldsFromProduct(item));
    setError(null);
  }

  useEffect(() => {
    const controller = new AbortController();

    fetch(CATEGORIES_ENDPOINT, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("No se pudieron cargar las categorías.");
        }
        return response.json();
      })
      .then((data) => {
        setCategories(Array.isArray(data.categories) ? data.categories : []);
        setCategoriesLoading(false);
      })
      .catch((fetchError: unknown) => {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
        setCategories([]);
        setCategoriesError("No se pudieron cargar las categorías de la tienda.");
        setCategoriesLoading(false);
      });

    return () => controller.abort();
  }, []);

  const updateField = useCallback(<K extends ProductFormFieldKey>(key: K, value: ProductFormFields[K]) => {
    setFields((current) => {
      if (key === "name" && typeof value === "string") {
        return applyNameDerivedFields(current, value);
      }
      return { ...current, [key]: value };
    });
  }, []);

  const addGalleryImages = useCallback((urls: string[]) => {
    setFields((current) => ({
      ...current,
      gallery: uniqueGalleryUrls(current.gallery, urls),
    }));
  }, []);

  const removeGalleryImage = useCallback((index: number) => {
    setFields((current) => ({
      ...current,
      gallery: current.gallery.filter((_, i) => i !== index),
    }));
  }, []);

  const moveGalleryImage = useCallback((from: number, to: number) => {
    setFields((current) => {
      if (to < 0 || to >= current.gallery.length || from === to) return current;
      const next = [...current.gallery];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return { ...current, gallery: next };
    });
  }, []);

  const save = useCallback(
    async (intent: SaveIntent) => {
      if (saveInFlightRef.current) return;
      saveInFlightRef.current = true;

      const nextStatus = intent === "publish" ? "published" : "draft";
      const details = validateProductForm(fields, intent);

      if (details.length) {
        setModal({
          type: "error",
          title: "No se pudo guardar",
          message: "Revisa estos campos antes de continuar.",
          details,
        });
        saveInFlightRef.current = false;
        return;
      }

      setSavingIntent(intent);
      setError(null);

      try {
        const endpoint = mode === "create" ? PRODUCTS_ENDPOINT : `${PRODUCTS_ENDPOINT}/${productId}`;
        const response = await fetch(endpoint, {
          method: mode === "create" ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify(buildProductPayload(fields, nextStatus)),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({ error: "Error" }));
          const message = (data as { error?: string }).error || "Error";
          setError(message);
          setModal({
            type: "error",
            title: "No se pudo guardar",
            message,
          });
          return;
        }

        setFields((current) => ({ ...current, status: nextStatus }));
        setModal({
          type: "success",
          title: intent === "publish" ? "Producto publicado" : "Borrador guardado",
          message:
            intent === "publish"
              ? "Los cambios del producto se guardaron correctamente."
              : "El producto se guardó como borrador correctamente.",
          redirectOnClose: true,
        });
      } catch {
        const message = "No se pudo conectar con el servidor. Intenta nuevamente.";
        setError(message);
        setModal({
          type: "error",
          title: "No se pudo guardar",
          message,
        });
      } finally {
        setSavingIntent(null);
        saveInFlightRef.current = false;
      }
    },
    [fields, mode, productId],
  );

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (saveInFlightRef.current) return;
      const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
      const intent: SaveIntent = submitter?.value === "publish" ? "publish" : "draft";
      void save(intent);
    },
    [save],
  );

  const requestDelete = useCallback(() => {
    if (!productId || saveInFlightRef.current) return;
    setDeleteConfirmOpen(true);
  }, [productId]);

  const closeDeleteConfirm = useCallback(() => {
    if (!isDeleting) setDeleteConfirmOpen(false);
  }, [isDeleting]);

  const trashProduct = useCallback(async () => {
    if (!productId || saveInFlightRef.current) return;
    saveInFlightRef.current = true;
    setDeleteConfirmOpen(false);
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`${PRODUCTS_ENDPOINT}/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ action: "trash" }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "No se pudo eliminar el producto." }));
        const message = (data as { error?: string }).error || "No se pudo eliminar el producto.";
        setError(message);
        setModal({ type: "error", title: "No se pudo eliminar", message });
        return;
      }

      setModal({
        type: "success",
        title: "Producto movido a la papelera",
        message: "Puedes restaurarlo desde la sección Papelera del CMS.",
        redirectOnClose: true,
      });
    } catch {
      const message = "No se pudo conectar con el servidor. Intenta nuevamente.";
      setError(message);
      setModal({ type: "error", title: "No se pudo eliminar", message });
    } finally {
      setIsDeleting(false);
      saveInFlightRef.current = false;
    }
  }, [productId]);

  const closeModal = useCallback(() => {
    const shouldRedirect = modal?.redirectOnClose;
    setModal(null);
    if (shouldRedirect) {
      router.push(PRODUCT_LIST_PATH);
      router.refresh();
    }
  }, [modal?.redirectOnClose, router]);

  return {
    fields,
    categories,
    categoriesLoading,
    categoriesError,
    error,
    savingIntent,
    isDeleting,
    deleteConfirmOpen,
    modal,
    isSaving: savingIntent !== null || isDeleting,
    updateField,
    addGalleryImages,
    removeGalleryImage,
    moveGalleryImage,
    save,
    handleSubmit,
    requestDelete,
    closeDeleteConfirm,
    trashProduct,
    closeModal,
  };
}
