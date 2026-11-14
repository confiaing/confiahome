import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { LEDE } from "@/components/ui/typography";
import type { Dictionary } from "@/i18n/dictionaries";
import { cx } from "@/lib/cx";

type JourneyOverviewProps = { journey: Dictionary["home"]["journey"] };

/**
 * Las cinco etapas, legibles sin interacción. Es la base del recorrido del lote L4,
 * que añadirá pestañas y escena sobre estos mismos paneles sin duplicar el contenido.
 */
export function JourneyOverview({ journey }: JourneyOverviewProps) {
  const { labels } = journey;
  return (
    <Section id="como" labelledBy="journey-title">
      <div className="mb-[clamp(32px,5vw,60px)] max-w-[820px]">
        <SectionHeading id="journey-title" eyebrow={journey.eyebrow} title={journey.title} />
        <p className={cx(LEDE, "mt-5")}>{journey.lede}</p>
      </div>
      <ol role="list" className="grid gap-4.5 lg:grid-cols-2 xl:grid-cols-3">
        {journey.stages.map((stage) => (
          <li key={stage.name} className="flex">
            <article className="w-full rounded-(--radius) border border-border bg-surface p-[clamp(22px,3vw,34px)]">
              <h3 className="font-display text-[clamp(1.7rem,3vw,2.3rem)] leading-[1.08] font-medium tracking-[-0.018em]">
                {stage.name}
              </h3>
              <p className="mt-2 font-mono text-[0.8125rem] tracking-[0.08em] text-emphasis uppercase">{stage.tag}</p>
              <dl className="mt-5">
                {(
                  [
                    [labels.does, stage.does],
                    [labels.gets, stage.gets],
                    [labels.next, stage.next],
                  ] as const
                ).map(([term, definition], index) => (
                  <div key={term} className="border-t border-border py-4">
                    <dt className="mb-1.5 font-mono text-[0.8125rem] tracking-[0.08em] text-text-muted uppercase">{term}</dt>
                    <dd
                      className={
                        index === 2
                          ? "font-display text-[1.3rem] leading-tight text-emphasis italic"
                          : "text-[1.04rem]"
                      }
                    >
                      {definition}
                    </dd>
                  </div>
                ))}
              </dl>
            </article>
          </li>
        ))}
      </ol>
    </Section>
  );
}
