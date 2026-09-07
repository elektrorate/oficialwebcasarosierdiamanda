"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import {
  isTeacher,
  saveTeacherAction,
  teacherActionSuccessMessage,
} from "@/lib/admin/teacher-actions";
import type {
  Teacher,
  TeacherFormErrors,
  TeacherFormFields,
  TeacherFormMode,
  TeacherFormNotice,
  TeacherStatus,
} from "../types";
import { buildTeacherPayload, fieldsFromTeacher, validateTeacherForm } from "../utils";

export function useTeacherForm(mode: TeacherFormMode, item: Teacher | undefined, basePath: string) {
  const router = useRouter();
  const [fields, setFields] = useState<TeacherFormFields>(() => fieldsFromTeacher(item));
  const [errors, setErrors] = useState<TeacherFormErrors>({});
  const [notice, setNotice] = useState<TeacherFormNotice>(null);
  const [savingStatus, setSavingStatus] = useState<TeacherStatus | null>(null);
  const [returnAfterNotice, setReturnAfterNotice] = useState(false);
  const saveInFlight = useRef(false);

  const updateField = useCallback(
    <K extends keyof TeacherFormFields>(key: K, value: TeacherFormFields[K]) => {
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
    async (nextStatus: TeacherStatus = fields.status) => {
      if (saveInFlight.current) return;
      saveInFlight.current = true;
      setSavingStatus(nextStatus);
      setNotice(null);

      const validation = validateTeacherForm(fields);
      if (validation.message) {
        setErrors(validation.errors);
        setNotice({ type: "error", title: "Revisa el formulario", message: validation.message });
        setSavingStatus(null);
        saveInFlight.current = false;
        return;
      }

      setErrors({});
      const status = nextStatus === "deleted" ? "draft" : nextStatus;
      const result = await saveTeacherAction(mode, item?.id, buildTeacherPayload(fields, status));

      if (!result.ok) {
        setNotice({ type: "error", title: "No se pudo guardar", message: result.error });
        setSavingStatus(null);
        saveInFlight.current = false;
        return;
      }

      if (result.teacher && isTeacher(result.teacher)) {
        setFields(fieldsFromTeacher(result.teacher));
      }

      setNotice({
        type: "success",
        title: mode === "create" ? "Especialista creado" : "Cambios guardados",
        message:
          status === "published"
            ? teacherActionSuccessMessage("publish")
            : status === "archived"
              ? teacherActionSuccessMessage("archive")
              : teacherActionSuccessMessage("draft"),
      });
      setReturnAfterNotice(true);
      setSavingStatus(null);
      saveInFlight.current = false;
      router.refresh();
    },
    [fields, item?.id, mode, router],
  );

  const handleSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      void save(fields.status === "published" ? "published" : "draft");
    },
    [fields.status, save],
  );

  const closeNotice = useCallback(() => {
    const shouldReturn = returnAfterNotice;
    setNotice(null);
    setReturnAfterNotice(false);
    if (shouldReturn) {
      router.push(basePath);
      router.refresh();
    }
  }, [basePath, returnAfterNotice, router]);

  return {
    fields,
    errors,
    notice,
    savingStatus,
    isSaving: savingStatus !== null,
    updateField,
    save,
    saveDraft: () => void save("draft"),
    savePublished: () => void save("published"),
    handleSubmit,
    closeNotice,
  };
}
