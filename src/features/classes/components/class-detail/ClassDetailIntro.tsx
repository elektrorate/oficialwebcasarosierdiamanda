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
    <header className="class-detail__head class-detail__head--editorial">
      <TitleTag
        className="class-detail__title class-detail__title--editorial class-detail__title--styled"
        style={editorialDetailTypographyStyle(item.subtitleTypography)}
      >
        {renderInlineMarkdown(titleMarkdownToInline(item.subtitle) || item.title)}
      </TitleTag>
    </header>
  );
}
