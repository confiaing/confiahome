import { AgendaLink } from "@/components/ui/agenda-link";
import { ButtonLink } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/dictionaries";

type ContactActionsProps = {
  actions: Dictionary["home"]["actions"];
  agenda: Dictionary["agenda"];
};

/**
 * Las dos vías de contacto de la home: agendar (principal) y consultar (secundaria).
 * Hero y cierre usan este mismo componente para que no puedan divergir.
 */
export function ContactActions({ actions, agenda }: ContactActionsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <AgendaLink labels={{ cta: actions.schedule, newTab: agenda.newTab }} arrow className="max-[479px]:w-full" />
      <ButtonLink href="#consulta" data-cta="contact" variant="secondary" className="max-[479px]:w-full">
        {actions.inquire}
      </ButtonLink>
    </div>
  );
}
