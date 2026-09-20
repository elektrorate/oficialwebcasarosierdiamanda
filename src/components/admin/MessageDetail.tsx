"use client";

import AdminActionModal from "./AdminActionModal";
import Link from "@/components/admin/AdminLink";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormSubmission } from "@/lib/cms/types";
import { formatAdminDateTime } from "@/lib/admin/date-format";

const stLabels: Record<string, string> = { new: "Nuevo", read: "Leído", replied: "Respondido", archived: "Archivado", spam: "Spam", deleted: "Eliminado" };
type ModalState = {
  type: "success" | "error" | "confirm";
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm?: () => void;
} | null;

export default function MessageDetail({ item }: { item: FormSubmission }) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalState>(null);
  const [pending, setPending] = useState(false);
  const [localStatus, setLocalStatus] = useState(item.status);

  async function run(action: string, extra?: Record<string, string>) {
    const previousStatus = localStatus;
    if (action === "status" && extra?.status) {
      setLocalStatus(extra.status as FormSubmission["status"]);
    }
    setPending(true);
    const response = await fetch(`/api/admin/mensajes/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...extra }) });
    const data = await response.json().catch(() => ({})) as { error?: string };
    setPending(false);
    if (!response.ok) {
      setLocalStatus(previousStatus);
      setModal({ type: "error", title: "No se pudo actualizar", message: data.error || "No se pudo actualizar el mensaje." });
      return;
    }
    if (action !== "status" || extra?.status !== "read") {
      setModal({ type: "success", title: "Acción completada", message: action === "trash" ? "Mensaje enviado a la papelera correctamente." : "Mensaje actualizado correctamente." });
    }
    if (action === "trash") {
      setTimeout(() => {
        router.push("/admin/mensajes");
        router.refresh();
      }, 350);
      return;
    }
    router.refresh();
  }

  function requestTrash() {
    setModal({
      type: "confirm",
      title: "Enviar a papelera",
      message: `Se moverá el mensaje de ${item.name || item.email || "este contacto"} a la papelera.`,
      confirmLabel: "Papelera",
      onConfirm: () => void run("trash"),
    });
  }

  return (
    <div className="page-card">
      <AdminActionModal
        open={Boolean(modal)}
        type={modal?.type ?? "info"}
        title={modal?.title ?? ""}
        message={modal?.message}
        confirmLabel={modal?.confirmLabel ?? "Entendido"}
        cancelLabel="Cancelar"
        onConfirm={modal?.onConfirm}
        onClose={() => setModal(null)}
      />
      <div className="page-header"><h2>{item.subject || "Mensaje sin asunto"}</h2><Link className="secondary-btn" href="/admin/mensajes">Volver</Link></div>
      <div className="header-form-layout">
        <div className="menu-form-main">
          <div className="form-block">
            <h3>Cliente</h3>
            <div className="grid-2">
              <div><p className="auth-kicker">Nombre</p><p style={{ fontWeight: 500 }}>{item.name}</p></div>
              <div><p className="auth-kicker">Email</p><p><a href={`mailto:${item.email}`}>{item.email}</a></p></div>
              {item.phone ? <div><p className="auth-kicker">Teléfono</p><p>{item.phone}</p></div> : null}
              <div><p className="auth-kicker">Formulario</p><p>{item.form_name} ({item.form_slug})</p></div>
              {item.source_page ? <div><p className="auth-kicker">Página de origen</p><p className="muted">{item.source_page}</p></div> : null}
              <div><p className="auth-kicker">Recibido</p><p>{formatAdminDateTime(item.created_at)}</p></div>
              <div><p className="auth-kicker">Estado</p><p><span className="entity-badge">{stLabels[item.status]}</span></p></div>
            </div>
          </div>

          {item.message ? <div className="form-block"><h3>Mensaje</h3><div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{item.message}</div></div> : null}

          {Object.keys(item.data).length > 0 ? (
            <div className="form-block"><h3>Datos adicionales</h3><table className="admin-table"><tbody>{Object.entries(item.data).filter(([k]) => !["__notification","name","email","phone","subject","message","source_page"].includes(k)).map(([k, v]) => (<tr key={k}><td style={{ fontWeight: 500, width: "30%" }}>{k}</td><td>{String(v)}</td></tr>))}</tbody></table></div>
          ) : null}

          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.5rem" }}>
            {localStatus !== "read" ? (
              <button className="secondary-btn" disabled={pending} onClick={() => run("status", { status: "read" })}>Marcar como leído</button>
            ) : null}
            {item.phone ? <a className="secondary-btn message-call-btn" href={`tel:${item.phone}`}>Llamar</a> : null}
            <button className="danger-btn" disabled={pending} onClick={requestTrash}>{pending ? "Enviando..." : "Papelera"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
