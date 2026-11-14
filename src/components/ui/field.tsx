import { useId } from "react";
import type { ComponentProps, ReactNode } from "react";
import { cx } from "@/lib/cx";

type Shared = {
  label: ReactNode;
  name: string;
  hint?: ReactNode;
  error?: ReactNode;
  /** Mensaje de confirmación; se ignora si hay error. */
  success?: ReactNode;
  className?: string;
};

type InputProps = Shared & { multiline?: false } & Omit<ComponentProps<"input">, "name" | "className">;
type TextareaProps = Shared & { multiline: true } & Omit<ComponentProps<"textarea">, "name" | "className">;

export type FieldProps = InputProps | TextareaProps;

const CONTROL =
  "w-full rounded-(--radius-s) border-[1.5px] border-border-strong bg-surface px-[15px] py-[13px] text-text " +
  "transition-colors duration-200 hover:border-text focus-visible:border-text focus-visible:outline-offset-2 " +
  "disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-border-strong " +
  "aria-invalid:border-2 aria-invalid:border-error";

/**
 * Campo de una línea o de texto largo, con su etiqueta, ayuda y mensaje de estado.
 * Los mensajes de error y de éxito necesitan un fondo sobre el que contrasten: el campo
 * se usa dentro de una tarjeta o en los temas base, oscuro y calma (docs/brand/README.md).
 */
export function Field(props: FieldProps) {
  const generatedId = useId();
  const { label, hint, error, success, className, ...rest } = props;
  const id = rest.id ?? generatedId;
  const status = error ? undefined : success;

  const describedBy =
    [
      rest["aria-describedby"],
      hint ? `${id}-hint` : null,
      error ? `${id}-error` : null,
      status ? `${id}-success` : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  const shared = {
    id,
    "aria-invalid": error ? (true as const) : undefined,
    "aria-describedby": describedBy,
  };

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-[7px] block text-[0.95rem] font-semibold text-text">
        {label}
      </label>
      {rest.multiline ? (
        <textarea className={cx(CONTROL, "min-h-30 resize-y")} {...controlProps(rest)} {...shared} />
      ) : (
        <input className={cx(CONTROL, "min-h-13")} {...controlProps(rest)} {...shared} />
      )}
      {hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-[0.9rem] text-text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-[0.9rem] font-semibold text-error">
          {error}
        </p>
      ) : null}
      {status ? (
        <p id={`${id}-success`} className="mt-1.5 text-[0.9rem] font-semibold text-success">
          {status}
        </p>
      ) : null}
    </div>
  );
}

/** `multiline` elige el elemento; no es un atributo del control. */
function controlProps<T extends { multiline?: boolean }>(props: T): Omit<T, "multiline"> {
  const copy = { ...props };
  delete copy.multiline;
  return copy;
}
