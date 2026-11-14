"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { ClassicFields, TerminalFields, errorText } from "@/components/contact/form-fields";
import { Turnstile } from "@/components/contact/turnstile";
import { FIELD_ID, useContactForm, type FormMode } from "@/components/contact/use-contact-form";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { TextLink } from "@/components/ui/text-link";
import type { Dictionary } from "@/i18n/dictionaries";
import { CONTACT_EMAIL, CONTACT_MAILTO } from "@/lib/contact";
import { cx } from "@/lib/cx";

type ContactFormProps = {
  labels: Dictionary["contact"];
  locale: "es" | "en";
  /** Ruta de la política de privacidad en el idioma activo. */
  privacyHref: string;
  /** Clave pública de Turnstile; null en desarrollo y pruebas. */
  siteKey: string | null;
};

/** Cuánto se espera al token antispam antes de ofrecer el correo. */
const TOKEN_WAIT_MS = 15_000;

const noSubscription = () => () => {};

const MODES: FormMode[] = ["terminal", "classic"];
const MODE_OPTION = "inline-flex min-h-11 items-center justify-center rounded-full px-4 text-[0.95rem] font-semibold transition-colors duration-200";

/**
 * Formulario de consulta (Flujo B), en dos modos sobre los mismos datos (ADR-0010).
 * Un solo <form>, un solo estado y un solo esquema: los modos solo cambian cómo se ven
 * los campos, así que cambiar de modo no pierde nada de lo escrito.
 */
export function ContactForm({ labels, locale, privacyHref, siteKey }: ContactFormProps) {
  const token = useRef("");
  const waiting = useRef<((value: string) => void)[]>([]);
  const receiveToken = (value: string) => {
    token.current = value;
    if (value) for (const resolve of waiting.current.splice(0)) resolve(value);
  };
  // El widget antispam se carga al acercarse el formulario y puede tardar: quien envía antes espera.
  const getToken = () =>
    !siteKey || token.current
      ? Promise.resolve(token.current)
      : new Promise<string>((resolve) => {
          waiting.current.push(resolve);
          window.setTimeout(() => resolve(""), TOKEN_WAIT_MS);
        });
  const form = useContactForm({ locale, needsToken: siteKey !== null, getToken });
  const { mode, values, errors, phase } = form;
  const sending = phase === "sending";
  const sent = phase === "sent";
  const status = useRef<HTMLParagraphElement>(null);
  // Hasta que el formulario responde a los scripts no se puede enviar: un envío nativo
  // recargaría la página con lo escrito. `method="post"` evita además que acabe en la URL.
  const hydrated = useSyncExternalStore(noSubscription, () => true, () => false);

  // La confirmación sustituye al formulario: el foco va a ella para que no se pierda.
  useEffect(() => {
    if (sent) status.current?.focus();
  }, [sent]);
  const consentError = errorText(labels, errors.consent);
  const Fields = mode === "terminal" ? TerminalFields : ClassicFields;

  return (
    <div data-contact-form className="mt-5">
      {sent ? null : (
        <>
          <div role="group" aria-label={labels.modeLabel} className="inline-flex gap-0.5 rounded-full border-[1.5px] border-border-strong p-[3px]">
            {MODES.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={mode === option}
                onClick={() => form.setMode(option)}
                className={cx(MODE_OPTION, mode === option ? "bg-text text-background" : "text-text hover:bg-surface-strong")}
              >
                {labels[option]}
              </button>
            ))}
          </div>
          <p className="mt-3 text-[0.95rem] text-text-muted">{mode === "terminal" ? labels.terminalNote : labels.classicNote}</p>

          <form
            noValidate
            method="post"
            aria-label={mode === "terminal" ? labels.terminalFormLabel : labels.classicFormLabel}
            onSubmit={form.submit}
            className="mt-5 grid gap-5"
          >
            <Fields labels={labels} values={values} errors={errors} disabled={sending} onChange={form.change} />

            {/* Campo trampa (ADR-0006): las personas no lo ven ni lo alcanzan; un robot lo rellena. */}
            {/* Nombre y etiqueta sin significado, para que ningún autorrelleno lo reconozca. */}
            <div aria-hidden="true" data-trap className="sr-only">
              <label>
                Ref
                <input
                  type="text"
                  name="cf_ref_code"
                  tabIndex={-1}
                  autoComplete="off"
                  data-1p-ignore=""
                  data-lpignore="true"
                  data-form-type="other"
                  value={form.website}
                  onChange={(event) => form.setWebsite(event.target.value)}
                />
              </label>
            </div>

            <div>
              <div className="grid grid-cols-[auto_1fr] items-start gap-3 text-[0.96rem]">
                <input
                  id={FIELD_ID.consent}
                  type="checkbox"
                  name="consent"
                  required
                  checked={values.consent}
                  disabled={sending}
                  aria-invalid={consentError ? true : undefined}
                  aria-describedby={consentError ? `${FIELD_ID.consent}-error` : undefined}
                  onChange={(event) => form.change("consent", event.target.checked)}
                  className="mt-0.5 size-6 accent-primary disabled:opacity-45"
                />
                <label htmlFor={FIELD_ID.consent}>
                  {labels.consentBefore} <TextLink href={privacyHref}>{labels.consentLink}</TextLink>.
                </label>
              </div>
              {consentError ? (
                <p id={`${FIELD_ID.consent}-error`} className="mt-1.5 text-[0.9rem] font-semibold text-error">
                  {consentError}
                </p>
              ) : null}
            </div>

            <Turnstile siteKey={siteKey} resetKey={form.attempts} onToken={receiveToken} onError={() => form.setFailure("verification")} />

            <div>
              <Button type="submit" disabled={sending || !hydrated} aria-busy={sending || undefined}>
                {sending ? labels.sending : labels.submit}
              </Button>
            </div>

            {form.failure ? (
              <Notice tone="error">
                {labels.failures[form.failure]} <TextLink href={CONTACT_MAILTO}>{CONTACT_EMAIL}</TextLink>.
              </Notice>
            ) : null}
          </form>
        </>
      )}

      {/* La región existe desde el principio: así el lector de pantalla anuncia la confirmación cuando llega. */}
      <p
        ref={status}
        role="status"
        tabIndex={-1}
        className={cx(
          "focus-visible:outline-none",
          sent && "flex items-start gap-3 rounded-(--radius-s) border-2 border-success bg-surface px-4 py-3.5 font-semibold text-success",
        )}
      >
        {sent ? (
          <>
            <svg
              aria-hidden="true"
              focusable="false"
              viewBox="0 0 24 24"
              className="mt-0.5 size-6 flex-none fill-none stroke-current"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 12.5l5 5L20 6.5" />
            </svg>
            <span>{labels.success}</span>
          </>
        ) : null}
      </p>
    </div>
  );
}
