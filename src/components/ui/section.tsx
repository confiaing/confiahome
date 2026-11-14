import type { ReactNode } from "react";
import { WRAP } from "@/components/ui/typography";
import { cx } from "@/lib/cx";

type BandTheme = "fresh" | "coral" | "calm";

// Las clases completas, para que Tailwind y la búsqueda de texto las encuentren.
const THEME_CLASS: Record<BandTheme, string> = {
  fresh: "theme-fresh",
  coral: "theme-coral",
  calm: "theme-calm",
};

type SectionProps = {
  /** `id` del título que nombra la región. */
  labelledBy: string;
  /** Destino de ancla. */
  id?: string;
  /** Con tema, la sección es una banda de color: no toca los bordes y lleva esquinas suaves. */
  theme?: BandTheme;
  className?: string;
  children: ReactNode;
};

/**
 * Sección de la home. El ritmo de la página alterna secciones sobre crema (sin tema)
 * y bandas de color (docs/brand/README.md).
 */
export function Section({ labelledBy, id, theme, className, children }: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      data-band={theme}
      className={cx(
        // Sin scroll-margin: globals.css ya reserva la altura de la cabecera con scroll-padding-top.
        "py-[clamp(72px,10vw,150px)]",
        theme && THEME_CLASS[theme],
        theme && "mx-[clamp(8px,1.6vw,24px)] overflow-clip rounded-(--radius-band)",
        className,
      )}
    >
      <div className={WRAP}>{children}</div>
    </section>
  );
}
