"use client";

import { useCallback, useMemo } from "react";
import type { ClassEditFormState } from "./useClassEditForm";

export function useCalendarSectionHandlers(form: ClassEditFormState) {
  const {
    details,
    errors,
    addCalendarLabel,
    updateCalendarLabel,
    toggleCalendarDay,
    removeCalendarLabel,
    moveCalendarLabel,
    updateDetails,
  } = form;

  const setShowCalendarLabels = useCallback(
    (showCalendarLabels: boolean) => updateDetails({ showCalendarLabels }),
    [updateDetails],
  );

  const setCalendarLabelsTitle = useCallback(
    (calendarLabelsTitle: string) => updateDetails({ calendarLabelsTitle }),
    [updateDetails],
  );

  const setCalendarLabelsDescription = useCallback(
    (calendarLabelsDescription: string) => updateDetails({ calendarLabelsDescription }),
    [updateDetails],
  );

  return useMemo(
    () => ({
      details,
      errors,
      addCalendarLabel,
      updateCalendarLabel,
      toggleCalendarDay,
      removeCalendarLabel,
      moveCalendarLabel,
      setShowCalendarLabels,
      setCalendarLabelsTitle,
      setCalendarLabelsDescription,
      updateDetails,
    }),
    [
      addCalendarLabel,
      details,
      errors,
      moveCalendarLabel,
      removeCalendarLabel,
      setCalendarLabelsDescription,
      setCalendarLabelsTitle,
      setShowCalendarLabels,
      toggleCalendarDay,
      updateCalendarLabel,
      updateDetails,
    ],
  );
}
