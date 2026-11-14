import { ContactActions } from "@/components/sections/contact-actions";
import { SceneSlot } from "@/components/journey/scene/scene-slot";
import { AgendaLink } from "@/components/ui/agenda-link";
import { Card } from "@/components/ui/card";
import { Emphasized } from "@/components/ui/emphasized";
import { Section } from "@/components/ui/section";
import { TextLink } from "@/components/ui/text-link";
import { DISPLAY } from "@/components/ui/typography";
import type { Dictionary } from "@/i18n/dictionaries";
import { CONTACT_EMAIL, CONTACT_MAILTO } from "@/lib/contact";
import { cx } from "@/lib/cx";

type ClosingProps = { home: Dictionary["home"]; agenda: Dictionary["agenda"] };

const BLOCK_TITLE = "font-display text-[clamp(1.6rem,2.6vw,2.1rem)] leading-[1.1] font-medium tracking-[-0.015em]";
// Destinos de ancla. La cabecera ya la descuenta scroll-padding-top (globals.css);
// esto solo añade un pequeño respiro sobre la tarjeta.
const ANCHOR = "scroll-mt-1";

export function Closing({ home, agenda }: ClosingProps) {
  const { closing, actions } = home;
  return (
    <Section labelledBy="closing-title" theme="calm" className="mb-[clamp(8px,1.6vw,24px)] pb-[clamp(64px,8vw,120px)]">
      {/* El final del camino: completo, con lo andado marcado. */}
      <SceneSlot kind="closing" className="relative -mx-(--gutter) -mt-[clamp(40px,6vw,90px)] h-[clamp(230px,34vw,440px)]" />
      <div className="mt-[clamp(8px,2vw,28px)] max-w-[1000px]">
        <h2 id="closing-title" className={cx(DISPLAY, "text-[clamp(2.4rem,6.6vw,5.4rem)]")}>
          <Emphasized text={closing.title} tone="plain" />
        </h2>
        <div className="mt-8.5">
          <ContactActions actions={actions} agenda={agenda} />
        </div>
      </div>

      <div className="mt-[clamp(48px,7vw,96px)] grid items-start gap-6 lg:grid-cols-[1.15fr_1fr] lg:gap-8">
        {/* Vía B. El lote L5 pone aquí el formulario; el correo se queda como alternativa. */}
        <Card id="consulta" theme="light" className={ANCHOR}>
          <h3 className={BLOCK_TITLE}>{actions.inquire}</h3>
          <p className="mt-4 text-text-muted">{closing.inquiryText}</p>
          <p className="mt-2 font-display text-[clamp(1.3rem,3vw,1.9rem)] italic">
            <TextLink href={CONTACT_MAILTO}>{CONTACT_EMAIL}</TextLink>
          </p>
        </Card>
        {/* Vía A. El lote L6 carga aquí el calendario; el enlace directo se queda como alternativa. */}
        <Card id="agenda" theme="light" className={ANCHOR}>
          <h3 className={BLOCK_TITLE}>{actions.schedule}</h3>
          <p className="mt-4 text-text-muted">{actions.note}</p>
          <div className="mt-6">
            <AgendaLink labels={agenda} />
          </div>
        </Card>
      </div>
    </Section>
  );
}
