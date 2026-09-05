import { MarkdownContent } from "@/components/ui/MarkdownContent";
import type { ExperienceItem } from "@/data/types";
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

export function ClassDetailSidebarColumn({
  item,
  showPaymentMethods,
  hasSideContent,
  calendarLabels,
}: Props) {
  if (!hasSideContent) return null;

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

      {item.showAdditionalInfoSection !== false && item.additionalInfo.trim() ? (
        <div className="class-sidecard class-sidecard--soft">
          <h3>{item.additionalInfoTitle?.trim() || "Informacion adicional"}</h3>
          <MarkdownContent
            source={item.additionalInfo}
            className="class-detail__content-copy"
            style={richTextTypographyStyle(
              normalizeRichTextTypography(item.additionalInfoTypography ?? DEFAULT_DESCRIPTION_TYPOGRAPHY),
            )}
          />
        </div>
      ) : null}

      <ClassDetailCalendarLabels item={item} labels={calendarLabels} />
    </aside>
  );
}
