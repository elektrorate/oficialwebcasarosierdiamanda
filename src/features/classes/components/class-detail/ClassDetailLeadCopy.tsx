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

export function ClassDetailLeadCopy({ item }: Props) {
  return (
    <div className="class-detail__lead flex flex-col gap-[clamp(22px,3vw,32px)] mb-[clamp(28px,3.5vw,40px)]">
      <div className="class-detail__lead-center flex flex-col items-center gap-[clamp(14px,2vw,20px)] text-center">
        <MarkdownContent
          source={item.detailQuestion}
          className="class-detail__question class-detail__question--editorial class-detail__question--styled m-0 max-w-[36ch] text-[#7c746d] text-[18px] [font-family:var(--font-menu)] uppercase tracking-wider max-[1024px]:text-[14px] max-[640px]:text-[13px]!"
          style={editorialDetailTypographyStyle(item.detailQuestionTypography)}
        />
        <MarkdownContent
          source={item.introHighlight}
          className="class-detail__highlight class-detail__highlight--editorial class-detail__highlight--styled m-0 mb-5.5 text-[#c27649] italic text-[clamp(16px,1.8vw,20px)]/[1.55] [font-family:var(--font-display)] max-[1024px]:text-[15px] max-[640px]:text-[14px]"
          style={editorialDetailTypographyStyle(item.introHighlightTypography)}
        />
      </div>
      <MarkdownContent
        source={item.description}
        className="class-detail__copy class-detail__copy--editorial class-detail__copy--styled m-0"
        style={detailTextTypographyStyle(
          normalizeRichTextTypography(item.descriptionTypography ?? DEFAULT_DESCRIPTION_TYPOGRAPHY),
          "description",
        )}
      />
    </div>
  );
}
