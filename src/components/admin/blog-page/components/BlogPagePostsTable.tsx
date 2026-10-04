"use client";

import Image from "next/image";
import Link from "@/components/admin/AdminLink";
import { memo } from "react";
import AdminActionModal from "@/components/admin/AdminActionModal";
import { SeoServerWarnings } from "@/components/admin/SeoReview";
import { OfferingStatusSwitch } from "@/components/admin/offerings-category/OfferingStatusSwitch";
import { BITACORA_EDIT_PATH, BLOG_POST_STATUS_LABELS } from "@/lib/admin/bitacora-actions";
import type { BitacoraPatchAction } from "@/lib/admin/bitacora-actions";
import type { BlogPost } from "@/lib/cms/types";
import { BlogPostTrashDialog } from "./BlogPostTrashDialog";
import { BlogPostRowActions } from "./BlogPostRowActions";
import { useBlogTableActions } from "../hooks/useBlogTableActions";
import { blogPostListingExcerpt } from "../utils/blogPostListing";

function statusPillClass(status: BlogPost["status"]) {
  if (status === "published") return "status-pill status-pill--published";
  if (status === "draft") return "status-pill status-pill--draft";
  if (status === "archived") return "status-pill status-pill--archived";
  return "status-pill";
}

export type BlogPagePostsTableProps = {
  items: BlogPost[];
  showDuplicate?: boolean;
  showArchive?: boolean;
  onPostUpdated?: (id: string, post: unknown, fallbackPatch?: Partial<BlogPost>) => void;
  onPostRemoved?: (id: string) => void;
};

function BlogPagePostsTableComponent({
  items,
  showDuplicate = true,
  showArchive = true,
  onPostUpdated,
  onPostRemoved,
}: BlogPagePostsTableProps) {
  const actions = useBlogTableActions({ onPostUpdated, onPostRemoved });
  const visibleItems = actions.filterVisibleItems(items);

  async function handleAction(id: string, action: BitacoraPatchAction) {
    await actions.runAction(id, action);
  }

  return (
    <>
      <SeoServerWarnings warnings={actions.seoWarnings} />
      <div className="table-card blog-table-card overflow-hidden rounded-2xl border border-outline-variant/70 shadow-sm">
        <table className="admin-table blog-admin-table blog-admin-table--v2 w-full">
          <thead>
            <tr>
              <th className="blog-admin-table__col-entry">Entrada</th>
              <th className="blog-admin-table__col-status">Estado</th>
              <th className="blog-admin-table__col-visibility">En sitio</th>
              <th className="blog-admin-table__col-category">Categoría</th>
              <th className="blog-admin-table__col-actions">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visibleItems.map((post) => {
              const rowPending = actions.isPending(post.id);
              const status = actions.resolvePostStatus(post);
              const isEnabled = actions.isPostEnabled(post);
              const isStatusPending = actions.statusPendingId === post.id;
              const isArchived = status === "archived";

              return (
                <tr key={post.id} className={rowPending || isStatusPending ? "opacity-70" : undefined}>
                  <td className="blog-admin-table__col-entry">
                    <div className="flex min-w-0 items-center gap-3 py-1">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low">
                        {post.featured_image_id ? (
                          <Image
                            src={post.featured_image_id}
                            alt=""
                            fill
                            sizes="56px"
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <span
                            className="flex h-full w-full items-center justify-center text-on-surface-variant"
                            aria-hidden="true"
                          >
                            <span className="material-symbols-outlined text-xl">image</span>
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            className="text-body-md font-bold text-on-surface hover:text-secondary"
                            href={BITACORA_EDIT_PATH(post.id)}
                            onClick={() => actions.startEditNotice(post.id)}
                          >
                            {post.title}
                          </Link>
                          {post.is_featured ? (
                            <span className="rounded-full bg-secondary-container/30 px-2 py-0.5 text-label-md font-semibold text-secondary">
                              Destacado
                            </span>
                          ) : null}
                          <span className="entity-badge md:hidden">{post.category}</span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-label-md leading-snug text-on-surface-variant">
                          {blogPostListingExcerpt(post) || "Sin extracto."}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="blog-admin-table__col-status">
                    <span className={statusPillClass(status)}>{BLOG_POST_STATUS_LABELS[status]}</span>
                  </td>
                  <td className="blog-admin-table__col-visibility">
                    <OfferingStatusSwitch
                      checked={isEnabled}
                      loading={isStatusPending}
                      disabled={isArchived || (actions.isBusy && !isStatusPending)}
                      offeringTitle={post.title}
                      onCheckedChange={(enabled) => void actions.togglePostEnabled(post, enabled)}
                    />
                    {isArchived ? (
                      <p className="blog-admin-table__visibility-note">Archivada</p>
                    ) : null}
                  </td>
                  <td className="blog-admin-table__col-category">
                    <span className="entity-badge">{post.category}</span>
                  </td>
                  <td className="blog-admin-table__col-actions">
                    <BlogPostRowActions
                      post={post}
                      rowPending={rowPending}
                      showDuplicate={showDuplicate}
                      showArchive={showArchive}
                      isPending={actions.isPending}
                      onEditNotice={() => actions.startEditNotice(post.id)}
                      onAction={(action) => void handleAction(post.id, action)}
                      onTrash={() => actions.openTrashDialog(post)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AdminActionModal
        open={Boolean(actions.notice)}
        type={actions.notice?.type}
        title={actions.notice?.title ?? ""}
        message={actions.notice?.message}
        confirmLabel="Entendido"
        onClose={actions.closeNotice}
      />

      <BlogPostTrashDialog
        state={actions.trashDialog}
        onConfirm={() => void actions.confirmTrashDialog()}
        onClose={actions.closeTrashDialog}
      />
    </>
  );
}

export const BlogPagePostsTable = memo(BlogPagePostsTableComponent);

export default BlogPagePostsTable;
