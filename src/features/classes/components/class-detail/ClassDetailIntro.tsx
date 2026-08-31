import { renderInlineMarkdown } from "@/components/ui/MarkdownContent";
import type { ExperienceItem } from "@/data/types";
import { editorialDetailTypographyStyle, titleMarkdownToInline } from "../../lib/classDetailContent";

type Props = {
  item: ExperienceItem;
  titleLevel?: "h1" | "h2";
};

export function ClassDetailIntro({ item, titleLevel = "h1" }: Props) {
  const TitleTag = titleLevel;

  return (
    <header className="class-detail__head class-detail__head--editorial mb-[24px] w-full! text-center!">
      <TitleTag
        className="class-detail__title class-detail__title--editorial class-detail__title--styled m-0 text-[#54504c] text-[clamp(34px,4vw,48px)] leading-[1.05] [font-family:var(--font-display)] uppercase max-[1024px]:text-[32px] max-[640px]:text-[24px] max-[640px]:tracking-[0.03em]"
        style={editorialDetailTypographyStyle(item.subtitleTypography)}
      >
        {renderInlineMarkdown(titleMarkdownToInline(item.subtitle) || item.title)}
      </TitleTag>
    </header>
  );
}
