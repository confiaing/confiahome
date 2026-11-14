import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { EYEBROW } from "@/components/ui/typography";
import type { Dictionary } from "@/i18n/dictionaries";
import { cx } from "@/lib/cx";

// Cada principio entra un poco más que el anterior; el del medio va en cursiva.
const PRINCIPLE = ["", "pl-[0.45em] font-normal text-emphasis italic", "pl-[0.9em]"];

export function Trust({ trust }: { trust: Dictionary["home"]["trust"] }) {
  return (
    <Section labelledBy="trust-title">
      <div className="grid gap-14 lg:grid-cols-2 lg:items-start lg:gap-22">
        <div>
          <SectionHeading id="trust-title" eyebrow={trust.eyebrow} title={trust.title} />
          <ul role="list" className="mt-7.5">
            {trust.items.map((item) => (
              <li
                key={item}
                className="relative border-t border-border py-5 pl-8.5 text-[1.1rem] leading-[1.45] before:absolute before:top-7.5 before:left-0.5 before:h-[5px] before:w-4 before:rounded-xs before:bg-primary"
              >
                {item}
              </li>
            ))}
          </ul>
          {/* La atribución va pegada a las evidencias: son del equipo, no de clientes de Confia.ing. */}
          <p className="mt-2 border-t border-border pt-4.5 text-[0.92rem] text-text-muted italic">{trust.note}</p>
        </div>
        <div>
          <h3 className={EYEBROW}>{trust.principlesTitle}</h3>
          <ul role="list" className="mt-3.5">
            {trust.principles.map((principle, index) => (
              <li
                key={principle}
                className={cx(
                  "py-2.5 font-display text-[clamp(2.6rem,7.5vw,5.4rem)] leading-none font-medium tracking-[-0.03em] [font-variation-settings:'opsz'_144]",
                  PRINCIPLE[index],
                )}
              >
                {principle}
              </li>
            ))}
          </ul>
          <p className="mt-7.5 max-w-[34em] rounded-r-(--radius-s) border-l-4 border-primary bg-surface px-6 py-5.5">
            <strong>{trust.securityLabel}</strong> {trust.security}
          </p>
        </div>
      </div>
    </Section>
  );
}
