import type { ComponentProps } from "react";
import { cx } from "@/lib/cx";

type Base = Omit<ComponentProps<"a">, "target" | "rel"> & { href: string };

type TextLinkProps =
  | (Base & { external?: false; externalLabel?: never })
  | (Base & {
      /** Abre en otra pestaña. */
      external: true;
      /** Aviso para lectores de pantalla, por ejemplo «se abre en una pestaña nueva». */
      externalLabel: string;
    });

export function TextLink({ external = false, externalLabel, className, children, ...props }: TextLinkProps) {
  return (
    <a
      className={cx(
        "text-link underline decoration-[1.5px] underline-offset-[0.2em] hover:decoration-[2.5px]",
        className,
      )}
      {...props}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
      {external ? <span className="sr-only"> ({externalLabel})</span> : null}
    </a>
  );
}
