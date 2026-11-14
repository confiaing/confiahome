import type { ComponentProps, ElementType } from "react";
import { cx } from "@/lib/cx";

type Theme = "light" | "dark" | "fresh" | "coral" | "warm" | "calm";

// Las clases completas, para que Tailwind y la búsqueda de texto las encuentren.
const THEME_CLASS: Record<Theme, string> = {
  light: "theme-light",
  dark: "theme-dark",
  fresh: "theme-fresh",
  coral: "theme-coral",
  warm: "theme-warm",
  calm: "theme-calm",
};

type CardProps = Omit<ComponentProps<"div">, "className"> & {
  /** Elemento contenedor: div, section, article, li… */
  as?: ElementType;
  /** Fija un tema propio; sin él, la tarjeta es una superficie del tema que la contiene. */
  theme?: Theme;
  className?: string;
};

export function Card({ as: Tag = "div", theme, className, ...props }: CardProps) {
  return (
    <Tag
      className={cx(
        "rounded-[calc(var(--radius)+6px)] p-[clamp(24px,4vw,44px)]",
        // Un tema ya fija fondo y texto; sin tema, la tarjeta usa la superficie.
        theme ? THEME_CLASS[theme] : "bg-surface text-text",
        className,
      )}
      {...props}
    />
  );
}
