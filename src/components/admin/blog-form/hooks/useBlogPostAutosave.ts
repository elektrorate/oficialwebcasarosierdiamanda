"use client";

import { useCallback, useMemo } from "react";
import { saveBlogPostAction } from "@/lib/admin/bitacora-actions";
import type { BlogPostStatus } from "@/lib/cms/types";
import { useQueuedAutosave, type AutosaveSyncStatus } from "../../blog-page/hooks/useQueuedAutosave";
import { buildBlogPostSavePayload, type BlogPostFormFields } from "../utils/blogPostPayload";

export type BlogPostSyncStatus = AutosaveSyncStatus;

const AUTOSAVE_DELAY_MS = 800;

export function useBlogPostAutosave(
  mode: "create" | "edit",
  postId: string | undefined,
  fields: BlogPostFormFields,
  status: BlogPostStatus,
  enabled: boolean,
) {
  const payload = useMemo(() => buildBlogPostSavePayload(fields, status), [fields, status]);
  const save = useCallback(
    (nextPayload: Record<string, unknown>) => saveBlogPostAction("edit", postId, nextPayload),
    [postId],
  );

  return useQueuedAutosave({
    payload,
    enabled: enabled && mode === "edit" && Boolean(postId) && Boolean(fields.title.trim()),
    delayMs: AUTOSAVE_DELAY_MS,
    save,
  });
}
