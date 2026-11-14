import { ButtonLink } from "@/components/ui/button";
import { publicEnv } from "@/lib/public-env";

type AgendaLinkProps = {
  labels: { cta: string; newTab: string };
  size?: "md" | "sm";
  className?: string;
};

/**
 * Acción «Agenda 30 minutos». Es el enlace directo al calendario, que funciona sin
 * JavaScript; el lote L6 lo mejora (data-agenda) para abrirlo dentro de la página.
 */
export function AgendaLink({ labels, size, className }: AgendaLinkProps) {
  return (
    <ButtonLink
      href={publicEnv.calendlyUrl}
      target="_blank"
      rel="noopener noreferrer"
      data-agenda=""
      size={size}
      className={className}
    >
      {labels.cta}
      <span className="sr-only"> ({labels.newTab})</span>
    </ButtonLink>
  );
}
