"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  isTeacher,
  patchTeacherAction,
  setTeacherEnabledAction,
  teacherActionSuccessMessage,
  teacherEnableSuccessMessage,
  teacherIsEnabled,
  type TeacherPatchAction,
} from "@/lib/admin/teacher-actions";
import type { Teacher, TeacherStatus } from "@/lib/cms/types";

type Notice = { type: "success" | "error" | "info"; title: string; message: string };

export type TeacherTrashDialogState = {
  teacher: Teacher;
  status: "confirm" | "loading" | "error";
  errorMessage?: string;
} | null;

export type TeachersTableSyncHandlers = {
  onTeacherUpdated?: (id: string, teacher: unknown, fallbackPatch?: Partial<Teacher>) => void;
  onTeacherRemoved?: (id: string) => void;
};

export function useTeachersTableActions(handlers: TeachersTableSyncHandlers = {}) {
  const router = useRouter();
  const { onTeacherUpdated, onTeacherRemoved } = handlers;

  const [notice, setNotice] = useState<Notice | null>(null);
  const [trashDialog, setTrashDialog] = useState<TeacherTrashDialogState>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => new Set());
  const [statusOverrides, setStatusOverrides] = useState<Record<string, TeacherStatus>>({});
  const [statusPendingId, setStatusPendingId] = useState<string | null>(null);

  const actionKey = useCallback((id: string, action: string) => `${id}:${action}`, []);

  const isPending = useCallback(
    (id: string, action?: string) => {
      if (!pendingKey) return false;
      return action ? pendingKey === actionKey(id, action) : pendingKey.startsWith(`${id}:`);
    },
    [actionKey, pendingKey],
  );

  const resolveStatus = useCallback(
    (teacher: Teacher): TeacherStatus => statusOverrides[teacher.id] ?? teacher.status,
    [statusOverrides],
  );

  const isEnabled = useCallback(
    (teacher: Teacher) => teacherIsEnabled({ status: resolveStatus(teacher) }),
    [resolveStatus],
  );

  const toggleEnabled = useCallback(
    async (teacher: Teacher, enabled: boolean) => {
      if (teacher.status === "archived" || statusPendingId) return;

      const previousStatus = resolveStatus(teacher);
      const optimisticStatus: TeacherStatus = enabled ? "published" : "draft";
      const fallbackPatch: Partial<Teacher> = { status: optimisticStatus };

      setNotice(null);
      setStatusPendingId(teacher.id);
      setStatusOverrides((current) => ({ ...current, [teacher.id]: optimisticStatus }));
      onTeacherUpdated?.(teacher.id, null, fallbackPatch);

      const result = await setTeacherEnabledAction(teacher.id, enabled);

      if (result.ok) {
        setStatusOverrides((current) => {
          const next = { ...current };
          delete next[teacher.id];
          return next;
        });
        onTeacherUpdated?.(teacher.id, result.teacher, fallbackPatch);
        setNotice({
          type: "success",
          title: "Estado actualizado",
          message: teacherEnableSuccessMessage(enabled),
        });
        router.refresh();
      } else {
        setStatusOverrides((current) => ({ ...current, [teacher.id]: previousStatus }));
        onTeacherUpdated?.(teacher.id, null, { status: previousStatus });
        setNotice({ type: "error", title: "No se pudo actualizar", message: result.error });
      }

      setStatusPendingId(null);
      return result;
    },
    [onTeacherUpdated, resolveStatus, router, statusPendingId],
  );

  const runAction = useCallback(
    async (id: string, action: TeacherPatchAction, options?: { optimisticHide?: boolean }) => {
      if (pendingKey || statusPendingId) return;

      setNotice(null);
      setPendingKey(actionKey(id, action));

      if (options?.optimisticHide) {
        setHiddenIds((current) => new Set(current).add(id));
        onTeacherRemoved?.(id);
      }

      const result = await patchTeacherAction(id, action);

      if (result.ok) {
        if (action === "trash") {
          onTeacherRemoved?.(id);
        } else if (action === "publish") {
          onTeacherUpdated?.(id, result.teacher, { status: "published" });
        } else if (action === "draft") {
          onTeacherUpdated?.(id, result.teacher, { status: "draft" });
        } else if (action === "archive") {
          onTeacherUpdated?.(id, result.teacher, { status: "archived" });
        } else if (isTeacher(result.teacher)) {
          onTeacherUpdated?.(id, result.teacher);
        }

        setNotice({
          type: "success",
          title: "Acción completada",
          message: teacherActionSuccessMessage(action),
        });
        router.refresh();
      } else if (options?.optimisticHide) {
        setHiddenIds((current) => {
          const next = new Set(current);
          next.delete(id);
          return next;
        });
        setNotice({ type: "error", title: "No se pudo completar", message: result.error });
      } else {
        setNotice({ type: "error", title: "No se pudo completar", message: result.error });
      }

      setPendingKey(null);
      return result;
    },
    [actionKey, onTeacherRemoved, onTeacherUpdated, pendingKey, router, statusPendingId],
  );

  const openTrashDialog = useCallback((teacher: Teacher) => {
    setTrashDialog({ teacher, status: "confirm" });
  }, []);

  const closeTrashDialog = useCallback(() => {
    setTrashDialog((current) => (current?.status === "loading" ? current : null));
  }, []);

  const confirmTrashDialog = useCallback(async () => {
    if (!trashDialog || trashDialog.status === "loading") return;

    const { teacher } = trashDialog;
    setTrashDialog({ teacher, status: "loading" });

    const result = await runAction(teacher.id, "trash", { optimisticHide: true });

    if (result?.ok) {
      setTrashDialog(null);
    } else {
      setTrashDialog({
        teacher,
        status: "error",
        errorMessage: result?.ok === false ? result.error : "No se pudo mover a la papelera.",
      });
    }
  }, [runAction, trashDialog]);

  const startEditNotice = useCallback(
    (id: string) => {
      setPendingKey(actionKey(id, "edit"));
      setNotice({ type: "info", title: "Abriendo edición", message: "Abriendo edición del especialista." });
      setPendingKey(null);
    },
    [actionKey],
  );

  const closeNotice = useCallback(() => setNotice(null), []);

  const filterVisibleItems = useCallback(
    (items: Teacher[]) => items.filter((item) => !hiddenIds.has(item.id)),
    [hiddenIds],
  );

  return {
    notice,
    closeNotice,
    trashDialog,
    openTrashDialog,
    closeTrashDialog,
    confirmTrashDialog,
    runAction,
    isPending,
    startEditNotice,
    filterVisibleItems,
    isBusy: Boolean(pendingKey || trashDialog?.status === "loading" || statusPendingId),
    resolveStatus,
    isEnabled,
    toggleEnabled,
    statusPendingId,
  };
}
