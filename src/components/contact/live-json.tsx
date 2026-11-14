import type { Dictionary } from "@/i18n/dictionaries";
import { cx } from "@/lib/cx";
import type { FormValues } from "./use-contact-form";

type LiveJsonProps = { values: FormValues; labels: Dictionary["contact"] };

/**
 * Panel «consulta.json»: la consulta escrita como JSON mientras el visitante teclea.
 * Es decorativo (aria-hidden): repite lo que ya está en los campos.
 * Lo escrito se pinta siempre como texto —nodos de texto de React, nunca innerHTML—,
 * así que nada de lo que escriba el visitante se interpreta como marcado.
 */
export function LiveJson({ values, labels }: LiveJsonProps) {
  const entries: [string, string | boolean][] = [
    ["name", values.name],
    ["company", values.company],
    ["email", values.email],
    ["phone", values.phone],
    ["message", values.message],
    ["consent", values.consent],
  ];
  const ready = [
    [labels.ready.name, values.name.trim() !== ""],
    [labels.ready.contact, values.email.trim() !== "" || values.phone.trim() !== ""],
    [labels.ready.consent, values.consent],
  ] as const;

  return (
    <aside data-live-json aria-hidden="true" className="theme-dark overflow-hidden rounded-(--radius) text-[0.84rem]">
      <p className="border-b border-border px-4 py-2.5 font-mono text-[0.8125rem] text-text-muted">{labels.jsonTitle}</p>
      <pre className="overflow-x-auto px-4 py-3.5 font-mono leading-relaxed whitespace-pre-wrap">
        <code>
          {"{\n"}
          {entries.map(([key, value], index) => (
            <span key={key}>
              {"  "}
              <span className="text-text-muted">{JSON.stringify(key)}</span>
              {": "}
              <span className={value === "" || value === false ? "text-text-muted" : "text-link"}>{JSON.stringify(value)}</span>
              {index < entries.length - 1 ? ",\n" : "\n"}
            </span>
          ))}
          {"}"}
        </code>
      </pre>
      <p className="flex flex-wrap gap-2 border-t border-border px-4 py-3 font-mono text-[0.8125rem]">
        {ready.map(([label, done]) => (
          <span
            key={label}
            className={cx("rounded-full border px-2.5 py-0.5", done ? "border-success text-success" : "border-border text-text-muted")}
          >
            {label}
          </span>
        ))}
      </p>
    </aside>
  );
}
