import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { CONTACT_FIELDS, type ContactErrors, type ContactField } from "@/domain/contact/errors";
import { parseContact } from "@/domain/contact/schema";

export type FormMode = "terminal" | "classic";
export type FormValues = { name: string; company: string; email: string; phone: string; message: string; consent: boolean };
export type FormPhase = "idle" | "sending" | "sent";
/** Por qué no se pudo enviar. Cada uno tiene su mensaje en el diccionario. */
export type FormFailure = "unavailable" | "rateLimited" | "spam" | "network" | "verification";

/** `id` de cada control. Son los mismos en los dos modos: solo uno está montado a la vez. */
export const FIELD_ID: Record<ContactField, string> = {
  name: "consulta-nombre",
  company: "consulta-empresa",
  email: "consulta-correo",
  phone: "consulta-telefono",
  message: "consulta-mensaje",
  consent: "consulta-acepto",
};

const EMPTY: FormValues = { name: "", company: "", email: "", phone: "", message: "", consent: false };

const FAILURE_BY_STATUS: Record<number, FormFailure> = { 403: "spam", 429: "rateLimited" };

/** De dónde llegó la visita: parámetros utm_* y sitio de procedencia. No identifica a la persona. */
function attribution() {
  const params = new URLSearchParams(window.location.search);
  let referrerHost: string | undefined;
  try {
    const host = document.referrer ? new URL(document.referrer).host : "";
    referrerHost = host && host !== window.location.host ? host : undefined;
  } catch {
    referrerHost = undefined;
  }
  const pick = (name: string) => params.get(name)?.slice(0, 120) || undefined;
  return { utmSource: pick("utm_source"), utmMedium: pick("utm_medium"), utmCampaign: pick("utm_campaign"), referrerHost };
}

type Options = {
  locale: "es" | "en";
  /** Hay verificación antispam: sin su token el servidor rechazaría el envío. */
  needsToken: boolean;
  /** El token antispam; si aún no hay, espera a que llegue. Vacío = no llegó a tiempo. */
  getToken: () => Promise<string>;
};

/** Tiempo máximo de un envío: pasado este, se ofrece el correo. */
const SEND_TIMEOUT_MS = 20_000;

/** La lógica del formulario de consulta, común a sus dos presentaciones (ADR-0010). */
export function useContactForm({ locale, needsToken, getToken }: Options) {
  const [mode, setMode] = useState<FormMode>("terminal");
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<ContactErrors>({});
  const [phase, setPhase] = useState<FormPhase>("idle");
  const [failure, setFailure] = useState<FormFailure | null>(null);
  // Cada vez que cambia, el foco va al primer campo con error.
  const [focusRequest, setFocusRequest] = useState(0);
  // Envíos que llegaron al servidor sin éxito: el token antispam de cada uno ya no sirve.
  const [attempts, setAttempts] = useState(0);
  const sending = useRef(false);

  useEffect(() => {
    if (focusRequest === 0) return;
    const first = CONTACT_FIELDS.find((field) => errors[field]);
    if (first) document.getElementById(FIELD_ID[first])?.focus();
    // Solo al pedirlo: no cada vez que cambian los errores.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRequest]);

  const showErrors = (next: ContactErrors) => {
    setErrors(next);
    setFocusRequest((count) => count + 1);
  };

  const change = <Field extends keyof FormValues>(field: Field, value: FormValues[Field]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field] && !(current.email === "contact-required" && (field === "email" || field === "phone"))) return current;
      const next = { ...current };
      delete next[field];
      // «Correo o teléfono» se resuelve escribiendo en cualquiera de los dos.
      if ((field === "email" || field === "phone") && next.email === "contact-required") delete next.email;
      return next;
    });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (sending.current || phase === "sent") return;

    const draft = { ...values, locale, formMode: mode, website, turnstileToken: "", ...attribution() };
    const parsed = parseContact(draft);
    if (!parsed.ok) {
      showErrors(parsed.errors);
      return;
    }

    sending.current = true;
    setPhase("sending");
    setFailure(null);
    try {
      const turnstileToken = await getToken();
      if (needsToken && !turnstileToken) {
        // Sin token el servidor lo tomaría por un robot: mejor decirlo que gastar un intento.
        setPhase("idle");
        setFailure("verification");
        return;
      }
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, turnstileToken }),
        signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
      });
      if (response.status === 201) {
        setPhase("sent");
        return;
      }
      setPhase("idle");
      setAttempts((count) => count + 1);
      if (response.status === 422) {
        const body = (await response.json().catch(() => null)) as { codes?: ContactErrors } | null;
        if (body?.codes && Object.keys(body.codes).length > 0) {
          showErrors(body.codes);
          return;
        }
      }
      setFailure(FAILURE_BY_STATUS[response.status] ?? "unavailable");
    } catch {
      setPhase("idle");
      // La petición pudo llegar y gastar el token aunque la respuesta se perdiera.
      setAttempts((count) => count + 1);
      setFailure("network");
    } finally {
      sending.current = false;
    }
  };

  return { mode, setMode, values, change, website, setWebsite, errors, phase, failure, setFailure, submit, attempts };
}
