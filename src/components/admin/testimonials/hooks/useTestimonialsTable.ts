"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  actionSuccessMessage,
  computeTestimonialsStats,
  isTestimonial,
  orderedIdsKey,
  sortTestimonials,
} from "../utils";
import type {
  Testimonial,
  TestimonialsConfirmAction,
  TestimonialsNotice,
} from "../types";

export function useTestimonialsTable(items: Testimonial[]) {
  const [orderedItems, setOrderedItems] = useState<Testimonial[]>(() => sortTestimonials(items));
  const [baselineIds, setBaselineIds] = useState(() => orderedIdsKey(sortTestimonials(items)));
  const [notice, setNotice] = useState<TestimonialsNotice | null>(null);
  const [confirm, setConfirm] = useState<TestimonialsConfirmAction | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const actionInFlightRef = useRef(false);
  const orderInFlightRef = useRef(false);

  useEffect(() => {
    if (!notice || notice.type === "success") return;
    const timer = window.setTimeout(() => setNotice(null), 3800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const currentIds = orderedIdsKey(orderedItems);
  const hasOrderChanges = currentIds !== baselineIds;
  const stats = useMemo(() => computeTestimonialsStats(orderedItems), [orderedItems]);
  const isBusy = Boolean(pendingAction || isSavingOrder);

  function actionKey(id: string, action: string) {
    return `${id}:${action}`;
  }

  function moveItem(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= orderedItems.length || fromIndex === toIndex) return;
    setOrderedItems((current) => {
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next.map((item, index) => ({ ...item, sort_order: index }));
    });
  }

  async function saveOrder() {
    if (!hasOrderChanges || orderInFlightRef.current) return;
    orderInFlightRef.current = true;
    setNotice(null);
    setIsSavingOrder(true);
    try {
      const response = await fetch("/api/admin/components/testimonials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          action: "reorder",
          orderedIds: orderedItems.map((item) => item.id),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "No se pudo guardar el orden." }));
        setNotice({
          type: "error",
          title: "No se pudo completar",
          message: (data as { error?: string }).error || "No se pudo guardar el orden.",
        });
        return;
      }

      const data = (await response.json().catch(() => null)) as { testimonials?: unknown } | null;
      const saved = Array.isArray(data?.testimonials)
        ? data.testimonials.filter(isTestimonial)
        : orderedItems;

      const next = sortTestimonials(saved);
      setOrderedItems(next);
      setBaselineIds(orderedIdsKey(next));
      setNotice({
        type: "success",
        title: "Acción completada",
        message: actionSuccessMessage("reorder"),
      });
      // Avoid a second list fetch; local state already matches the API response.
    } catch {
      setNotice({
        type: "error",
        title: "No se pudo conectar",
        message: "No se pudo conectar con el servidor. Intenta nuevamente.",
      });
    } finally {
      setIsSavingOrder(false);
      orderInFlightRef.current = false;
    }
  }

  async function run(id: string, action: string) {
    if (actionInFlightRef.current || orderInFlightRef.current) return;
    actionInFlightRef.current = true;
    setNotice(null);
    setPendingAction(actionKey(id, action));
    setConfirm(null);

    const previous = orderedItems;
    if (action === "trash") {
      setOrderedItems((current) => current.filter((item) => item.id !== id));
    } else if (action === "publish" || action === "draft") {
      setOrderedItems((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                status: action === "publish" ? "published" : "draft",
                updated_at: new Date().toISOString(),
              }
            : item,
        ),
      );
    }

    try {
      const response = await fetch(`/api/admin/components/testimonials/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        setOrderedItems(previous);
        const data = await response.json().catch(() => ({ error: "No se pudo completar la acción." }));
        setNotice({
          type: "error",
          title: "No se pudo completar",
          message: (data as { error?: string }).error || "No se pudo completar la acción.",
        });
        return;
      }

      const data = (await response.json().catch(() => null)) as { testimonial?: unknown } | null;
      if (data?.testimonial && isTestimonial(data.testimonial) && action !== "trash") {
        const saved = data.testimonial;
        setOrderedItems((current) =>
          current.map((item) => (item.id === saved.id ? saved : item)),
        );
      }

      setNotice({
        type: "success",
        title: "Acción completada",
        message: actionSuccessMessage(action),
      });
    } catch {
      setOrderedItems(previous);
      setNotice({
        type: "error",
        title: "No se pudo conectar",
        message: "No se pudo conectar con el servidor. Intenta nuevamente.",
      });
    } finally {
      setPendingAction(null);
      actionInFlightRef.current = false;
    }
  }

  function requestTrash(item: Testimonial) {
    setConfirm({
      id: item.id,
      action: "trash",
      title: "Mover a papelera",
      message: `Se moverá “${item.name}” a la papelera. Puedes restaurarlo después desde Papelera.`,
      confirmLabel: "Mover a papelera",
    });
  }

  return {
    orderedItems,
    stats,
    notice,
    confirm,
    pendingAction,
    isSavingOrder,
    hasOrderChanges,
    isBusy,
    moveItem,
    saveOrder,
    run,
    requestTrash,
    closeNotice: () => setNotice(null),
    closeConfirm: () => setConfirm(null),
    confirmTrash: () => {
      if (confirm) void run(confirm.id, confirm.action);
    },
  };
}
