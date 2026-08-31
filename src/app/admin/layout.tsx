import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import AdminLayoutShell from "@/components/layout/AdminLayout";
import { requireAdminProfile } from "@/lib/auth/supabase-auth";
import "./admin.css";

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
