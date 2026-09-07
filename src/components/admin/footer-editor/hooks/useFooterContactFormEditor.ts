"use client";

import { useCallback, useMemo, useState } from "react";
import type { Form, FormField } from "@/lib/cms/types";
import {
  buildContactFormFieldsSavePayload,
  contactFormPreviewFromFields,
  validateContactFormFieldsEditor,
} from "../utils/contactFormUtils";

export function useFooterContactFormEditor(initialForm: Form) {
  const syncKey = `${initialForm.id}:${initialForm.updated_at ?? ""}`;
  const [previousSyncKey, setPreviousSyncKey] = useState(syncKey);
  const [fields, setFields] = useState<FormField[]>(initialForm.fields ?? []);

  if (syncKey !== previousSyncKey) {
    setPreviousSyncKey(syncKey);
    setFields(initialForm.fields ?? []);
  }

  const previewForm = useMemo(
    () => contactFormPreviewFromFields(initialForm, fields),
    [fields, initialForm],
  );

  const addField = useCallback(() => {
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `tmp_${Date.now()}`;
    setFields((current) => [
      ...current,
      {
        id,
        label: "",
        name: "",
        type: "text",
        placeholder: "",
        required: false,
        options: [],
        default_value: "",
        sort_order: current.length,
        is_visible: true,
      },
    ]);
  }, []);

  const updateField = useCallback((index: number, key: keyof FormField, value: unknown) => {
    setFields((current) => {
      const copy = [...current];
      copy[index] = { ...copy[index], [key]: value } as FormField;
      return copy;
    });
  }, []);

  const removeField = useCallback((index: number) => {
    setFields((current) => current.filter((_, i) => i !== index));
  }, []);

  const moveField = useCallback((index: number, direction: "up" | "down") => {
    setFields((current) => {
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= current.length) return current;
      const copy = [...current];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  }, []);

  const buildSavePayload = useCallback(
    () => buildContactFormFieldsSavePayload(initialForm, fields),
    [fields, initialForm],
  );

  const validate = useCallback(() => validateContactFormFieldsEditor(fields), [fields]);

  const applySavedForm = useCallback((saved: Form) => {
    setFields(saved.fields ?? []);
  }, []);

  return {
    formId: initialForm.id,
    formSlug: initialForm.slug,
    fields,
    previewForm,
    addField,
    updateField,
    removeField,
    moveField,
    buildSavePayload,
    validate,
    applySavedForm,
  };
}

export type FooterContactFormEditor = ReturnType<typeof useFooterContactFormEditor>;
