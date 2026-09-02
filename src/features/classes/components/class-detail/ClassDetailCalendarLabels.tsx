"use client";

import { useState } from "react";
import type { ExperienceItem } from "@/data/types";
import {
  CLASS_DETAIL_MONTH_NAMES,
  CLASS_DETAIL_WEEKDAY_LABELS,
  calendarMonthCells,
  formatCalendarDays,
} from "../../lib/classDetailContent";

const DEFAULT_TITLE = "PR\u00d3XIMAS FECHAS";
const DEFAULT_DESCRIPTION =
  "Consulta las pr\u00f3ximas fechas disponibles y elige la edici\u00f3n que mejor se adapte a tu calendario.";

import type { CalendarLabel } from "@/lib/cms/types";

type Props = {
  item: ExperienceItem;
  labels: CalendarLabel[];
};

export function ClassDetailCalendarLabels({ item, labels }: Props) {
  const [open, setOpen] = useState(true);
  if (!labels.length) return null;

  const title = item.calendarLabelsTitle?.trim() || DEFAULT_TITLE;
  const description = item.calendarLabelsDescription?.trim() || DEFAULT_DESCRIPTION;
  const panelId = `class-calendar-labels-${item.id}`;
  const calendarUi = item.calendarUi;
  const monthNames = calendarUi?.monthNames?.length ? calendarUi.monthNames : CLASS_DETAIL_MONTH_NAMES;
  const weekdayLabels = calendarUi?.weekdayLabels?.length ? calendarUi.weekdayLabels : CLASS_DETAIL_WEEKDAY_LABELS;
  const collapseLabel = calendarUi?.collapseLabel || "ocultar fechas";
  const expandLabel = calendarUi?.expandLabel || "ver otras fechas";
  const daySingular = calendarUi?.daySingular || "día";
  const dayPlural = calendarUi?.dayPlural || "días";

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
          <span>{open ? collapseLabel : expandLabel}</span>
          <span className="class-calendar-labels__arrow-icon" aria-hidden="true" />
        </button>
      </div>
      {open ? (
        <div className="class-calendar-labels__grid" id={panelId}>
          {labels.map((label) => {
            const monthName = monthNames[label.month - 1] || "Mes";
            const selectedDays = [...label.days].sort((a, b) => a - b);
            const cells = calendarMonthCells(label.year, label.month);

            return (
              <article className="class-calendar-card" key={label.id}>
                <div className="class-calendar-card__top">
                  <span aria-hidden="true">&lsaquo;</span>
                  <h3>
                    {monthName} {label.year}
                  </h3>
                  <span aria-hidden="true">&rsaquo;</span>
                </div>
                <div className="class-calendar-card__weekdays">
                  {weekdayLabels.map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>
                <div className="class-calendar-card__days">
                  {cells.map((day, index) =>
                    day ? (
                      <span className={selectedDays.includes(day) ? "is-selected" : undefined} key={day}>
                        {day}
                      </span>
                    ) : (
                      <span key={`empty-${index}`} aria-hidden="true" />
                    ),
                  )}
                </div>
                <div className="class-calendar-card__summary">
                  <h4>
                    {monthName} {label.year}
                  </h4>
                  <p>
                    <span>
                      {selectedDays.length} {selectedDays.length === 1 ? daySingular : dayPlural}
                    </span>{" "}
                    <strong>{formatCalendarDays(selectedDays)}</strong>
                  </p>
                  {label.availabilityText ? <p>{label.availabilityText}</p> : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
