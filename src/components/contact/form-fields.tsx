import type { ReactNode } from "react";
import { Field } from "@/components/ui/field";
import type { ContactErrorCode, ContactErrors } from "@/domain/contact/errors";
import type { Dictionary } from "@/i18n/dictionaries";
import { cx } from "@/lib/cx";
import { LiveJson } from "./live-json";
import { TypedCommand } from "./typed-command";
import { FIELD_ID, type FormValues } from "./use-contact-form";
import { useTypedExamples } from "./use-typed-examples";

type Labels = Dictionary["contact"];
type TextField = "name" | "company" | "email" | "phone" | "message";

export type FieldsProps = {
  labels: Labels;
  values: FormValues;
  errors: ContactErrors;
  disabled: boolean;
  onChange(field: TextField, value: string): void;
};

const ERROR_KEY: Record<ContactErrorCode, keyof Labels["errors"]> = {
  required: "required",
  "too-long": "tooLong",
  "email-format": "emailFormat",
  "phone-format": "phoneFormat",
  "contact-required": "contactRequired",
  "consent-required": "consentRequired",
};

export const errorText = (labels: Labels, code: ContactErrorCode | undefined) => (code ? labels.errors[ERROR_KEY[code]] : undefined);

export const HINT_ID = "consulta-contacto-ayuda";
const errorId = (field: TextField) => `${FIELD_ID[field]}-error`;

/** Atributos propios de cada campo, iguales en los dos modos. */
const INPUT: Record<TextField, Record<string, string | boolean>> = {
  name: { type: "text", autoComplete: "name", required: true },
  company: { type: "text", autoComplete: "organization" },
  email: { type: "email", autoComplete: "email", inputMode: "email" },
  phone: { type: "tel", autoComplete: "tel", inputMode: "tel" },
  message: {},
};

/**
 * Qué describe a cada campo además de su propio error: la indicación «correo o
 * teléfono» a ambos, y el error de «falta un medio de contacto» (que se muestra en
 * el correo) también al teléfono.
 */
function describedBy(field: TextField, errors: ContactErrors): string | undefined {
  if (field !== "email" && field !== "phone") return undefined;
  const ids = [HINT_ID];
  if (field === "phone" && errors.email === "contact-required") ids.push(errorId("email"));
  return ids.join(" ");
}

// ---------------------------------------------------------------------------
// Modo clásico: campos convencionales y el panel consulta.json en vivo.
// ---------------------------------------------------------------------------
export function ClassicFields({ labels, values, errors, disabled, onChange }: FieldsProps) {
  const field = (name: TextField) => (
    <Field
      id={FIELD_ID[name]}
      name={name}
      label={labels.fields[name]}
      value={values[name]}
      error={errorText(labels, errors[name])}
      disabled={disabled}
      aria-describedby={describedBy(name, errors)}
      onChange={(event) => onChange(name, event.target.value)}
      {...INPUT[name]}
    />
  );
  return (
    <div className="grid gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        {field("name")}
        {field("company")}
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {field("email")}
        {field("phone")}
      </div>
      <p id={HINT_ID} className="-mt-2 text-[0.9rem] text-text-muted">
        {labels.contactHint}
      </p>
      <Field
        id={FIELD_ID.message}
        name="message"
        label={labels.fields.message}
        value={values.message}
        error={errorText(labels, errors.message)}
        disabled={disabled}
        multiline
        rows={4}
        onChange={(event) => onChange("message", event.target.value)}
      />
      <LiveJson values={values} labels={labels} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modo terminal: los mismos campos como líneas de una terminal.
// ---------------------------------------------------------------------------
const TERMINAL_CONTROL =
  "min-h-11 w-full min-w-0 border-0 border-b border-dashed border-border-strong bg-transparent px-1 py-2 font-mono text-[0.95rem] text-text " +
  "placeholder:text-text-muted focus-visible:border-solid focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "disabled:opacity-45 aria-invalid:border-solid aria-invalid:border-error";

type TerminalRowProps = { name: TextField; label: string; error?: string; stacked?: boolean; children: ReactNode };

/** Una línea de la terminal. `stacked`: la pregunta va encima de su respuesta, a todo el ancho. */
function TerminalRow({ name, label, error, stacked = false, children }: TerminalRowProps) {
  return (
    <div data-term-row data-stacked={stacked ? "" : undefined}>
      <div className={cx("grid items-baseline gap-x-3 gap-y-1", !stacked && "sm:grid-cols-[minmax(7.5rem,auto)_1fr]")}>
        {/* Las etiquetas cortas van en minúscula, como en una terminal; la pregunta, tal como se escribe («IA» nunca en minúscula). */}
        <label htmlFor={FIELD_ID[name]} className={cx("font-mono text-[0.9rem] text-text-muted", !stacked && "lowercase")}>
          <span aria-hidden="true" className="text-emphasis">
            ›{" "}
          </span>
          {label}
        </label>
        {children}
      </div>
      {error ? (
        <p id={errorId(name)} className="mt-1.5 font-mono text-[0.85rem] text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TerminalFields({ labels, values, errors, disabled, onChange }: FieldsProps) {
  const examples = useTypedExamples<HTMLTextAreaElement>(labels.examples, labels.examplePrefix);
  const control = (name: TextField) => {
    const error = errorText(labels, errors[name]);
    const described = [describedBy(name, errors), error ? errorId(name) : null].filter(Boolean).join(" ") || undefined;
    const shared = {
      id: FIELD_ID[name],
      name,
      value: values[name],
      disabled,
      "aria-invalid": error ? (true as const) : undefined,
      "aria-describedby": described,
      className: cx(TERMINAL_CONTROL, name === "message" && "resize-y"),
    };
    return (
      <TerminalRow key={name} name={name} label={labels.fields[name]} error={error} stacked={name === "message"}>
        {name === "message" ? (
          <textarea
            {...shared}
            ref={examples.target}
            rows={4}
            placeholder={examples.placeholder}
            onChange={(event) => onChange(name, event.target.value)}
          />
        ) : (
          <input {...shared} {...INPUT[name]} onChange={(event) => onChange(name, event.target.value)} />
        )}
      </TerminalRow>
    );
  };

  return (
    <div className="theme-dark overflow-hidden rounded-(--radius)">
      <p aria-hidden="true" className="flex items-center gap-1.5 border-b border-border px-4 py-2.5 font-mono text-[0.8125rem] text-text-muted">
        <span className="size-2.5 rounded-full bg-primary" />
        <span className="size-2.5 rounded-full bg-accent" />
        <span className="size-2.5 rounded-full bg-success" />
        <span className="ml-2">{labels.windowTitle}</span>
      </p>
      <div className="grid gap-4 px-4 py-5 sm:px-6">
        <p aria-hidden="true" className="font-mono text-[0.95rem]">
          <span className="text-emphasis">~ %</span> <TypedCommand text={labels.command} />
        </p>
        <p id={HINT_ID} className="font-mono text-[0.9rem] text-text-muted">
          {labels.intro}
        </p>
        {(["name", "company", "email", "phone", "message"] as const).map(control)}
      </div>
    </div>
  );
}
