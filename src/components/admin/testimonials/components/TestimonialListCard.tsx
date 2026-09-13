import Link from "@/components/admin/AdminLink";
import { formatAdminDate } from "@/lib/admin/date-format";
import { TESTIMONIAL_STATUS_LABELS } from "../constants";
import { initialsFromName, truncateTestimonialText } from "../utils";
import type { Testimonial } from "../types";

export function TestimonialListCard({
  testimonial,
  index,
  total,
  isPending,
  isBusy,
  onMoveUp,
  onMoveDown,
  onPublishToggle,
  onTrash,
}: {
  testimonial: Testimonial;
  index: number;
  total: number;
  isPending: boolean;
  isBusy: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onPublishToggle: () => void;
  onTrash: () => void;
}) {
  const isPublished = testimonial.status === "published";

  return (
    <article className="admin-list-card testimonial-admin-card">
      <div className="testimonial-admin-card__avatar">
        {testimonial.avatar_id ? (
          <img
            src={testimonial.avatar_id}
            alt={`Foto de ${testimonial.name}`}
            loading="lazy"
            width={112}
            height={112}
          />
        ) : (
          <span aria-hidden="true">{initialsFromName(testimonial.name)}</span>
        )}
      </div>

      <div className="admin-list-card__body">
        <div className="admin-list-card__head">
          <div>
            <h3>{testimonial.name}</h3>
            <p>{testimonial.role || "Sin rol definido"}</p>
          </div>
          <div className="badge-stack">
            <span className={`status-pill status-pill--${testimonial.status}`}>
              {TESTIMONIAL_STATUS_LABELS[testimonial.status]}
            </span>
          </div>
        </div>

        <p className="admin-list-card__copy">{truncateTestimonialText(testimonial.text)}</p>

        <div className="admin-list-card__meta">
          <span>Orden {index + 1}</span>
          <span>Actualizado {formatAdminDate(testimonial.updated_at)}</span>
        </div>

        <div className="row-actions admin-list-card__actions">
          <button
            type="button"
            className="secondary-btn icon-btn"
            onClick={onMoveUp}
            disabled={index === 0 || isBusy}
            aria-label="Subir testimonio"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              keyboard_arrow_up
            </span>
          </button>
          <button
            type="button"
            className="secondary-btn icon-btn"
            onClick={onMoveDown}
            disabled={index === total - 1 || isBusy}
            aria-label="Bajar testimonio"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              keyboard_arrow_down
            </span>
          </button>
          <Link className="link-btn" href={`/admin/components/testimonials/${testimonial.id}/edit`}>
            Editar
          </Link>
          <button
            className="secondary-btn"
            type="button"
            onClick={onPublishToggle}
            disabled={isPending || isBusy}
          >
            {isPublished ? "Borrador" : "Publicar"}
          </button>
          <button
            className="danger-btn"
            type="button"
            onClick={onTrash}
            disabled={isPending || isBusy}
          >
            Papelera
          </button>
        </div>
      </div>
    </article>
  );
}
