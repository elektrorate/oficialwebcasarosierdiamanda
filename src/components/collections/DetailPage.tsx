"use client";

import { useState } from "react";
import { Accordion } from "@/components/collections/Accordion";
import { Gallery } from "@/components/collections/Gallery";
import { MarkdownContent, renderInlineMarkdown } from "@/components/ui/MarkdownContent";
import type { ExperienceItem } from "@/data/types";
import { assetPath } from "@/lib/assets";
import {
  detailTextTypographyStyle,
  DEFAULT_DESCRIPTION_TYPOGRAPHY,
  DEFAULT_RICH_TEXT_TYPOGRAPHY,
  normalizeRichTextTypography,
  richTextTypographyStyle,
} from "@/lib/cms/rich-text-typography";


function includedMarkdownSource(items: string[]) {
  const lines = items.map((item) => item.replace(/\r\n/g, "\n"));
  const joined = lines.join("\n").trim();
  if (!joined) return "";
  // Already structured markdown from the rich-text editor.
  if (/^\s*(?:[-*]|\d+\.|#{1,3})\s+/m.test(joined) || /<\/?(?:p|ul|ol|h[1-3])\b/i.test(joined)) {
    return joined;
  }
  // Plain lines → bullet list so public page keeps the "Incluye" list shape.
  return lines
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `- ${line}`)
    .join("\n");
}

function hasMeaningfulContent(value: string | string[] | undefined) {
  const values = Array.isArray(value) ? value : [value ?? ""];
  return values.some((entry) => entry.trim().length > 0);
}

function titleMarkdownToInline(source: string) {
  return source
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim().replace(/^#{1,3}\s+/, "").replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, ""))
    .filter(Boolean)
    .join(" ")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function hasMeaningfulProgramItem(item: ExperienceItem["program"][number]) {
  return (
    hasMeaningfulContent(item.title) ||
    hasMeaningfulContent(item.content) ||
    (item.points?.some((point) => hasMeaningfulContent(point)) ?? false)
  );
}
const PUBLIC_MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const PUBLIC_WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DEFAULT_CALENDAR_LABELS_TITLE = "PR\u00d3XIMAS FECHAS DEL WORKSHOP";
const DEFAULT_CALENDAR_LABELS_DESCRIPTION = "Consulta las pr\u00f3ximas fechas disponibles del workshop durante el a\u00f1o y elige la edici\u00f3n que mejor se adapte a tu calendario. Cada convocatoria incluye informaci\u00f3n sobre horarios, plazas disponibles y detalles de reserva.";

function daysInMonth(year: number, month: number) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return 0;
  return new Date(year, month, 0).getDate();
}

function calendarMonthCells(year: number, month: number) {
  const count = daysInMonth(year, month);
  if (!count) return [] as Array<number | null>;
  const firstDay = new Date(year, month - 1, 1).getDay();
  const mondayOffset = (firstDay + 6) % 7;
  return [
    ...Array.from({ length: mondayOffset }, () => null),
    ...Array.from({ length: count }, (_, index) => index + 1),
  ];
}

function formatCalendarDays(days: number[]) {
  if (days.length <= 1) return days.join("");
  if (days.length === 2) return `${days[0]} y ${days[1]}`;
  return `${days.slice(0, -1).join(", ")} y ${days[days.length - 1]}`;
}

function visibleCalendarLabels(item: ExperienceItem) {
  return (item.calendarLabels ?? [])
    .filter((label) => label.active && label.days.length > 0 && daysInMonth(label.year, label.month) > 0)
    .sort((a, b) => a.year - b.year || a.month - b.month || a.order - b.order);
}

function CalendarLabelsSection({ item }: { item: ExperienceItem }) {
  const [open, setOpen] = useState(true);
  const labels = visibleCalendarLabels(item);

  if (!labels.length) return null;

  const title = item.calendarLabelsTitle?.trim() || DEFAULT_CALENDAR_LABELS_TITLE;
  const description = item.calendarLabelsDescription?.trim() || DEFAULT_CALENDAR_LABELS_DESCRIPTION;
  const panelId = "calendar-labels-panel-" + item.id;

  return (
    <section className={open ? "class-calendar-labels is-open" : "class-calendar-labels"}>
      <div className="class-calendar-labels__head">
        <div>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        <button
          className="class-calendar-labels__arrow"
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((current) => !current)}
        >
          <span>{open ? "ocultar fechas" : "ver otras fechas"}</span>
          <span className="class-calendar-labels__arrow-icon" aria-hidden="true" />
        </button>
      </div>
      {open ? <div className="class-calendar-labels__grid" id={panelId}>
        {labels.map((label) => {
          const monthName = PUBLIC_MONTH_NAMES[label.month - 1] || "Mes";
          const selectedDays = [...label.days].sort((a, b) => a - b);
          const cells = calendarMonthCells(label.year, label.month);

          return (
            <article className="class-calendar-card" key={label.id}>
              <div className="class-calendar-card__top">
                <span aria-hidden="true">&lsaquo;</span>
                <h3>{monthName} {label.year}</h3>
                <span aria-hidden="true">&rsaquo;</span>
              </div>
              <div className="class-calendar-card__weekdays">
                {PUBLIC_WEEKDAY_LABELS.map((day) => <span key={day}>{day}</span>)}
              </div>
              <div className="class-calendar-card__days">
                {cells.map((day, index) => day ? (
                  <span className={selectedDays.includes(day) ? "is-selected" : undefined} key={day}>{day}</span>
                ) : <span key={`empty-${index}`} aria-hidden="true" />)}
              </div>
              <div className="class-calendar-card__summary">
                <h4>{monthName} {label.year}</h4>
                <p><span>{selectedDays.length} {selectedDays.length === 1 ? "dia" : "dias"}</span> <strong>{formatCalendarDays(selectedDays)}</strong></p>
                {label.availabilityText ? <p>{label.availabilityText}</p> : null}
              </div>
            </article>
          );
        })}
      </div> : null}
    </section>
  );
}
export function DetailPage({
  item,
  titleLevel = "h1",
}: {
  item: ExperienceItem;
  titleLevel?: "h1" | "h2";
}) {
  const DetailTitle = titleLevel;
  const isGiftCard = item.kind === "gift-card";
  const consultHref = item.ctaConsultHref || item.ctaHref;
  const consultLabel = item.ctaConsultLabel || (isGiftCard ? "Comprar" : "Consultar");
  const programItems = item.program.filter(hasMeaningfulProgramItem);
  const showProgram = item.showModulesSection && programItems.length > 0;
  const showIncluded = item.showIncludedSection && hasMeaningfulContent(item.included);
  const hasLearningContent = item.showLearningSection && hasMeaningfulContent(item.whatYouWillLearn);
  const hasParticipationContent = item.showParticipationSection && hasMeaningfulContent(item.whoCanJoin);
  const showPaymentMethods = item.showPaymentMethodsSection && item.paymentMethods.length > 0;
  const hasCalendarLabels = visibleCalendarLabels(item).length > 0;
  const hasSideContent = Boolean(
    item.videoUrl ||
    item.videoCardImage ||
    showPaymentMethods ||
    item.additionalInfo.trim() ||
    hasCalendarLabels
  );
  return (
    <section className="class-detail section">
      <div className="container class-detail__container">
        <div className="class-detail__layout">
          <section className="class-detail__media-column">
            <Gallery
              images={item.galleryImages}
              title={item.title}
              videoImage={item.videoCardImage}
              videoLabel={item.videoCardLabel}
              ctaHref={item.videoUrl}
              showVideo={false}
            />

            {hasSideContent ? (
              <aside className="class-detail__side-column">
              {item.videoUrl ? (
                <a
                  className="class-gallery__video-card"
                  href={item.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {item.videoCardImage ? <img src={assetPath(item.videoCardImage)} alt={item.title} /> : null}
                  <span>{item.videoCardLabel || "VIDEO"}</span>
                </a>
              ) : item.videoCardImage ? (
                <div className="class-gallery__video-card">
                  <img src={assetPath(item.videoCardImage)} alt={item.title} />
                  <span>{item.videoCardLabel || "IMAGEN"}</span>
                </div>
              ) : null}
              {showPaymentMethods ? (
                <div className="class-sidecard">
                  <h3>Metodos de pago</h3>
                  <p>Puedes pagar con cualquiera de estos medios</p>
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
                      normalizeRichTextTypography(
                        item.additionalInfoTypography ?? DEFAULT_DESCRIPTION_TYPOGRAPHY,
                      ),
                    )}
                  />
                </div>
              ) : null}
              <CalendarLabelsSection item={item} />
              </aside>
            ) : null}
          </section>

          <section className="class-detail__content-column">
            <header className="class-detail__head">
              <DetailTitle
                className="class-detail__title class-detail__title--styled"
                style={detailTextTypographyStyle(normalizeRichTextTypography(item.subtitleTypography), "subtitle")}
              >
                {renderInlineMarkdown(titleMarkdownToInline(item.subtitle) || item.title)}
              </DetailTitle>
              <MarkdownContent
                source={item.detailQuestion}
                className="class-detail__question class-detail__question--styled"
                style={detailTextTypographyStyle(normalizeRichTextTypography(item.detailQuestionTypography), "detailQuestion")}
              />
              <MarkdownContent
                source={item.introHighlight}
                className="class-detail__highlight class-detail__highlight--styled"
                style={detailTextTypographyStyle(normalizeRichTextTypography(item.introHighlightTypography), "highlight")}
              />
            </header>

            <MarkdownContent
              source={item.description}
              className="class-detail__copy class-detail__copy--styled"
              style={detailTextTypographyStyle(normalizeRichTextTypography(item.descriptionTypography ?? DEFAULT_DESCRIPTION_TYPOGRAPHY), "description")}
            />

            <section className="class-detail__info-column">
              <section className="class-detail__facts">
                <div className="class-detail__fact-block">
                  <h2>Precio</h2>
                  <div className="class-detail__price-list">
                    {item.priceOptions.map((option, optionIndex) => (
                      <div
                        className="class-detail__price-row"
                        key={`${option.label}-${optionIndex}`}
                      >
                        <span>{option.label}</span>
                        <strong>{option.price}</strong>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="class-detail__fact-block">
                  <h2>Duracion</h2>
                  <p className="class-detail__duration">{item.duration}</p>
                  {item.schedule.length ? (
                    <div className="class-detail__schedule">
                      {item.schedule.map((schedule, scheduleIndex) => (
                        <div
                          className="class-detail__schedule-item"
                          key={`${schedule.day}-${scheduleIndex}`}
                        >
                          <h4>{schedule.day}</h4>
                          {schedule.slots.map((slot, slotIndex) => (
                            <p key={`${slot}-${slotIndex}`}>{slot}</p>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </section>


              {showIncluded || consultHref ? (
                <section className="class-detail__includes">
                  {showIncluded ? (
                    <>
                      <h2>{item.includedSectionTitle || "Incluye"}</h2>
                      <MarkdownContent
                        source={includedMarkdownSource(item.included)}
                        className="class-detail__includes-copy"
                        style={richTextTypographyStyle(
                          normalizeRichTextTypography(
                            item.includedTypography ?? { ...DEFAULT_RICH_TEXT_TYPOGRAPHY, fontSize: 16 },
                          ),
                        )}
                      />
                    </>
                  ) : null}
                  {consultHref ? (
                    <a
                      className="class-detail__button"
                      href={consultHref}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {consultLabel}
                    </a>
                  ) : null}
                </section>
              ) : null}

              {hasLearningContent ? (
                <section className="class-detail__text-block">
                  <h2>{item.learningSectionTitle || "¿Qué aprenderás?"}</h2>
                  <MarkdownContent
                    source={item.whatYouWillLearn}
                    className="class-detail__content-copy"
                    style={richTextTypographyStyle(
                      normalizeRichTextTypography(
                        item.whatYouWillLearnTypography ?? DEFAULT_DESCRIPTION_TYPOGRAPHY,
                      ),
                    )}
                  />
                </section>
              ) : null}

              {hasParticipationContent ? (
                <section className="class-detail__text-block">
                  <h2>{item.participationSectionTitle || "¿Quién puede participar?"}</h2>
                  <MarkdownContent
                    source={item.whoCanJoin}
                    className="class-detail__content-copy"
                    style={richTextTypographyStyle(
                      normalizeRichTextTypography(
                        item.whoCanJoinTypography ?? DEFAULT_DESCRIPTION_TYPOGRAPHY,
                      ),
                    )}
                  />
                </section>
              ) : null}

              {showProgram ? (
                <section className="class-detail__program">
                  <h2>{item.programSectionTitle || "Contenido del curso"}</h2>
                  <Accordion items={programItems} />
                </section>
              ) : null}
            </section>
          </section>
        </div>
      </div>
    </section>
  );
}
