import { MarkdownContent } from "@/components/ui/MarkdownContent";
import type { ExperienceItem } from "@/data/types";
import {
  DEFAULT_DESCRIPTION_TYPOGRAPHY,
  detailTextTypographyStyle,
  normalizeRichTextTypography,
} from "@/lib/cms/rich-text-typography";
import { editorialDetailTypographyStyle } from "../../lib/classDetailContent";

type Props = {
  item: ExperienceItem;
};

export function ClassDetailLeadIntro({ item }: Props) {
  return (
    <div className="class-detail__lead-center">
      <MarkdownContent
        source={item.detailQuestion}
        className="class-detail__question class-detail__question--editorial class-detail__question--styled"
        style={editorialDetailTypographyStyle(item.detailQuestionTypography)}
      />
      <MarkdownContent
        source={item.introHighlight}
        className="class-detail__highlight class-detail__highlight--editorial class-detail__highlight--styled"
        style={editorialDetailTypographyStyle(item.introHighlightTypography)}
      />
    </div>
  );
}

export function ClassDetailDescription({ item }: Props) {
  return (
    <MarkdownContent
      source={item.description}
      className="class-detail__copy class-detail__copy--editorial class-detail__copy--styled"
      style={detailTextTypographyStyle(
        normalizeRichTextTypography(item.descriptionTypography ?? DEFAULT_DESCRIPTION_TYPOGRAPHY),
        "description",
      )}
    />
  );
}
