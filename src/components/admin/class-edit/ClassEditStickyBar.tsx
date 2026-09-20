"use client";

import { useEffect, useId, useState } from "react";
import Button from "@/components/ui/Button";
import { formatExpirationSummary, fromLocalDateTime } from "@/lib/cms/offering-expiration";
import type { Offering } from "@/lib/cms/types";
import type { ClassEditFormState } from "./hooks/useClassEditForm";

export function ClassEditStickyBar({
  form,
  offering,
}: {
  form: ClassEditFormState;
  offering?: Pick<Offering, "expires_at" | "expired_at"> | null;
}) {
  const [expirationOpen, setExpirationOpen] = useState(false);
  const expirationTitleId = useId();
  const { isDirty, isSaving, savingIntent, setActiveTab, errors } = form;

  const expiresAt = fromLocalDateTime(form.expirationDate, form.expirationTime, offering?.expires_at ?? null);
  const summary =
    form.expirationEnabled && expiresAt
      ? formatExpirationSummary({
          expiration_enabled: true,
          expires_at: expiresAt,
          expired_at: offering?.expired_at ?? null,
        })
      : null;
  const error = errors.expirationDate;

  useEffect(() => {
    if (!expirationOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setExpirationOpen(false);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [expirationOpen]);

  return (
    <div className="admin-sticky-actionbar">
      <span className="admin-sticky-actionbar__meta">{isDirty ? "Cambios sin guardar" : "Cambios al día"}</span>

      <button
        type="button"
        className={`admin-offering-expiration-trigger${form.expirationEnabled ? " is-active" : ""}`}
        aria-label={form.expirationEnabled ? "Editar caducidad activa" : "Programar caducidad"}
        aria-haspopup="dialog"
        aria-expanded={expirationOpen}
        aria-controls="admin-offering-expiration-dialog"
        onClick={() => setExpirationOpen(true)}
      >
        <span className="material-symbols-outlined" aria-hidden="true">event</span>
        <span className="admin-offering-expiration-trigger__label">
          {form.expirationEnabled ? "Caducidad activa" : "Caducidad"}
        </span>
      </button>

      {expirationOpen ? (
        <button
          type="button"
          className="admin-offering-expiration-backdrop"
          aria-label="Cerrar programación de caducidad"
          onClick={() => setExpirationOpen(false)}
        />
      ) : null}

      <div
        id="admin-offering-expiration-dialog"
        className={`admin-offering-expiration${expirationOpen ? " is-open" : ""}`}
        role={expirationOpen ? "dialog" : undefined}
        aria-modal={expirationOpen ? "true" : undefined}
        aria-labelledby={expirationOpen ? expirationTitleId : undefined}
      >
        <div className="admin-offering-expiration__head">
          <strong id={expirationTitleId}>Programar caducidad</strong>
          <button
            type="button"
            className="admin-offering-expiration__close"
            aria-label="Cerrar"
            onClick={() => setExpirationOpen(false)}
          >
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        <label className="admin-offering-expiration__toggle">
          <input
            type="checkbox"
            checked={form.expirationEnabled}
            onChange={(event) => form.setExpirationEnabled(event.target.checked)}
          />
          <span>Programar caducidad</span>
        </label>

        <div className="admin-offering-expiration__fields">
          <label className="admin-offering-expiration__field">
            <span>Fecha de finalización</span>
            <input
              type="date"
              value={form.expirationDate}
              disabled={!form.expirationEnabled}
              onChange={(event) => form.setExpirationDate(event.target.value)}
            />
          </label>
          <label className="admin-offering-expiration__field">
            <span>Hora (madr.)</span>
            <input
              type="time"
              value={form.expirationTime ? form.expirationTime.replace(/^(\d)$/, "0$1") : ""}
              disabled={!form.expirationEnabled}
              onChange={(event) => form.setExpirationTime(event.target.value)}
            />
          </label>
        </div>

        {error ? (
          <span className="admin-offering-expiration__error">{error}</span>
        ) : summary ? (
          <span className="admin-offering-expiration__summary">{summary}</span>
        ) : null}

        <Button type="button" variant="outlined" className="admin-offering-expiration__done" onClick={() => setExpirationOpen(false)}>
          Listo
        </Button>
      </div>

      <Button type="button" variant="outlined" className="admin-offering-sticky-action" onClick={() => setActiveTab("preview")}>
        Vista previa
      </Button>
      <Button type="submit" name="intent" value="draft" variant="outlined" className="admin-offering-sticky-action" disabled={isSaving} aria-busy={isSaving && savingIntent === "draft"}>
        {isSaving && savingIntent === "draft" ? "Guardando..." : "Borrador"}
      </Button>
      <Button type="submit" name="intent" value="publish" className="admin-offering-sticky-action" disabled={isSaving} aria-busy={isSaving && savingIntent === "publish"}>
        {isSaving && savingIntent === "publish" ? "Publicando..." : "Publicar"}
      </Button>
    </div>
  );
}
