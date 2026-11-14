import { useId } from "react";
import type { ComponentProps, ReactNode } from "react";

type CheckboxProps = Omit<ComponentProps<"input">, "type" | "children" | "className"> & {
  name: string;
  /** La etiqueta; admite enlaces. */
  children: ReactNode;
  error?: ReactNode;
  className?: string;
};

/** Casilla nativa con su etiqueta. El mensaje de error sigue la misma regla de fondo que `Field`. */
export function Checkbox({ children, error, className, ...props }: CheckboxProps) {
  const generatedId = useId();
  const id = props.id ?? generatedId;
  const describedBy = [props["aria-describedby"], error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className={className}>
      <div className="grid grid-cols-[auto_1fr] items-start gap-3 text-[0.96rem]">
        <input
          type="checkbox"
          className="mt-0.5 size-6 accent-primary disabled:cursor-not-allowed disabled:opacity-45"
          {...props}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />
        <label htmlFor={id} className="text-text">
          {children}
        </label>
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-[0.9rem] font-semibold text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
