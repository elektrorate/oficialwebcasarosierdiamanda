import { MarkdownContent } from "@/components/ui/MarkdownContent";
import type {
  Faq,
  FaqGroup,
  PageFaqSection,
  PublicFaqBlock,
} from "@/lib/cms/types";

type Props = {
  block?: PublicFaqBlock | null;
  group?: FaqGroup | null;
  faqs?: Faq[];
  title?: string;
  pageSection?: PageFaqSection | null;
  eyebrow?: string;
  className?: string;
};

export default function PublicFaqSection({
  block,
  group,
  faqs,
  title,
  eyebrow = "FAQ",
  className,
}: Props) {
  const selectedGroup = block?.group ?? group ?? null;
  const items = block?.faqs ?? faqs ?? [];

  if (!items.length) return null;

  const groups = items.reduce<Record<string, Faq[]>>((acc, faq) => {
    const topic = faq.topic_title?.trim() || "General";
    acc[topic] = acc[topic] ?? [];
    acc[topic].push(faq);
    return acc;
  }, {});

  const topicEntries = Object.entries(groups);

  const sectionClassName = ["public-faq", "section", className]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={sectionClassName} aria-labelledby="public-faq-title">
      <div className="public-faq__container container mx-auto grid max-w-245 grid-cols-[minmax(0,0.38fr)_minmax(0,0.62fr)] gap-12 px-4 max-[760px]:grid-cols-1 max-[760px]:gap-6">
        <div className="public-faq__head min-w-0">
          <p className="mb-2.5 text-xs font-bold uppercase tracking-normal text-[#8b6f4d]">
            {eyebrow}
          </p>

          <h2
            id="public-faq-title"
            className="m-0 max-w-[14ch] [font-family:var(--font-display),Georgia,serif] text-[62px]! max-[1024px]:text-[52px]! font-normal leading-none text-[#332c24] max-[760px]:max-w-full max-[760px]:text-[34px]!"
          >
            {title || selectedGroup?.title || "Preguntas frecuentes"}
          </h2>

          {selectedGroup?.description ? (
            <div className="public-faq__description mt-4 max-w-[32ch] text-[16px] leading-[1.55] text-[#6c5e51]">
              {selectedGroup.description}
            </div>
          ) : null}
        </div>

        <div className="public-faq__topics grid min-w-0 gap-7">
          {topicEntries.map(([topic, topicFaqs]) => (
            <div className="public-faq__topic" key={topic}>
              <h3 className="m-0 mb-3 text-[20px] font-bold leading-[1.2] text-[#6d583e]">
                {topic}
              </h3>

              <div className="public-faq__list grid border-t border-[rgba(67,55,43,0.2)]">
                {topicFaqs.map((faq) => (
                  <details
                    className="public-faq__item border-b border-[rgba(67,55,43,0.2)]"
                    key={faq.id}
                  >
                    <summary className="public-faq__summary flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 text-[20px] font-semibold leading-tight text-[#332c24] max-[760px]:min-h-14"
                    >
                      {faq.question}
                    </summary>

                    <MarkdownContent
                      className="public-faq__answer max-w-[64ch] pb-6 pr-10 text-[16px] leading-[1.65] text-[#5d5145] max-[760px]:pr-7"
                      source={faq.answer || ""}
                    />
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}