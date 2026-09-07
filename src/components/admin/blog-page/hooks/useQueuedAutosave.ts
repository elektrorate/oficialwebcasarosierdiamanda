"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type AutosaveSyncStatus = "idle" | "pending" | "saving" | "saved" | "error";

type AutosaveResult = { ok: true } | { ok: false; error: string };

type AutosaveRequest<TPayload> = {
  payload: TPayload;
  signature: string;
  save: (payload: TPayload) => Promise<AutosaveResult>;
};

type UseQueuedAutosaveOptions<TPayload> = {
  payload: TPayload;
  enabled: boolean;
  delayMs: number;
  save: (payload: TPayload) => Promise<AutosaveResult>;
};

/**
 * Debounces edits and serializes writes so an older response can never
 * overwrite a newer change. Manual saves can pause and drain the queue.
 */
export function useQueuedAutosave<TPayload>({
  payload,
  enabled,
  delayMs,
  save,
}: UseQueuedAutosaveOptions<TPayload>) {
  const signature = useMemo(() => JSON.stringify(payload), [payload]);
  const [syncStatus, setSyncStatus] = useState<AutosaveSyncStatus>("idle");
  const [syncError, setSyncError] = useState<string | null>(null);
  const mountedRef = useRef(false);
  const pausedRef = useRef(false);
  const pendingStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queuedRequestRef = useRef<AutosaveRequest<TPayload> | null>(null);
  const inFlightRef = useRef<Promise<void> | null>(null);
  const lastSavedSignatureRef = useRef(signature);
  const latestScheduledSignatureRef = useRef(signature);

  const clearScheduledTimers = useCallback(() => {
    if (pendingStatusTimerRef.current) clearTimeout(pendingStatusTimerRef.current);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    pendingStatusTimerRef.current = null;
    saveTimerRef.current = null;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearScheduledTimers();
      queuedRequestRef.current = null;
    };
  }, [clearScheduledTimers]);

  const drainQueue = useCallback(async (firstRequest: AutosaveRequest<TPayload>) => {
    let currentRequest: AutosaveRequest<TPayload> | null = firstRequest;

    while (currentRequest) {
      if (mountedRef.current) {
        setSyncStatus("saving");
        setSyncError(null);
      }

      const result = await currentRequest.save(currentRequest.payload);
      const isLatest = latestScheduledSignatureRef.current === currentRequest.signature;

      if (result.ok) {
        lastSavedSignatureRef.current = currentRequest.signature;
        if (mountedRef.current && isLatest) {
          setSyncStatus("saved");
          setSyncError(null);
        }
      } else if (mountedRef.current && isLatest) {
        setSyncStatus("error");
        setSyncError(result.error);
      }

      currentRequest = pausedRef.current ? null : queuedRequestRef.current;
      queuedRequestRef.current = null;
    }

    inFlightRef.current = null;
  }, []);

  const enqueue = useCallback(
    (request: AutosaveRequest<TPayload>) => {
      if (pausedRef.current) return;

      if (inFlightRef.current) {
        queuedRequestRef.current = request;
        return;
      }

      const inFlight = drainQueue(request);
      inFlightRef.current = inFlight;
    },
    [drainQueue],
  );

  useEffect(() => {
    clearScheduledTimers();
    latestScheduledSignatureRef.current = signature;

    if (
      !enabled ||
      pausedRef.current ||
      (signature === lastSavedSignatureRef.current && !inFlightRef.current)
    ) return;

    const request = { payload, signature, save };

    pendingStatusTimerRef.current = setTimeout(() => {
      if (!mountedRef.current || pausedRef.current) return;
      setSyncStatus("pending");
      setSyncError(null);
    }, 0);

    saveTimerRef.current = setTimeout(() => {
      pendingStatusTimerRef.current = null;
      saveTimerRef.current = null;
      enqueue(request);
    }, delayMs);

    return clearScheduledTimers;
  }, [clearScheduledTimers, delayMs, enabled, enqueue, payload, save, signature]);

  const prepareForManualSave = useCallback(async () => {
    pausedRef.current = true;
    clearScheduledTimers();
    queuedRequestRef.current = null;
    latestScheduledSignatureRef.current = lastSavedSignatureRef.current;
    await inFlightRef.current;
  }, [clearScheduledTimers]);

  const completeManualSave = useCallback((savedPayload?: TPayload) => {
    if (savedPayload !== undefined) {
      const savedSignature = JSON.stringify(savedPayload);
      lastSavedSignatureRef.current = savedSignature;
      latestScheduledSignatureRef.current = savedSignature;
      if (mountedRef.current) {
        setSyncStatus("saved");
        setSyncError(null);
      }
    }
    pausedRef.current = false;
  }, []);

  return { syncStatus, syncError, prepareForManualSave, completeManualSave };
}
