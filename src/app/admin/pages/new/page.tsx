import AdminShell from "@/components/admin/AdminShell";
import PageForm from "@/components/admin/PageForm";
import { getFooters } from "@/lib/cms/footers";
import { getHeaders } from "@/lib/cms/headers";
import { getSocialGalleries } from "@/lib/cms/social-galleries";
import { getTestimonials } from "@/lib/cms/testimonials";

export default async function NewPagePage() {
  const [headers, socialGalleries, testimonials, footers] = await Promise.all([
    getHeaders(),
    getSocialGalleries(),
    getTestimonials(),
    getFooters(),
  ]);

  return (
    <AdminShell>
      <div className="section-head">
        <div>
          <p className="auth-kicker">CMS</p>
          <h2>Nueva página</h2>
        </div>
      </div>
      <PageForm
        mode="create"
        headers={headers}
        socialGalleries={socialGalleries}
        testimonials={testimonials}
        footers={footers}
      />
    </AdminShell>
  );
}
