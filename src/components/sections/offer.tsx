import { Emphasized } from "@/components/ui/emphasized";
import { Section } from "@/components/ui/section";
import { CARD_TITLE, DISPLAY } from "@/components/ui/typography";
import type { Dictionary } from "@/i18n/dictionaries";
import { cx } from "@/lib/cx";

export function Offer({ offer }: { offer: Dictionary["home"]["offer"] }) {
  return (
    <Section labelledBy="offer-title" theme="coral">
      <h2 id="offer-title" className={cx(DISPLAY, "mb-[clamp(28px,4vw,52px)] text-[clamp(2.1rem,4.6vw,3.9rem)]")}>
        {offer.title}
      </h2>

      {/* El servicio principal domina: tarjeta propia, oscura y con el título más grande de la sección. */}
      <article
        data-offer="main"
        className="theme-dark relative grid gap-7 overflow-hidden rounded-[calc(var(--radius)+10px)] p-[clamp(30px,6vw,80px)] max-md:pb-[150px]"
      >
        <h3 className="relative z-1 font-display text-[clamp(2.5rem,7vw,5.6rem)] leading-[0.98] font-medium tracking-[-0.03em] [font-variation-settings:'opsz'_144]">
          <Emphasized text={offer.main.title} />
        </h3>
        <p className="relative z-1 max-w-[30em] text-[clamp(1.12rem,1.7vw,1.42rem)] leading-[1.45] text-text-muted">
          {offer.main.text}
        </p>
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 220 120"
          className="pointer-events-none absolute -right-2.5 -bottom-1.5 w-[72%] opacity-95 md:w-[min(46%,440px)]"
        >
          <g className="fill-surface-strong">
            <rect x="0" y="96" width="40" height="24" rx="3" />
            <rect x="45" y="78" width="40" height="42" rx="3" />
            <rect x="90" y="60" width="40" height="60" rx="3" />
            <rect x="135" y="42" width="40" height="78" rx="3" />
          </g>
          <rect className="fill-primary" x="180" y="24" width="40" height="96" rx="3" />
          <circle className="fill-accent" cx="192" cy="13" r="7" />
          <circle className="fill-primary" cx="208" cy="13" r="7" />
        </svg>
      </article>

      <ul role="list" className="mt-4 grid gap-4 sm:max-wide:grid-cols-2 wide:mt-5 wide:grid-cols-4 wide:gap-5">
        {offer.rest.map((service) => (
          <li key={service.title} className="flex">
            <article className="w-full rounded-(--radius) border border-border bg-surface px-6 pt-6 pb-7">
              <h3 className={cx(CARD_TITLE, "mb-2.5")}>{service.title}</h3>
              <p className="text-base text-text-muted">{service.text}</p>
            </article>
          </li>
        ))}
      </ul>
    </Section>
  );
}
