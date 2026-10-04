"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SeoServerWarnings } from "./SeoReview";
import { getActionWarnings } from "@/lib/admin/action-warnings";
import Link from "@/components/admin/AdminLink";
import type { Offering, OfferingStatus } from "@/lib/cms/types";
import { formatAdminDate } from "@/lib/admin/date-format";

const statusBadge: Record<OfferingStatus, { label: string; variant: string }> = {
  draft: { label: "Borrador", variant: "warning" },
  published: { label: "Publicado", variant: "success" },
  archived: { label: "Archivado", variant: "neutral" },
  deleted: { label: "Eliminado", variant: "error" },
};

export default function OfferingsTable({ offerings }: { offerings: Offering[] }) {
  const router = useRouter();
  const [seoWarnings, setSeoWarnings] = useState<string[]>([]);

  async function toggleStatus(offering: Offering) {
    const action = offering.status === "published" ? "draft" : "publish";
    const res = await fetch(`/api/admin/offerings/${offering.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({})) as { warnings?: string[] };
      setSeoWarnings(getActionWarnings(data.warnings));
      router.refresh();
    }
  }

  async function archive(offering: Offering) {
    const res = await fetch(`/api/admin/offerings/${offering.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "archive" }),
    });
    if (res.ok) router.refresh();
  }

  async function moveToTrash(id: string) {
    const res = await fetch(`/api/admin/offerings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "trash" }),
    });
    if (res.ok) router.refresh();
  }

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
      <SeoServerWarnings warnings={seoWarnings} />
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-container-low/50">
              <th className="text-left py-3.5 px-4 text-label-caps text-label-caps text-on-surface-variant tracking-widest uppercase">
                Título
              </th>
              <th className="text-left py-3.5 px-4 text-label-caps text-label-caps text-on-surface-variant tracking-widest uppercase">
                Precio
              </th>
              <th className="text-left py-3.5 px-4 text-label-caps text-label-caps text-on-surface-variant tracking-widest uppercase">
                Estado
              </th>
              <th className="text-left py-3.5 px-4 text-label-caps text-label-caps text-on-surface-variant tracking-widest uppercase">
                Actualización
              </th>
              <th className="text-right py-3.5 px-4 text-label-caps text-label-caps text-on-surface-variant tracking-widest uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {offerings.map((offering) => {
              const badge = statusBadge[offering.status];
              return (
                <tr
                  key={offering.id}
                  className="hover:bg-surface-container-low transition-colors"
                >
                  <td className="py-3 px-4">
                    <Link
                      href={`/admin/offerings/${offering.id}/edit`}
                      className="font-semibold text-on-surface hover:text-primary transition-colors"
                    >
                      {offering.title}
                    </Link>
                    <div className="text-label-md text-on-surface-variant/60 mt-0.5">
                      /{offering.slug}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-body-md text-on-surface">
                    {offering.price ? `${offering.currency} ${offering.price}` : "—"}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-bold text-[11px] leading-none ${
                        badge.variant === "success"
                          ? "bg-green-100 text-green-700"
                          : badge.variant === "warning"
                          ? "bg-orange-100 text-orange-700"
                          : badge.variant === "error"
                          ? "bg-red-100 text-red-700"
                          : "bg-surface-container-high text-on-surface-variant"
                      }`}
                    >
                      {badge.label}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-label-md text-on-surface-variant">
                    {formatAdminDate(offering.updated_at)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/offerings/${offering.id}/edit`}
                        className="text-primary text-label-md font-semibold hover:underline"
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => toggleStatus(offering)}
                        className="text-on-surface-variant text-label-md font-medium hover:text-primary transition-colors"
                      >
                        {offering.status === "published" ? "Borrador" : "Publicar"}
                      </button>
                      <button
                        onClick={() => archive(offering)}
                        className="text-on-surface-variant text-label-md font-medium hover:text-primary transition-colors"
                      >
                        Archivar
                      </button>
                      <button
                        onClick={() => moveToTrash(offering.id)}
                        className="text-error text-label-md font-medium hover:underline transition-colors"
                      >
                        Papelera
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
