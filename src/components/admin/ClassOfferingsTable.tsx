"use client";

import Image from "next/image";
import Link from "@/components/admin/AdminLink";
import AdminActionModal from "./AdminActionModal";
import { SeoServerWarnings } from "./SeoReview";
import { OfferingDeleteDialog } from "./offerings-category/OfferingDeleteDialog";
import { OfferingStatusSwitch } from "./offerings-category/OfferingStatusSwitch";
import { useOfferingTableActions } from "./offerings-category/hooks/useOfferingTableActions";
import { truncateOfferingExcerpt, normalizeOfferingListText, OFFERING_LIST_EXCERPT_MAX_LENGTH } from "@/components/admin/offerings-category/utils";
import type { Offering } from "@/lib/cms/types";
import { formatAdminDate } from "@/lib/admin/date-format";

function formatCurrency(value: number | null, currency: string) {
  if (value === null) return "0€";
  const symbol = currency === "EUR" ? "€" : currency === "USD" ? "$" : currency;
  return currency === "EUR" ? `${value}${symbol}` : `${symbol}${value}`;
}

function OfferingRowActions({
  offering,
  basePath,
  isBusy,
  isPending,
  onDuplicate,
  onDelete,
}: {
  offering: Offering;
  basePath: string;
  isBusy: boolean;
  isPending: boolean;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="offerings-category-row-actions">
      <Link
        href={`${basePath}/${offering.id}/edit`}
        className="offerings-category-row-actions__btn"
        title="Editar"
      >
        <span className="material-symbols-outlined" aria-hidden="true">
          edit
        </span>
        <span className="offerings-category-row-actions__label">Editar</span>
      </Link>
      <button
        type="button"
        disabled={isBusy}
        onClick={onDuplicate}
        className="offerings-category-row-actions__btn"
        title="Duplicar"
      >
        <span className="material-symbols-outlined" aria-hidden="true">
          content_copy
        </span>
        <span className="offerings-category-row-actions__label">{isPending ? "..." : "Duplicar"}</span>
      </button>
      <button
        type="button"
        disabled={isBusy}
        onClick={onDelete}
        className="offerings-category-row-actions__btn offerings-category-row-actions__btn--danger"
        title="Papelera"
        aria-haspopup="dialog"
      >
        <span className="material-symbols-outlined" aria-hidden="true">
          delete
        </span>
        <span className="offerings-category-row-actions__label">{isPending ? "..." : "Papelera"}</span>
      </button>
    </div>
  );
}

export default function ClassOfferingsTable({
  offerings,
  basePath = "/admin/clases",
  typeLabel = "Clase",
}: {
  offerings: Offering[];
  basePath?: string;
  typeLabel?: string;
}) {
  const actions = useOfferingTableActions(typeLabel);
  const rows = actions.visibleOfferings(offerings);

  return (
    <>
      <SeoServerWarnings warnings={actions.seoWarnings} />
      <AdminActionModal
        open={Boolean(actions.notice)}
        type={actions.notice?.type}
        title={actions.notice?.title ?? ""}
        message={actions.notice?.message}
        confirmLabel="Entendido"
        onClose={() => actions.setNotice(null)}
      />

      <OfferingDeleteDialog
        state={actions.deleteDialog}
        typeLabel={typeLabel}
        onConfirm={() => void actions.confirmDeleteDialog()}
        onClose={actions.closeDeleteDialog}
      />

      <div className="offerings-category-table-wrap">
        <table className="offerings-category-table">
          <thead>
            <tr>
              <th scope="col">Contenido</th>
              <th scope="col" className="offerings-category-table__status-head">Estado</th>
              <th scope="col">Precio</th>
              <th scope="col">Actualización</th>
              <th scope="col" className="offerings-category-table__actions-head">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((offering) => {
              if (actions.hiddenIds.has(offering.id)) return null;

              const isPending = actions.pendingId === offering.id;
              const isStatusPending = actions.statusPendingId === offering.id;
              const resolvedStatus = actions.resolveOfferingStatus(offering);
              const isEnabled = resolvedStatus === "published";
              const duration = offering.duration || "Sin definir";
              const excerptNormalized = normalizeOfferingListText(offering.excerpt);
              const excerptPreview = truncateOfferingExcerpt(offering.excerpt);
              const excerptIsTruncated = excerptNormalized.length > OFFERING_LIST_EXCERPT_MAX_LENGTH;

              return (
                <tr key={offering.id} className={isPending || isStatusPending ? "is-pending" : undefined}>
                  <td data-label="Contenido">
                    <div className="offerings-category-table__content">
                      <Link
                        href={`${basePath}/${offering.id}/edit`}
                        className="offerings-category-table__thumb"
                        aria-label={`Editar ${offering.title}`}
                      >
                        {offering.cover_image_url ? (
                          <Image
                            src={offering.cover_image_url}
                            alt=""
                            fill
                            sizes="(min-width: 900px) 72px, 56px"
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <span className="offerings-category-table__thumb-fallback material-symbols-outlined" aria-hidden="true">
                            image
                          </span>
                        )}
                      </Link>
                      <div className="offerings-category-table__copy">
                        <span className="offerings-category-table__type">{typeLabel}</span>
                        <Link href={`${basePath}/${offering.id}/edit`} className="offerings-category-table__title">
                          {offering.title}
                        </Link>
                        <p
                          className="offerings-category-table__excerpt"
                          title={excerptIsTruncated ? excerptNormalized : undefined}
                        >
                          {excerptPreview}
                        </p>
                        <p className="offerings-category-table__slug">/{offering.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td data-label="Estado" className="offerings-category-table__status-cell">
                    <OfferingStatusSwitch
                      checked={isEnabled}
                      loading={isStatusPending}
                      disabled={actions.isBusy && !isStatusPending}
                      offeringTitle={offering.title}
                      onCheckedChange={(enabled) => void actions.toggleOfferingStatus(offering, enabled)}
                    />
                  </td>
                  <td data-label="Precio">
                    <p className="offerings-category-table__price">{formatCurrency(offering.price, offering.currency)}</p>
                    <p className="offerings-category-table__duration">{duration}</p>
                  </td>
                  <td data-label="Actualización">
                    <time dateTime={offering.updated_at || offering.created_at}>
                      {formatAdminDate(offering.updated_at || offering.created_at)}
                    </time>
                  </td>
                  <td data-label="Acciones" className="offerings-category-table__actions-cell">
                    <OfferingRowActions
                      offering={offering}
                      basePath={basePath}
                      isBusy={actions.isBusy}
                      isPending={isPending}
                      onDuplicate={() => void actions.runPatchAction(offering.id, "duplicate")}
                      onDelete={() => actions.openTrashDialog(offering)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
