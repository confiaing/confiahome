import { ContactActions } from "@/components/sections/contact-actions";
import { Emphasized } from "@/components/ui/emphasized";
import { DISPLAY, EYEBROW, LEDE, WRAP } from "@/components/ui/typography";
import type { Dictionary } from "@/i18n/dictionaries";
import { cx } from "@/lib/cx";

type HeroProps = { home: Dictionary["home"]; agenda: Dictionary["agenda"] };

// Cada pilar sube un peldaño: el mismo motivo del camino que usa el resto de la marca.
const PILLAR_STEP = ["", "before:-translate-y-[3px]", "before:-translate-y-[6px]"];

export function Hero({ home, agenda }: HeroProps) {
  const { hero, actions } = home;
  return (
    // No usa Section: su relleno es distinto y el título es el h1 de la página.
    <section aria-labelledby="hero-title" className="pt-[clamp(36px,6vw,84px)] pb-[clamp(56px,8vw,110px)]">
      <div className={WRAP}>
        {/* La mitad derecha queda libre: es la posición de la escena del lote L4. */}
        <div className="max-w-[780px]">
          <p className={EYEBROW}>{hero.eyebrow}</p>
          <h1 id="hero-title" className={cx(DISPLAY, "mt-5 text-[clamp(2.55rem,7.4vw,5.5rem)]")}>
            <Emphasized text={hero.title} />
          </h1>
          <p className={cx(LEDE, "mt-6.5")}>{hero.lede}</p>
          <div className="mt-8.5">
            <ContactActions actions={actions} agenda={agenda} />
          </div>
          <p className="mt-4 text-[0.95rem] text-text-muted">{actions.note}</p>
          <ul
            role="list"
            aria-label={hero.pillarsLabel}
            className="mt-11 flex flex-wrap gap-x-6.5 gap-y-2 border-t border-border pt-5.5 font-mono text-[0.84rem] tracking-[0.08em] uppercase"
          >
            {hero.pillars.map((pillar, index) => (
              <li
                key={pillar}
                className={cx(
                  "flex items-center gap-2.5 before:h-[5px] before:w-3.5 before:rounded-xs before:bg-primary",
                  PILLAR_STEP[index],
                )}
              >
                {pillar}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
