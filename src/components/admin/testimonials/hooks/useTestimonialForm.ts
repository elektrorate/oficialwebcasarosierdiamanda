"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { TESTIMONIALS_LIST_PATH } from "../constants";
import type { TestimonialFieldKey } from "../formFields";
import {
  applySavedTestimonial,
  buildTestimonialPayload,
  fieldsFromTestimonial,
  isTestimonial,
  validateTestimonialForm,
} from "../utils";
import type {
  Testimonial,
  TestimonialFormErrors,
  TestimonialFormFields,
  TestimonialFormMode,
  TestimonialsNotice,
  TestimonialStatus,
} from "../types";

export function useTestimonialForm(mode: TestimonialFormMode, item?: Testimonial) {
  const router = useRouter();
  const [fields, setFields] = useState<TestimonialFormFields>(() => fieldsFromTestimonial(item));
  const [errors, setErrors] = useState<TestimonialFormErrors>({});
  const [notice, setNotice] = useState<TestimonialsNotice | null>(null);
  const [savingStatus, setSavingStatus] = useState<TestimonialStatus | null>(null);
  const [returnAfterNotice, setReturnAfterNotice] = useState(false);
  const saveInFlightRef = useRef(false);

  useEffect(() => {
    if (!notice || notice.type === "success") return;
    const timer = window.setTimeout(() => setNotice(null), 4200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const updateField = useCallback(
    <K extends TestimonialFieldKey>(key: K, value: TestimonialFormFields[K]) => {
      setFields((current) => ({ ...current, [key]: value }));
      setErrors((current) => {
        if (!current[key]) return current;
        const next = { ...current };
        delete next[key];
        return next;
      });
    },
    [],
  );

  const save = useCallback(
    async (nextStatus: "draft" | "published") => {
      if (saveInFlightRef.current) return;
      saveInFlightRef.current = true;
      setSavingStatus(nextStatus);
      setNotice(null);

      const validation = validateTestimonialForm(fields);
      if (validation.message) {
        setErrors(validation.errors);
        setNotice({
          type: "error",
          title: "Revisa el testimonio",
          message: validation.message,
        });
        setSavingStatus(null);
        saveInFlightRef.current = false;
        return;
      }

      setErrors({});

      try {
        const endpoint =
          mode === "create"
            ? "/api/admin/components/testimonials"
            : `/api/admin/components/testimonials/${item?.id}`;

        const res = await fetch(endpoint, {
          method: mode === "create" ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify(buildTestimonialPayload(fields, nextStatus)),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: "No se pudo guardar el testimonio." }));
          setNotice({
            type: "error",
            title: "No se pudo completar",
            message: (data as { error?: string }).error || "No se pudo guardar el testimonio.",
          });
          return;
        }

        const data = (await res.json().catch(() => null)) as { testimonial?: unknown } | null;
        if (data?.testimonial && isTestimonial(data.testimonial)) {
          setFields(applySavedTestimonial(data.testimonial));
        }

        setNotice({
          type: "success",
          title: "Acción completada",
          message:
            nextStatus === "published"
              ? "Publicado exitosamente."
              : "Borrador guardado correctamente.",
        });

        if (mode === "create") {
          setReturnAfterNotice(true);
        }
      } catch {
        setNotice({
          type: "error",
          title: "No se pudo conectar",
          message: "No se pudo conectar con el servidor. Intenta nuevamente.",
        });
      } finally {
        setSavingStatus(null);
        saveInFlightRef.current = false;
      }
    },
    [fields, item, mode],
  );

  const handleSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      void save("draft");
    },
    [save],
  );

  const closeNotice = useCallback(() => {
    const shouldReturn = returnAfterNotice;
    setNotice(null);
    setReturnAfterNotice(false);
    if (shouldReturn) {
      router.push(TESTIMONIALS_LIST_PATH);
    }
  }, [returnAfterNotice, router]);

  return {
    fields,
    errors,
    notice,
    savingStatus,
    updateField,
    save,
    handleSubmit,
    closeNotice,
    isSaving: savingStatus !== null,
  };
}
