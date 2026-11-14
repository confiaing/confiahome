import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { CARD_TITLE, EYEBROW, LEDE } from "@/components/ui/typography";
import type { Dictionary } from "@/i18n/dictionaries";
import { cx } from "@/lib/cx";

// Tailwind quita las viñetas, y Safari deja de anunciar como lista una lista sin ellas:
// por eso las listas de las secciones llevan role="list".
// Las tarjetas van ligeramente giradas, como notas sobre una mesa; al pasar el puntero
// se enderezan (solo si el visitante no pidió movimiento reducido).
const TILT = [
  "md:-rotate-[1.4deg] md:translate-y-1.5",
  "md:rotate-[1.1deg] md:-translate-y-2",
  "md:rotate-[0.8deg] md:-translate-x-1.5",
  "md:-rotate-1 md:translate-y-2.5",
];

const NUMBER =
  "before:font-mono before:tracking-[0.08em] before:text-emphasis before:content-['0'_counter(item)] [counter-increment:item]";

export function WhereWeStart({ start }: { start: Dictionary["home"]["start"] }) {
  return (
    <Section id="donde-empezamos" labelledBy="start-title" theme="fresh">
      <div className="grid gap-11 wide:grid-cols-[5fr_7fr] wide:items-start wide:gap-18">
        <div>
          <SectionHeading id="start-title" eyebrow={start.eyebrow} title={start.title} />
          <p className={cx(LEDE, "mt-5.5")}>{start.lede}</p>
        </div>
        <ol role="list" className="group grid gap-4 [counter-reset:item] md:grid-cols-2 md:gap-5.5">
          {start.frictions.map((friction, index) => (
            <li
              key={friction.title}
              className={cx(
                "rounded-(--radius) border border-border bg-background px-6 pt-6.5 pb-7 before:text-[0.8rem]",
                "transition-colors duration-300 hover:border-border-strong",
                "motion-safe:transition-[rotate,translate,border-color] motion-safe:duration-[450ms] motion-safe:group-hover:rotate-0 motion-safe:group-hover:translate-0",
                NUMBER,
                TILT[index],
              )}
            >
              <h3 className={cx(CARD_TITLE, "mt-3 mb-2.5")}>{friction.title}</h3>
              <p className="text-base text-text-muted">{friction.text}</p>
            </li>
          ))}
        </ol>
      </div>
      <div className="theme-warm mt-[clamp(56px,8vw,110px)] rounded-[calc(var(--radius)+8px)] p-[clamp(28px,5vw,64px)]">
        <h3 className={EYEBROW}>{start.questionsTitle}</h3>
        <ol role="list" className="mt-6.5 grid [counter-reset:item] nav:grid-cols-2 nav:gap-x-14">
          {start.questions.map((question) => (
            <li
              key={question}
              className={cx(
                "grid grid-cols-[auto_1fr] items-baseline gap-4.5 border-t border-border py-5",
                "font-display text-[clamp(1.3rem,2.5vw,1.95rem)] leading-[1.2] tracking-[-0.01em] italic",
                "before:text-[0.8125rem] before:not-italic",
                NUMBER,
              )}
            >
              {question}
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
