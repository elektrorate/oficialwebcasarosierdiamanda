import { IdeaPromptSection } from "@/features/shared/contextual-sections/IdeaPromptSection";
import PublicFaqSection from "@/features/shared/contextual-sections/PublicFaqSection";
import { SitePage } from "@/features/shared/layout/SitePage";
import { getSettings } from "@/lib/cms/settings";
import { BlogIndexHeader } from "./components/BlogIndexHeader";
import { BlogIndexSection } from "./components/index/BlogIndexSection";
import { loadBlogIndexPage } from "./loadBlogIndexPage";

export async function BlogIndexPage() {
  const [{ intro, featured, published, selectedFaqBlock, showIdeaPrompt }, settings] =
    await Promise.all([loadBlogIndexPage(), getSettings()]);

  return (
    <SitePage bodyClass="blog-page" header={<BlogIndexHeader />}>
      <BlogIndexSection
        intro={intro}
        featured={featured}
        published={published}
        timeZone={settings.site.timezone}
      />
      {selectedFaqBlock ? (
        <PublicFaqSection block={selectedFaqBlock} eyebrow="" />
      ) : null}
      {showIdeaPrompt ? <IdeaPromptSection context="home" /> : null}
    </SitePage>
  );
}
