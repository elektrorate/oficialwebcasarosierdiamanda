"use client";

import Link from "@/components/admin/AdminLink";
import { BITACORA_EDIT_PATH } from "@/lib/admin/bitacora-actions";
import type { BitacoraPatchAction } from "@/lib/admin/bitacora-actions";
import type { BlogPost } from "@/lib/cms/types";

type BlogPostRowActionsProps = {
  post: BlogPost;
  rowPending: boolean;
  showDuplicate: boolean;
  showArchive: boolean;
  isPending: (id: string, action?: string) => boolean;
  onEditNotice: () => void;
  onAction: (action: BitacoraPatchAction) => void;
  onTrash: () => void;
};

export function BlogPostRowActions({
  post,
  rowPending,
  showDuplicate,
  showArchive,
  isPending,
  onEditNotice,
  onAction,
  onTrash,
}: BlogPostRowActionsProps) {
  const featureAction: BitacoraPatchAction = post.is_featured ? "unfeature" : "feature";

  return (
    <div className="offerings-category-row-actions blog-post-row-actions">
      <Link
        href={BITACORA_EDIT_PATH(post.id)}
        className="offerings-category-row-actions__btn"
        title="Editar"
        aria-disabled={rowPending}
        onClick={onEditNotice}
      >
        <span className="material-symbols-outlined" aria-hidden="true">
          edit
        </span>
        <span className="offerings-category-row-actions__label">
          {isPending(post.id, "edit") ? "…" : "Editar"}
        </span>
      </Link>

      {showDuplicate ? (
        <button
          type="button"
          disabled={rowPending}
          onClick={() => onAction("duplicate")}
          className="offerings-category-row-actions__btn"
          title="Duplicar"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            content_copy
          </span>
          <span className="offerings-category-row-actions__label">
            {isPending(post.id, "duplicate") ? "…" : "Duplicar"}
          </span>
        </button>
      ) : null}

      {showArchive && post.status !== "archived" ? (
        <button
          type="button"
          disabled={rowPending}
          onClick={() => onAction("archive")}
          className="offerings-category-row-actions__btn"
          title="Archivar"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            inventory_2
          </span>
          <span className="offerings-category-row-actions__label">
            {isPending(post.id, "archive") ? "…" : "Archivar"}
          </span>
        </button>
      ) : null}

      <button
        type="button"
        disabled={rowPending}
        onClick={() => onAction(featureAction)}
        className={`offerings-category-row-actions__btn blog-post-row-actions__feature${post.is_featured ? " offerings-category-row-actions__btn--accent" : ""}`}
        title={post.is_featured ? "Quitar de destacados" : "Destacar en home"}
        aria-pressed={post.is_featured}
      >
        <span className="material-symbols-outlined" aria-hidden="true">
          {post.is_featured ? "star" : "star_border"}
        </span>
        <span className="offerings-category-row-actions__label">
          {isPending(post.id, featureAction) ? "…" : post.is_featured ? "Destacado" : "Destacar"}
        </span>
      </button>

      <button
        type="button"
        disabled={rowPending}
        onClick={onTrash}
        className="offerings-category-row-actions__btn offerings-category-row-actions__btn--danger"
        title="Eliminar"
        aria-haspopup="dialog"
      >
        <span className="material-symbols-outlined" aria-hidden="true">
          delete
        </span>
        <span className="offerings-category-row-actions__label">
          {isPending(post.id, "trash") ? "…" : "Eliminar"}
        </span>
      </button>
    </div>
  );
}
