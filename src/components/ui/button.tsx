import type { ComponentProps } from "react";
import { cx } from "@/lib/cx";

type Variant = "primary" | "secondary";
type Size = "md" | "sm";

type Appearance = { variant?: Variant; size?: Size };

const BASE =
  "inline-flex items-center justify-center gap-[0.6em] rounded-full border-[1.5px] text-center font-semibold leading-tight no-underline " +
  "transition-colors duration-200 motion-safe:active:translate-y-px " +
  "disabled:cursor-not-allowed disabled:opacity-45";

const VARIANTS: Record<Variant, string> = {
  primary: "border-transparent bg-primary text-on-primary hover:bg-primary-hover disabled:hover:bg-primary",
  secondary: "border-text bg-transparent text-text hover:bg-text hover:text-background disabled:hover:bg-transparent disabled:hover:text-text",
};

// 52 px y 44 px: el reducido sigue cumpliendo el mínimo táctil.
const SIZES: Record<Size, string> = {
  md: "min-h-13 px-6.5 py-3.5 text-base",
  sm: "min-h-11 px-5 py-2.5 text-[0.95rem]",
};

function buttonClasses({ variant = "primary", size = "md" }: Appearance, className?: string): string {
  return cx(BASE, VARIANTS[variant], SIZES[size], className);
}

type ButtonProps = Appearance & ComponentProps<"button">;

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses({ variant, size }, className)} {...props} />;
}

type ButtonLinkProps = Appearance & ComponentProps<"a"> & { href: string };

/** La misma apariencia para una acción que navega. Un enlace no se deshabilita: si no procede, no se muestra. */
export function ButtonLink({ variant, size, className, ...props }: ButtonLinkProps) {
  return <a className={buttonClasses({ variant, size }, className)} {...props} />;
}
