import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import AdminLayoutShell from "@/components/layout/AdminLayout";
import { requireAdminProfile } from "@/lib/auth/supabase-auth";
// Public feature styles are also used by the CMS preview panes. Keeping them
// here preserves those previews without making every public route download them.
import "../legacy/home.css";
import "../legacy/classes.css";
import "../legacy/shop.css";
import "../../features/shop/components/catalog/shop-catalog.css";
import "../../features/shop/components/item-detail/shop-item-detail.css";
import "../../features/classes/components/class-detail/class-detail.css";
import "../legacy/blog.css";
import "../../features/blog/components/index/blog-index.css";
import "../../features/blog/components/post/blog-post-editorial.css";
import "../legacy/studio.css";
import "../../features/classes/components/class-detail/offering-detail-redesign.css";
import "../../components/home/gift-carousel.css";
import "../../components/home/social-gallery-home.css";
import "../../components/layout/scroll-nav/home-scroll-sticky-nav.css";
import "../admin-offerings-table.css";
import "./admin.css";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const session = await requireAdminProfile();
  if (!session) redirect("/auth");

  return (
    <AdminLayoutShell session={session}>
      {/* Material Symbols has no next/font equivalent and is only needed by the CMS. */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />
      {children}
    </AdminLayoutShell>
  );
}
