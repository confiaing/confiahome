import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

type Tone = "error" | "success" | "info";

const TONE_CLASS: Record<Tone, string> = {
  error: "border-error text-error",
  success: "border-success text-success",
  info: "border-border-strong text-text",
};

// El icono refuerza el tipo sin depender del color; el texto del aviso lo dice todo.
const ICON: Record<Tone, ReactNode> = {
  error: <path d="M12 7.5v6M12 16.6v.4" />,
  success: <path d="m7.6 12.4 3 3 5.8-6.3" />,
  info: <path d="M12 11v6M12 7.4v.4" />,
};

type NoticeProps = {
  tone: Tone;
  children: ReactNode;
  /** `false` para un aviso fijo de la página, que no debe anunciarse como novedad. */
  live?: boolean;
  className?: string;
};

/**
 * Aviso de error (role="alert") o de éxito e información (role="status").
 * Para que un lector de pantalla anuncie un aviso que aparece tras una acción, su
 * contenedor debe estar ya en la página y recibir el texto después: lo resuelve
 * quien lo usa (el formulario, en el lote L5).
 */
export function Notice({ tone, children, live = true, className }: NoticeProps) {
  return (
    <div
      role={live ? (tone === "error" ? "alert" : "status") : undefined}
      className={cx(
        "flex items-start gap-3 rounded-(--radius-s) border-2 bg-surface px-4 py-3.5 font-semibold",
        TONE_CLASS[tone],
        className,
      )}
    >
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 24 24"
        className="mt-0.5 size-6 flex-none fill-none stroke-current"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9.25" />
        {ICON[tone]}
      </svg>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
