"use client";

import { useEffect, useRef, useState } from "react";
import type { FocusEvent, MouseEvent, ReactNode } from "react";
import { NAV_ID, NAV_TOGGLE_ID, NAV_WIDE_QUERY } from "@/components/ui/nav-ids";
import { cx } from "@/lib/cx";

type NavDisclosureProps = {
  menuLabel: string;
  navLabel: string;
  /** Los enlaces, ya renderizados en el servidor. */
  children: ReactNode;
};

/**
 * Navegación principal. Desde el ancho `nav` se muestra en línea; por debajo se pliega
 * tras un botón. Escape la cierra y devuelve el foco al botón; elegir un enlace la cierra.
 */
export function NavDisclosure({ menuLabel, navLabel, children }: NavDisclosureProps) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Al ensanchar la ventana (o girar el móvil) la navegación pasa a estar en línea:
  // el estado «abierto» deja de tener sentido y se descarta.
  useEffect(() => {
    if (!open || typeof window.matchMedia !== "function") return;
    const wide = window.matchMedia(NAV_WIDE_QUERY);
    const onChange = () => setOpen(false);
    wide.addEventListener("change", onChange);
    return () => wide.removeEventListener("change", onChange);
  }, [open]);

  // Si el foco sale del menú hacia el resto de la página, se cierra: abierto taparía
  // lo que el visitante está enfocando. Un clic en un sitio no enfocable no lo cierra.
  const closeOnFocusOut = (event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget;
    if (open && next instanceof Node && !event.currentTarget.contains(next)) setOpen(false);
  };

  const closeOnLink = (event: MouseEvent<HTMLElement>) => {
    if ((event.target as Element).closest("a")) setOpen(false);
  };

  return (
    // display: contents: el envoltorio agrupa botón y navegación para vigilar el foco
    // sin alterar la disposición de la cabecera.
    <div className="contents" onBlur={closeOnFocusOut}>
      <button
        ref={button}
        id={NAV_TOGGLE_ID}
        type="button"
        aria-expanded={open}
        aria-controls={NAV_ID}
        aria-label={menuLabel}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex size-12 items-center justify-center rounded-full border-[1.5px] border-border-strong bg-transparent text-text nav:hidden"
      >
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 24 24"
          className="size-[22px] fill-none stroke-current"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d={open ? "M6 6l12 12M18 6L6 18" : "M4 8h16M4 16h16"} />
        </svg>
      </button>
      <nav
        id={NAV_ID}
        aria-label={navLabel}
        data-open={open}
        onClick={closeOnLink}
        className={cx(
          // Plegada lleva display: none, que también la saca del orden de foco.
          open ? "flex" : "hidden",
          "absolute inset-x-0 top-full flex-col gap-1.5 border-b border-border bg-background px-(--gutter) pt-4.5 pb-6.5",
          "nav:static nav:flex nav:flex-row nav:items-center nav:gap-7 nav:border-0 nav:bg-transparent nav:p-0",
        )}
      >
        {children}
      </nav>
    </div>
  );
}
