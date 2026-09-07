"use client";

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

  return (
    <div className="admin-sticky-actionbar">
      <span className="admin-sticky-actionbar__meta">{isDirty ? "Cambios sin guardar" : "Cambios al día"}</span>

      <div className="admin-offering-expiration">
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
      </div>

      <Button type="button" variant="outlined" onClick={() => setActiveTab("preview")}>
        Vista previa
      </Button>
      <Button type="submit" name="intent" value="draft" variant="outlined" disabled={isSaving} aria-busy={isSaving && savingIntent === "draft"}>
        {isSaving && savingIntent === "draft" ? "Guardando..." : "Borrador"}
      </Button>
      <Button type="submit" name="intent" value="publish" disabled={isSaving} aria-busy={isSaving && savingIntent === "publish"}>
        {isSaving && savingIntent === "publish" ? "Publicando..." : "Publicar"}
      </Button>
    </div>
  );
}