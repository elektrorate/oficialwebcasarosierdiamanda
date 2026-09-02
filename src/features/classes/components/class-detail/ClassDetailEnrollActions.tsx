"use client";

const OUTLINE_BTN = "class-detail__button class-detail__button--outline box-content w-fit max-w-full min-h-0 mt-0 py-[11px] px-[26px] inline-flex items-center justify-center border border-[rgba(74,70,64,0.55)] rounded-none bg-transparent text-[#6b6560] [font-family:var(--font-menu)] text-[15px] font-normal not-italic leading-none tracking-[0.03em] text-center no-underline normal-case cursor-pointer transition-[border-color,background-color,color] duration-200 hover:border-[rgba(46,43,40,0.75)] hover:bg-[rgba(255,255,255,0.6)] hover:text-[#4a4640] focus-visible:outline-2 focus-visible:outline-[rgba(74,70,64,0.28)] focus-visible:outline-offset-3";

type Props = {
  consultHref?: string;
  consultLabel: string;
  enrollHref?: string;
  enrollLabel?: string;
  showEnroll?: boolean;
};

export function ClassDetailEnrollActions({
  consultHref,
  consultLabel,
  enrollHref,
  enrollLabel = "Inscribirse",
  showEnroll = false,
}: Props) {
  if (!consultHref && !(showEnroll && enrollHref)) return null;

  return (
    <div className="class-detail__actions flex flex-col items-start gap-3 w-full mt-[clamp(18px,2.5vw,24px)] mb-[clamp(36px,4.5vw,48px)] max-[640px]:pl-[clamp(28px,18vw,112px)]">
      {consultHref ? (
        <a
          className={OUTLINE_BTN}
          href={consultHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          {consultLabel}
        </a>
      ) : null}
      {showEnroll && enrollHref ? (
        <a
          className={OUTLINE_BTN}
          href={enrollHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          {enrollLabel}
        </a>
      ) : null}
    </div>
  );
}
