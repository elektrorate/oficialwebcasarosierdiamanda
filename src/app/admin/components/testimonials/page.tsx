import AdminShell from "@/components/admin/AdminShell";
import {
  TestimonialsTable,
  TESTIMONIAL_ADMIN_FILTERS,
  testimonialsSyncKey,
} from "@/components/admin/testimonials";
import { listAdminTestimonials } from "@/lib/cms/testimonials";

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const rawStatus = (await searchParams)?.status;
  const status = rawStatus === "draft" || rawStatus === "published" ? rawStatus : "all";
  const items = await listAdminTestimonials(status);

  return (
    <AdminShell>
      <TestimonialsTable
        key={`${status}:${testimonialsSyncKey(items)}`}
        items={items}
        filters={TESTIMONIAL_ADMIN_FILTERS}
        status={status}
      />
    </AdminShell>
  );
}
