import { MarkdownContent } from "@/components/ui/MarkdownContent";
import type { ExperienceAdditionalInfoBlock, ExperienceItem } from "@/data/types";
import type { CalendarLabel } from "@/lib/cms/types";
import {
  DEFAULT_DESCRIPTION_TYPOGRAPHY,
  normalizeRichTextTypography,
  richTextTypographyStyle,
} from "@/lib/cms/rich-text-typography";
import { ClassDetailCalendarLabels } from "./ClassDetailCalendarLabels";
type Props = {
  item: ExperienceItem;
  showPaymentMethods: boolean;
  hasSideContent: boolean;
  calendarLabels: CalendarLabel[];
};

function AdditionalInfoCard({ block }: { block: ExperienceAdditionalInfoBlock }) {
  return (
    <div className="class-sidecard class-sidecard--soft">
      {block.title.trim() ? <h3>{block.title}</h3> : null}
      {block.content.trim() ? (
        <MarkdownContent
          source={block.content}
          className="class-detail__content-copy"
          style={richTextTypographyStyle(
            normalizeRichTextTypography(block.contentTypography ?? DEFAULT_DESCRIPTION_TYPOGRAPHY),
          )}
        />
      ) : null}
    </div>
  );
}

export function ClassDetailSidebarColumn({
  item,
  showPaymentMethods,
  hasSideContent,
  calendarLabels,
}: Props) {
  if (!hasSideContent) return null;

  const additionalInfoBlocks: ExperienceAdditionalInfoBlock[] = [
    ...(item.showAdditionalInfoSection !== false && item.additionalInfo.trim()
      ? [{
          id: "primary-additional-info",
          title: item.additionalInfoTitle?.trim() || "Informacion adicional",
          content: item.additionalInfo,
          contentTypography: item.additionalInfoTypography,
          enabled: true,
          order: -1,
        }]
      : []),
    ...(item.additionalInfoBlocks ?? []).filter(
      (block) => block.enabled && Boolean(block.title.trim() || block.content.trim()),
    ),
  ];

  return (
    <aside className="class-detail__side-column">
      {showPaymentMethods ? (
        <div className="class-sidecard">
          <h3>{item.paymentMethodsSectionTitle || "Métodos de pago"}</h3>
          <ul>
            {item.paymentMethods.map((method, methodIndex) => (
              <li key={`${method}-${methodIndex}`}>{method}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {additionalInfoBlocks.map((block) => <AdditionalInfoCard key={block.id} block={block} />)}

      <ClassDetailCalendarLabels item={item} labels={calendarLabels} />
    </aside>
  );
}
