import type { ContactErrorCode, ContactErrors } from "@/domain/contact/errors";
import { submitContact } from "@/domain/contact/submit-contact";
import { getDictionary, type Dictionary } from "@/i18n/dictionaries";
import { DEFAULT_LOCALE, isLocale } from "@/i18n/locales";
import { getContainer } from "@/lib/server/container";
import { clientAddress, isJson, isSameOrigin, json, readJsonBody } from "@/lib/server/http";

// Recibe una consulta del formulario de la home (ADR-0002, ADR-0006).
// Solo acepta JSON enviado desde el propio sitio. Next.js responde 405 a otros métodos.
export const dynamic = "force-dynamic";

/**
 * Un formulario al máximo —mensaje de 2000 caracteres en una escritura de tres bytes por
 * carácter y un token antispam de 4 kB— ronda los 12 kB.
 */
const MAX_BODY_BYTES = 16_000;

const MESSAGE_KEY: Record<ContactErrorCode, keyof Dictionary["contact"]["errors"]> = {
  required: "required",
  "too-long": "tooLong",
  "email-format": "emailFormat",
  "phone-format": "phoneFormat",
  "contact-required": "contactRequired",
  "consent-required": "consentRequired",
};

function localizedErrors(codes: ContactErrors, body: unknown): Record<string, string> {
  const requested = typeof body === "object" && body !== null ? (body as { locale?: unknown }).locale : undefined;
  const locale = typeof requested === "string" && isLocale(requested) ? requested : DEFAULT_LOCALE;
  const messages = getDictionary(locale).contact.errors;
  return Object.fromEntries(Object.entries(codes).map(([field, code]) => [field, messages[MESSAGE_KEY[code]]]));
}

export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request)) return json({ status: "forbidden" }, 403);
  if (!isJson(request)) return json({ status: "unsupported-media-type" }, 415);

  const body = await readJsonBody(request, MAX_BODY_BYTES);
  if (!body.ok) return body.reason === "too-large" ? json({ status: "too-large" }, 413) : json({ status: "malformed" }, 400);
  if (typeof body.value !== "object" || body.value === null || Array.isArray(body.value)) return json({ status: "malformed" }, 400);

  const result = await submitContact(body.value, { clientKey: clientAddress(request) }, getContainer().contact);

  switch (result.status) {
    case "accepted":
      return json({ status: "accepted" }, 201);
    case "invalid":
      // Sin errores de campo que mostrar, el problema no es de lo que escribió el visitante.
      return result.malformed && Object.keys(result.errors).length === 0
        ? json({ status: "malformed" }, 400)
        : json({ status: "invalid", codes: result.errors, errors: localizedErrors(result.errors, body.value) }, 422);
    case "spam-rejected":
      return json({ status: "spam-rejected" }, 403);
    case "rate-limited":
      return json({ status: "rate-limited" }, 429);
    case "unavailable":
      return json({ status: "unavailable" }, 503);
  }
}
