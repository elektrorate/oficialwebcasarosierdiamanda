"use client";

import { useCallback } from "react";
import { saveBlogPageSettingsAction, type BlogPageSavePayload } from "@/lib/admin/blog-page-actions";
import { useQueuedAutosave, type AutosaveSyncStatus } from "./useQueuedAutosave";

export type BlogPageSyncStatus = AutosaveSyncStatus;

const AUTOSAVE_DELAY_MS = 750;

export function useBlogPageAutosave(payload: BlogPageSavePayload, enabled = true) {
  const save = useCallback(
    (nextPayload: BlogPageSavePayload) => saveBlogPageSettingsAction(nextPayload),
    [],
  );

  return useQueuedAutosave({ payload, enabled, delayMs: AUTOSAVE_DELAY_MS, save });
}
