import * as z from "zod/mini";
import { CONTACT_ERROR_CODES, CONTACT_FIELDS, type ContactErrorCode, type ContactErrors, type ContactField } from "./errors.ts";

// Esquema único de una consulta. Lo usan el formulario (navegador) y la API (servidor):
// las reglas no pueden divergir. Se importa de zod/mini para que pese poco en el cliente.

export const CONTACT_LIMITS = { name: 120, company: 160, email: 254, phone: 32, message: 2000 } as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const digits = (value: string) => value.replace(/\D/g, "").length;

/** Texto opcional: recortado, con longitud máxima. Vacío equivale a ausente. */
const text = (max: number) => z.optional(z.string().check(z.trim(), z.maxLength(max, "too-long")));
/** Dato técnico opcional (atribución, control): si no encaja, la petición está mal formada. */
const technical = (max: number) => z.optional(z.string().check(z.trim(), z.maxLength(max)));

const schema = z
  .object({
    name: z.string("required").check(z.trim(), z.minLength(1, "required"), z.maxLength(CONTACT_LIMITS.name, "too-long")),
    company: text(CONTACT_LIMITS.company),
    email: z.optional(
      z.string().check(
        z.trim(),
        z.maxLength(CONTACT_LIMITS.email, "too-long"),
        z.refine((value) => value === "" || EMAIL.test(value), "email-format"),
      ),
    ),
    phone: z.optional(
      z.string().check(
        z.trim(),
        z.maxLength(CONTACT_LIMITS.phone, "too-long"),
        z.refine((value) => value === "" || digits(value) >= 7, "phone-format"),
      ),
    ),
    message: text(CONTACT_LIMITS.message),
    // Solo vale un «sí» explícito: ni ausente, ni "true", ni 1.
    consent: z.literal(true, "consent-required"),
    locale: z.enum(["es", "en"]),
    formMode: z.enum(["terminal", "classic"]),
    /** Campo trampa: las personas no lo ven; si llega relleno, es un robot. */
    website: technical(200),
    turnstileToken: technical(4096),
    utmSource: technical(120),
    utmMedium: technical(120),
    utmCampaign: technical(120),
    referrerHost: technical(255),
  })
  // Correo o teléfono, al menos uno. El error se informa en el correo.
  .check(z.refine((value) => Boolean(value.email || value.phone), { path: ["email"], error: "contact-required" }));

/** Una consulta ya validada y normalizada: lo vacío es null. */
export type ContactData = {
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  consent: true;
  locale: "es" | "en";
  formMode: "terminal" | "classic";
  website: string;
  turnstileToken: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  referrerHost: string | null;
};

export type ContactParseResult =
  | { ok: true; data: ContactData }
  | {
      ok: false;
      /** Errores que el visitante puede corregir, uno por campo. */
      errors: ContactErrors;
      /** La petición no tiene la forma de un formulario (tipos, idioma, modo): no es culpa de lo escrito. */
      malformed: boolean;
    };

const isField = (value: unknown): value is ContactField => (CONTACT_FIELDS as readonly unknown[]).includes(value);
const isCode = (value: string): value is ContactErrorCode => (CONTACT_ERROR_CODES as readonly string[]).includes(value);
const read = (input: Record<string, unknown>, key: string): unknown => input[key];
const isBlank = (value: unknown) => value === undefined || (typeof value === "string" && value.trim() === "");
const orNull = (value: string | undefined) => (value ? value : null);

// Caracteres de control: Postgres no admite el nulo en un texto y ninguno aporta nada.
// El mensaje conserva salto de línea, retorno y tabulador.
const CONTROL = /\p{Cc}/gu;
const CONTROL_KEEPING_BREAKS = /[^\P{Cc}\n\r\t]/gu;
const SINGLE_LINE = ["name", "company", "email", "phone"] as const;

/** Copia de la entrada sin caracteres de control en los textos del visitante. */
function sanitize(input: Record<string, unknown>): Record<string, unknown> {
  const clean = { ...input };
  for (const key of SINGLE_LINE) if (typeof clean[key] === "string") clean[key] = clean[key].replace(CONTROL, "");
  if (typeof clean.message === "string") clean.message = clean.message.replace(CONTROL_KEEPING_BREAKS, "");
  return clean;
}

export function parseContact(raw: unknown): ContactParseResult {
  // Solo un objeto es un formulario: una lista o un texto no tienen campos que corregir.
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return { ok: false, errors: {}, malformed: true };
  const input = sanitize(raw as Record<string, unknown>);
  const parsed = schema.safeParse(input);
  if (parsed.success) {
    const value = parsed.data;
    return {
      ok: true,
      data: {
        name: value.name,
        company: orNull(value.company),
        email: orNull(value.email),
        phone: orNull(value.phone),
        message: orNull(value.message),
        consent: true,
        locale: value.locale,
        formMode: value.formMode,
        website: value.website ?? "",
        turnstileToken: value.turnstileToken ?? "",
        utmSource: orNull(value.utmSource),
        utmMedium: orNull(value.utmMedium),
        utmCampaign: orNull(value.utmCampaign),
        referrerHost: orNull(value.referrerHost),
      },
    };
  }

  const errors: ContactErrors = {};
  let malformed = false;
  for (const issue of parsed.error.issues) {
    const field = issue.path[0];
    if (isField(field) && isCode(issue.message)) errors[field] ??= issue.message;
    else malformed = true;
  }
  // La regla «correo o teléfono» es del objeto entero, y Zod no la evalúa si algún campo
  // ya falló. Se comprueba aquí para informar de todo lo que falta en un solo intento.
  if (!errors.email && !errors.phone && isBlank(read(input, "email")) && isBlank(read(input, "phone"))) {
    errors.email = "contact-required";
  }
  // «Falta un medio de contacto» solo tiene sentido si correo y teléfono no tienen ya su propio error.
  if (errors.email === "contact-required" && errors.phone) delete errors.email;
  return { ok: false, errors, malformed };
}
