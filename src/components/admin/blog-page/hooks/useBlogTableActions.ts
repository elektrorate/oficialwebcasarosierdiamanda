"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  bitacoraActionSuccessMessage,
  bitacoraEnableSuccessMessage,
  bitacoraPostEnabled,
  patchBitacoraPostAction,
  setBitacoraPostEnabledAction,
  type BitacoraPatchAction,
} from "@/lib/admin/bitacora-actions";
import type { BlogPost, BlogPostStatus } from "@/lib/cms/types";
import { isBlogPost } from "../utils/previewPosts";

type Notice = { type: "success" | "error" | "info"; title: string; message: string };

export type BlogPostTrashDialogState = {
  post: BlogPost;
  status: "confirm" | "loading" | "error";
  errorMessage?: string;
} | null;

export type BlogTableSyncHandlers = {
  onPostUpdated?: (id: string, post: unknown, fallbackPatch?: Partial<BlogPost>) => void;
  onPostRemoved?: (id: string) => void;
};

export function useBlogTableActions(handlers: BlogTableSyncHandlers = {}) {
  const router = useRouter();
  const { onPostUpdated, onPostRemoved } = handlers;
  const [notice, setNotice] = useState<Notice | null>(null);
  const [trashDialog, setTrashDialog] = useState<BlogPostTrashDialogState>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => new Set());
  const [statusOverrides, setStatusOverrides] = useState<Record<string, BlogPostStatus>>({});
  const [statusPendingId, setStatusPendingId] = useState<string | null>(null);

  const actionKey = useCallback((id: string, action: string) => `${id}:${action}`, []);

  const isPending = useCallback(
    (id: string, action?: string) => {
      if (!pendingKey) return false;
      return action ? pendingKey === actionKey(id, action) : pendingKey.startsWith(`${id}:`);
    },
    [actionKey, pendingKey],
  );

  const resolvePostStatus = useCallback(
    (post: BlogPost): BlogPostStatus => statusOverrides[post.id] ?? post.status,
    [statusOverrides],
  );

  const isPostEnabled = useCallback(
    (post: BlogPost) => bitacoraPostEnabled({ status: resolvePostStatus(post) }),
    [resolvePostStatus],
  );

  const togglePostEnabled = useCallback(
    async (post: BlogPost, enabled: boolean) => {
      if (post.status === "archived" || statusPendingId) return;

      const previousStatus = resolvePostStatus(post);
      const optimisticStatus: BlogPostStatus = enabled ? "published" : "draft";
      const fallbackPatch: Partial<BlogPost> = enabled
        ? { status: "published", visible_in_listing: true, published_at: post.published_at || new Date().toISOString() }
        : { status: "draft", visible_in_listing: false };

      setNotice(null);
      setStatusPendingId(post.id);
      setStatusOverrides((current) => ({ ...current, [post.id]: optimisticStatus }));
      onPostUpdated?.(post.id, null, fallbackPatch);

      const result = await setBitacoraPostEnabledAction(post.id, enabled);

      if (result.ok) {
        setStatusOverrides((current) => {
          const next = { ...current };
          delete next[post.id];
          return next;
        });
        onPostUpdated?.(post.id, result.post, fallbackPatch);
        setNotice({
          type: "success",
          title: "Estado actualizado",
          message: bitacoraEnableSuccessMessage(enabled),
        });
        router.refresh();
      } else {
        setStatusOverrides((current) => ({ ...current, [post.id]: previousStatus }));
        onPostUpdated?.(post.id, null, {
          status: previousStatus,
          visible_in_listing: post.visible_in_listing,
        });
        setNotice({
          type: "error",
          title: "No se pudo actualizar",
          message: result.error,
        });
      }

      setStatusPendingId(null);
      return result;
    },
    [onPostUpdated, resolvePostStatus, router, statusPendingId],
  );

  const runAction = useCallback(
    async (id: string, action: BitacoraPatchAction, options?: { optimisticHide?: boolean }) => {
      if (pendingKey || statusPendingId) return;

      setNotice(null);
      setPendingKey(actionKey(id, action));

      if (options?.optimisticHide) {
        setHiddenIds((current) => new Set(current).add(id));
        onPostRemoved?.(id);
      }

      const result = await patchBitacoraPostAction(id, action);

      if (result.ok) {
        if (action === "trash") {
          onPostRemoved?.(id);
        } else if (action === "feature") {
          onPostUpdated?.(id, result.post, { is_featured: true });
        } else if (action === "unfeature") {
          onPostUpdated?.(id, result.post, { is_featured: false });
        } else if (action === "publish") {
          onPostUpdated?.(id, result.post, {
            status: "published",
            visible_in_listing: true,
          });
        } else if (action === "draft") {
          onPostUpdated?.(id, result.post, { status: "draft" });
        } else if (action === "archive") {
          onPostUpdated?.(id, result.post, { status: "archived" });
        } else if (isBlogPost(result.post)) {
          onPostUpdated?.(id, result.post);
        }

        setNotice({
          type: "success",
          title: "Acción completada",
          message: bitacoraActionSuccessMessage(action),
        });
        router.refresh();
      } else if (options?.optimisticHide) {
        setHiddenIds((current) => {
          const next = new Set(current);
          next.delete(id);
          return next;
        });
        setNotice({
          type: "error",
          title: "No se pudo completar",
          message: result.error,
        });
      } else {
        setNotice({
          type: "error",
          title: "No se pudo completar",
          message: result.error,
        });
      }

      setPendingKey(null);
      return result;
    },
    [actionKey, onPostRemoved, onPostUpdated, pendingKey, router, statusPendingId],
  );

  const openTrashDialog = useCallback((post: BlogPost) => {
    setTrashDialog({ post, status: "confirm" });
  }, []);

  const closeTrashDialog = useCallback(() => {
    setTrashDialog((current) => (current?.status === "loading" ? current : null));
  }, []);

  const confirmTrashDialog = useCallback(async () => {
    if (!trashDialog || trashDialog.status === "loading") return;

    const { post } = trashDialog;
    setTrashDialog({ post, status: "loading" });

    const result = await runAction(post.id, "trash", { optimisticHide: true });

    if (result?.ok) {
      setTrashDialog(null);
    } else {
      setTrashDialog({
        post,
        status: "error",
        errorMessage: result?.ok === false ? result.error : "No se pudo mover a la papelera.",
      });
    }
  }, [runAction, trashDialog]);

  const startEditNotice = useCallback(
    (id: string) => {
      setPendingKey(actionKey(id, "edit"));
      setNotice({ type: "info", title: "Abriendo edición", message: "Abriendo edición de la bitácora." });
      setPendingKey(null);
    },
    [actionKey],
  );

  const closeNotice = useCallback(() => setNotice(null), []);

  const filterVisibleItems = useCallback(
    (items: BlogPost[]) => items.filter((item) => !hiddenIds.has(item.id)),
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
    resolvePostStatus,
    isPostEnabled,
    togglePostEnabled,
    statusPendingId,
  };
}
