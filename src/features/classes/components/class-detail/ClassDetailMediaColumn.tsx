import { MarkdownContent } from "@/components/ui/MarkdownContent";
import type { ExperienceItem } from "@/data/types";
import type { CalendarLabel } from "@/lib/cms/types";
import {
  DEFAULT_DESCRIPTION_TYPOGRAPHY,
  normalizeRichTextTypography,
  richTextTypographyStyle,
} from "@/lib/cms/rich-text-typography";
import { ClassDetailCalendarLabels } from "./ClassDetailCalendarLabels";
import { ClassDetailGallery } from "./ClassDetailGallery";

type SidebarProps = {
  item: ExperienceItem;
  showPaymentMethods: boolean;
  calendarLabels: CalendarLabel[];
};

function ClassDetailSidebar({ item, showPaymentMethods, calendarLabels }: SidebarProps) {
  return (
    <>
      {showPaymentMethods ? (
        <div className="class-sidecard">
          <h3>Metodos de pago</h3>
          <ul>
            {item.paymentMethods.map((method, methodIndex) => (
              <li key={`${method}-${methodIndex}`}>{method}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {item.additionalInfo.trim() ? (
        <div className="class-sidecard class-sidecard--soft">
          <h3>Informacion adicional</h3>
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
    </>
  );
}

type Props = {
  item: ExperienceItem;
  showPaymentMethods: boolean;
  hasSideContent: boolean;
  calendarLabels: CalendarLabel[];
};

export function ClassDetailMediaColumn({
  item,
  showPaymentMethods,
  hasSideContent,
  calendarLabels,
}: Props) {
  return (
    <section className="class-detail__media-column pt-11.5">
      <ClassDetailGallery item={item} />
      {hasSideContent ? (
        <aside className="class-detail__side-column gap-[clamp(14px,2vw,18px)] mt-[24px]">
          <ClassDetailSidebar
            item={item}
            showPaymentMethods={showPaymentMethods}
            calendarLabels={calendarLabels}
          />
        </aside>
      ) : null}
    </section>
  );
}
