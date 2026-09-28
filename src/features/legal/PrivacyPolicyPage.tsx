import Link from "next/link";
import { HeaderInterno } from "@/components/layout/HeaderInterno";
import { MarkdownContent } from "@/components/ui/MarkdownContent";
import { SitePage } from "@/features/shared/layout/SitePage";
import { getLegalSettings } from "@/lib/cms/legal";
import { getSettings } from "@/lib/cms/settings";
import { DEFAULT_PRIVACY_POLICY_MARKDOWN } from "@/lib/cms/types";
import { formatDate } from "@/lib/utils";

export async function PrivacyPolicyPage() {
  const [settings, siteSettings] = await Promise.all([getLegalSettings(), getSettings()]);
  const title = settings.privacy_policy_title || "Política de privacidad";
  const content = settings.privacy_policy_content.trim() || DEFAULT_PRIVACY_POLICY_MARKDOWN;
  const updatedAt = settings.updated_at
    ? formatDate(settings.updated_at, siteSettings.site.timezone)
    : null;

  return (
    <SitePage
      bodyClass="blog-post-page legal-policy-page"
      header={
        <HeaderInterno height="small" overlayTitle className="blog-hero legal-hero">
          <>
            <p className="blog-post-hero__category">Política de privacidad</p>
            <h1 className="page-hero__title blog-hero__title">
              {title}
            </h1>
            <p className="blog-post-hero__meta">
              Casa Rosier{updatedAt ? ` · Actualizado el ${updatedAt}` : ""}
            </p>
          </>
        </HeaderInterno>
      }
    >
      <section className="blog-post legal-policy section">
        <div className="container article-wrapper blog-post__container">
          <div className="article-header blog-post__header legal-policy__header">
            <p className="blog-post-hero__category">Documento legal</p>
            <h2 className="article-title blog-post__article-title">{title}</h2>
          </div>
          <article className="article-content blog-post__content legal-policy__content">
            <LegalText content={content} />
          </article>
        </div>
      </section>
      <section className="blog-post-nav legal-policy__nav">
        <div className="container blog-post-nav__container">
          <Link href="/">Volver al inicio</Link>
        </div>
      </section>
    </SitePage>
  );
}

function LegalText({ content }: { content: string }) {
  return <MarkdownContent source={content} />;
}
