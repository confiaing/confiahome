import {
  SYMBOL_DOT,
  SYMBOL_SEGMENTS,
  SYMBOL_SIZE,
  SYMBOL_STROKE_WIDTH,
} from "@/lib/brand-geometry";
import { cx } from "@/lib/cx";

type LogoProps = {
  /** Nombre accesible. Dentro de un enlace, di también adónde lleva. */
  label: string;
  variant?: "full" | "symbol";
  className?: string;
};

/**
 * Logo de Confia.ing: una «c» de cinco tramos —uno por etapa del recorrido—, el
 * punto que sigue en marcha y el nombre con la «IA» a la vista.
 * Su tamaño sigue al tamaño de letra del contenedor; sus colores, al tema.
 */
export function Logo({ label, variant = "full", className }: LogoProps) {
  return (
    <span role="img" aria-label={label} className={cx("inline-flex items-center gap-[0.42em] leading-none", className)}>
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox={`0 0 ${SYMBOL_SIZE} ${SYMBOL_SIZE}`}
        className="size-[1.3em] flex-none fill-none"
        strokeWidth={SYMBOL_STROKE_WIDTH}
      >
        {SYMBOL_SEGMENTS.map((d, index) => (
          <path
            key={d}
            d={d}
            data-segment={index + 1}
            className={index === SYMBOL_SEGMENTS.length - 1 ? "stroke-primary" : "stroke-current"}
          />
        ))}
        <circle data-dot cx={SYMBOL_DOT.cx} cy={SYMBOL_DOT.cy} r={SYMBOL_DOT.r} className="fill-primary stroke-none" />
      </svg>
      {variant === "full" ? (
        // El nombre de marca no se traduce: no sale de los diccionarios.
        <span
          aria-hidden="true"
          data-wordmark
          className="font-display font-[450] tracking-[-0.025em] [font-variation-settings:'opsz'_72]"
        >
          conf
          <span className="font-body text-[0.8em] font-bold tracking-[0.01em] text-emphasis">IA</span>
          <span className="text-emphasis">.</span>
          <em className="font-normal italic">ing</em>
        </span>
      ) : null}
    </span>
  );
}
