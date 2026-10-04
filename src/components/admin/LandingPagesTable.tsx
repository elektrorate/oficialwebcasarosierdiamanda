"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SeoServerWarnings } from "./SeoReview";
import { getActionWarnings } from "@/lib/admin/action-warnings";
import type { LandingPage } from "@/lib/cms/types";
import { formatAdminDateTime } from "@/lib/admin/date-format";

const campLabels: Record<string, string> = {
  course: "Curso", workshop: "Workshop", experience: "Experiencia",
  gift_card: "Gift Card", event: "Evento", lead_capture: "Lead Capture", custom: "Custom",
};

export default function LandingPagesTable({ items }: { items: LandingPage[] }) {
  const router = useRouter();
  const [seoWarnings, setSeoWarnings] = useState<string[]>([]);
  async function run(id: string, action: string) { const r = await fetch(`/api/admin/landing-pages/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) }); if (r.ok) { const data = await r.json().catch(() => ({})) as { warnings?: string[] }; setSeoWarnings(getActionWarnings(data.warnings)); router.refresh(); } }
  return (<><SeoServerWarnings warnings={seoWarnings} /><div className="table-card"><table className="admin-table"><thead><tr><th>Título</th><th>Campaña</th><th>Estado</th><th>Bloques</th><th>Slug</th><th>Actualizado</th><th>Acciones</th></tr></thead><tbody>{items.map((i) => (<tr key={i.id}><td><strong>{i.title}</strong></td><td><span className="entity-badge">{campLabels[i.campaign_type]}</span></td><td>{i.status}</td><td>{i.blocks.length}</td><td>/{i.slug}</td><td>{formatAdminDateTime(i.updated_at)}</td><td><div className="row-actions"><a className="link-btn" href={`/admin/landing-pages/${i.id}/edit`}>Editar</a><button className="secondary-btn" onClick={() => run(i.id, "duplicate")}>Duplicar</button>{i.status === "published" ? <button className="secondary-btn" onClick={() => run(i.id, "draft")}>Borrador</button> : <button className="secondary-btn" onClick={() => run(i.id, "publish")}>Publicar</button>}<button className="danger-btn" onClick={() => run(i.id, "trash")}>Papelera</button></div></td></tr>))}</tbody></table></div></>);
}
