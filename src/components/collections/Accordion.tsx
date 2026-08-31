"use client";

import { useState } from "react";
import { MarkdownContent, renderInlineMarkdown } from "@/components/ui/MarkdownContent";
import type { ProgramItem } from "@/data/types";
import {
  DEFAULT_DESCRIPTION_TYPOGRAPHY,
  normalizeRichTextTypography,
  richTextTypographyStyle,
} from "@/lib/cms/rich-text-typography";

export function Accordion({ items }: { items: ProgramItem[] }) {
  const [openItems, setOpenItems] = useState<Set<number>>(() => new Set([0]));

  const toggle = (index: number) => {
    setOpenItems((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <div className="grid gap-2.5">
      {items.map((item, index) => {
        const open = openItems.has(index);
        const panelId = `course-panel-${index}`;
        const contentTypography = normalizeRichTextTypography(
          item.contentTypography ?? DEFAULT_DESCRIPTION_TYPOGRAPHY,
        );
        return (
          <div
            className="border border-[rgba(147,124,97,0.16)] rounded-[14px] bg-[#fffdf9] overflow-hidden"
            key={`${item.title}-${index}`}
          >
            <button
              className="w-full border-0 bg-transparent py-4.5 px-5 flex items-center justify-between gap-4.5 text-left text-[#544f49]! text-[16px]/[1.35] font-normal cursor-pointer [font-family:var(--font-menu)]"
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => toggle(index)}
            >
              <span>{item.title}</span>
              <span className="text-[22px] leading-none text-[#8e816f]" aria-hidden="true">
                {open ? "-" : "+"}
              </span>
            </button>
            <div
              id={panelId}
              hidden={!open}
            >
              <div className="course-accordion__content pb-4.5 px-5">
                <MarkdownContent
                  source={item.content}
                  className="course-accordion__copy"
                  style={richTextTypographyStyle(contentTypography)}
                />
                {item.points?.length ? (
                  <ul>
                    {item.points.map((point) => (
                      <li key={point}>{renderInlineMarkdown(point)}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
