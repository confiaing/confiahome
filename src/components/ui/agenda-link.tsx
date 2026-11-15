import { ButtonLink } from "@/components/ui/button";
import { cx } from "@/lib/cx";
import { publicEnv } from "@/lib/public-env";

type AgendaLinkProps = {
  labels: { cta: string; newTab: string };
  size?: "md" | "sm";
  /** Añade una flecha decorativa, como en las acciones del hero y del cierre. */
  arrow?: boolean;
  className?: string;
};

/**
 * Acción «Agenda 30 minutos». Es el enlace directo al calendario, que funciona sin
 * JavaScript. Con él, `AgendaPanel` intercepta el clic (data-agenda) y carga el calendario
 * dentro de la página (ADR-0015).
 */
export function AgendaLink({ labels, size, arrow = false, className }: AgendaLinkProps) {
  return (
    <ButtonLink
      href={publicEnv.calendlyUrl}
      target="_blank"
      rel="noopener noreferrer"
      data-agenda=""
      size={size}
      className={cx("group", className)}
    >
      {labels.cta}
      <span className="sr-only"> ({labels.newTab})</span>
      {arrow ? (
        <span aria-hidden="true" className="transition-transform duration-200 motion-safe:group-hover:translate-x-1">
          →
        </span>
      ) : null}
    </ButtonLink>
  );
}
