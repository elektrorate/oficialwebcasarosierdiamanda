"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteOfferingPermanentlyAction,
  isOffering,
  offeringActionSuccessMessage,
  patchOfferingAction,
  setOfferingEnabledAction,
  type OfferingPatchAction,
} from "@/lib/admin/offering-actions";
import type { Offering, OfferingStatus } from "@/lib/cms/types";

type Notice = { type: "success" | "error"; title: string; message: string };

export type OfferingDeleteDialogState = {
  offering: Offering;
  mode: "trash" | "delete";
  status: "confirm" | "loading" | "error";
  errorMessage?: string;
} | null;

export function useOfferingTableActions(typeLabel: string) {
  const router = useRouter();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [seoWarnings, setSeoWarnings] = useState<string[]>([]);
  const [deleteDialog, setDeleteDialog] = useState<OfferingDeleteDialogState>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => new Set());
  const [localOfferings, setLocalOfferings] = useState<Offering[]>([]);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, OfferingStatus>>({});
  const [statusPendingId, setStatusPendingId] = useState<string | null>(null);
  const isBusy = Boolean(pendingId || statusPendingId);

  const mergeOffering = useCallback((offering: Offering) => {
    setLocalOfferings((current) => {
      const withoutCurrent = current.filter((item) => item.id !== offering.id);
      return [offering, ...withoutCurrent];
    });
  }, []);

  const runPatchAction = useCallback(
    async (id: string, action: OfferingPatchAction) => {
      const shouldHideOptimistically = action === "trash";
      setNotice(null);
      setPendingId(id);

      if (shouldHideOptimistically) {
        setHiddenIds((current) => new Set(current).add(id));
      }

      const result = await patchOfferingAction(id, action);

      if (result.ok) {
        setSeoWarnings(result.warnings ?? []);
        if (result.offering && isOffering(result.offering)) mergeOffering(result.offering);
        setNotice({
          type: "success",
          title: "Acción completada",
          message: offeringActionSuccessMessage(typeLabel, action),
        });
        router.refresh();
      } else if (shouldHideOptimistically) {
        setHiddenIds((current) => {
          const next = new Set(current);
          next.delete(id);
          return next;
        });
        setNotice({
          type: "error",
          title: "No se pudo completar",
          message: result.error || "No se pudo completar la acción.",
        });
      } else {
        setNotice({
          type: "error",
          title: "No se pudo completar",
          message: result.error || "No se pudo completar la acción.",
        });
      }

      setPendingId(null);
      return result;
    },
    [mergeOffering, router, typeLabel],
  );

  const openTrashDialog = useCallback((offering: Offering) => {
    setDeleteDialog({ offering, mode: "trash", status: "confirm" });
  }, []);

  const openPermanentDeleteDialog = useCallback((offering: Offering) => {
    setDeleteDialog({ offering, mode: "delete", status: "confirm" });
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialog((current) => (current?.status === "loading" ? current : null));
  }, []);

  const confirmDeleteDialog = useCallback(async () => {
    if (!deleteDialog || deleteDialog.status === "loading") return;

    const { offering, mode } = deleteDialog;
    setDeleteDialog({ offering, mode, status: "loading" });
    setPendingId(offering.id);
    setHiddenIds((current) => new Set(current).add(offering.id));

    const result =
      mode === "delete"
        ? await deleteOfferingPermanentlyAction(offering.id)
        : await patchOfferingAction(offering.id, "trash");

    if (result.ok) {
      if (result.offering && isOffering(result.offering)) mergeOffering(result.offering);
      setDeleteDialog(null);
      setNotice({
        type: "success",
        title: mode === "delete" ? "Eliminación completada" : "Acción completada",
        message: offeringActionSuccessMessage(typeLabel, mode === "delete" ? "delete" : "trash"),
      });
      router.refresh();
    } else {
      setHiddenIds((current) => {
        const next = new Set(current);
        next.delete(offering.id);
        return next;
      });
      setDeleteDialog({
        offering,
        mode,
        status: "error",
        errorMessage: result.error || "No se pudo completar la acción.",
      });
    }

    setPendingId(null);
  }, [deleteDialog, mergeOffering, router, typeLabel]);

  const toggleOfferingStatus = useCallback(
    async (offering: Offering, enabled: boolean) => {
      let previousStatus: OfferingStatus = offering.status;
      const optimisticStatus: OfferingStatus = enabled ? "published" : "draft";

      setNotice(null);
      setStatusPendingId(offering.id);
      setStatusOverrides((current) => {
        previousStatus = current[offering.id] ?? offering.status;
        return { ...current, [offering.id]: optimisticStatus };
      });

      const result = await setOfferingEnabledAction(offering.id, enabled);

      if (result.ok) {
        setSeoWarnings(result.warnings ?? []);
        if (result.offering && isOffering(result.offering)) mergeOffering(result.offering);
        setStatusOverrides((current) => {
          const next = { ...current };
          delete next[offering.id];
          return next;
        });
        setNotice({
          type: "success",
          title: "Estado actualizado",
          message: offeringActionSuccessMessage(typeLabel, enabled ? "toggle_on" : "toggle_off"),
        });
        router.refresh();
      } else {
        setStatusOverrides((current) => ({ ...current, [offering.id]: previousStatus }));
        setNotice({
          type: "error",
          title: "No se pudo actualizar",
          message: result.error || "No se pudo cambiar el estado del contenido.",
        });
      }

      setStatusPendingId(null);
      return result;
    },
    [mergeOffering, router, typeLabel],
  );

  const resolveOfferingStatus = useCallback(
    (offering: Offering) => statusOverrides[offering.id] ?? offering.status,
    [statusOverrides],
  );

  const visibleOfferings = useCallback(
    (offerings: Offering[]) => {
      const localIds = new Set(localOfferings.map((offering) => offering.id));
      return [...localOfferings, ...offerings.filter((offering) => !localIds.has(offering.id))];
    },
    [localOfferings],
  );

  return useMemo(
    () => ({
      seoWarnings,
      notice,
      setNotice,
      deleteDialog,
      pendingId,
      hiddenIds,
      statusPendingId,
      isBusy,
      runPatchAction,
      toggleOfferingStatus,
      resolveOfferingStatus,
      openTrashDialog,
      openPermanentDeleteDialog,
      closeDeleteDialog,
      confirmDeleteDialog,
      visibleOfferings,
    }),
    [
      closeDeleteDialog,
      confirmDeleteDialog,
      deleteDialog,
      hiddenIds,
      isBusy,
      notice,
      openPermanentDeleteDialog,
      seoWarnings,
      openTrashDialog,
      pendingId,
      statusPendingId,
      runPatchAction,
      toggleOfferingStatus,
      resolveOfferingStatus,
      visibleOfferings,
    ],
  );
}
