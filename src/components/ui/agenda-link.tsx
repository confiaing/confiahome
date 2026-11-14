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
 * JavaScript; el lote L6 lo mejora (data-agenda) para abrirlo dentro de la página.
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
