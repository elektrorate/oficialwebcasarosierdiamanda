"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import AdminActionModal from "@/components/admin/AdminActionModal";
import { SectionCard } from "@/components/admin/class-edit/components/SectionCard";
import Button from "@/components/ui/Button";
import {
  buildContactFormSubmitSavePayload,
  validateContactFormSubmitEditor,
  type FooterContactFormSubmitEditorState,
} from "@/components/admin/footer-editor/utils/contactFormUtils";
import { FOOTER_CONTACT_FORM_ADMIN_PATH } from "@/lib/cms/form-slug-guards";
import type { Form } from "@/lib/cms/types";

export default function FooterContactFormSubmitForm({ item }: { item: Form }) {
  const router = useRouter();
  const saveInFlightRef = useRef(false);
  const [title, setTitle] = useState(item.title ?? "");
  const [successMessage, setSuccessMessage] = useState(
    item.success_message ?? "Gracias, recibimos tu mensaje.",
  );
  const [redirectUrl, setRedirectUrl] = useState(item.redirect_url ?? "");
  const [emailNotify, setEmailNotify] = useState(item.email_notification_enabled ?? false);
  const [notificationEmail, setNotificationEmail] = useState(item.notification_email ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [modal, setModal] = useState<{ type: "success" | "error"; title: string; message?: string } | null>(
    null,
  );

  const editorState = useMemo<FooterContactFormSubmitEditorState>(
    () => ({ title, successMessage, redirectUrl, emailNotify, notificationEmail }),
    [emailNotify, notificationEmail, redirectUrl, successMessage, title],
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (saveInFlightRef.current) return;
      saveInFlightRef.current = true;
      setError(null);
      setModal(null);

      const validationError = validateContactFormSubmitEditor(editorState);
      if (validationError) {
        setError(validationError);
        setModal({ type: "error", title: "Revisa el formulario", message: validationError });
        saveInFlightRef.current = false;
        return;
      }

      setIsSaving(true);
      try {
        const res = await fetch(`/api/admin/formularios/${item.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildContactFormSubmitSavePayload(item, editorState)),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: "Error" }));
          const message = (data as { error?: string }).error || "No se pudo guardar.";
          setError(message);
          setModal({ type: "error", title: "No se pudo guardar", message });
          return;
        }
        setModal({
          type: "success",
          title: "Cambios guardados",
          message: "Envío y notificaciones del formulario del footer actualizados.",
        });
        router.refresh();
      } finally {
        setIsSaving(false);
        saveInFlightRef.current = false;
      }
    },
    [editorState, item, router],
  );

  return (
    <>
      <AdminActionModal
        open={Boolean(modal)}
        type={modal?.type}
        title={modal?.title ?? ""}
        message={modal?.message}
        confirmLabel="Entendido"
        onClose={() => setModal(null)}
      />

      <form className="editor-form cms-footer-contact-submit-form" onSubmit={handleSubmit}>
        <SectionCard
          title="Envío y notificaciones"
          description="Comportamiento al enviar el formulario del footer. Los campos visibles se editan en el editor del footer."
        >
          <div className="cms-footer-editor-fields grid gap-4 md:grid-cols-2">
            <label className="field md:col-span-2">
              <span>Asunto del mensaje (interno)</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <label className="field md:col-span-2">
              <span>Mensaje de éxito</span>
              <input value={successMessage} onChange={(event) => setSuccessMessage(event.target.value)} />
            </label>
            <label className="field md:col-span-2">
              <span>URL de redirección (opcional)</span>
              <input value={redirectUrl} onChange={(event) => setRedirectUrl(event.target.value)} />
            </label>
            <label className="field checkbox-field md:col-span-2">
              <input
                type="checkbox"
                checked={emailNotify}
                onChange={(event) => setEmailNotify(event.target.checked)}
              />
              <span>Enviar notificación por email al recibir un mensaje</span>
            </label>
            {emailNotify ? (
              <label className="field md:col-span-2">
                <span>Email de notificación</span>
                <input
                  type="email"
                  value={notificationEmail}
                  onChange={(event) => setNotificationEmail(event.target.value)}
                />
              </label>
            ) : null}
          </div>
        </SectionCard>

        {error ? <p className="form-error">{error}</p> : null}

        <div className="form-actions flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </Button>
          <Link href={FOOTER_CONTACT_FORM_ADMIN_PATH} className="text-primary text-body-md hover:underline">
            Editar campos en el footer
          </Link>
          <Link href="/admin/formularios" className="text-on-surface-variant text-body-md hover:underline">
            Volver a formularios
          </Link>
        </div>
      </form>
    </>
  );
}
