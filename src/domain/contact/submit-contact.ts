import { CONSENT_VERSION } from "./consent.ts";
import type { ContactErrors } from "./errors.ts";
import type { ContactRepository, Logger, Notifier, RateLimiter, SpamVerifier } from "./ports.ts";
import { parseContact } from "./schema.ts";

export type SubmitContactDeps = {
  repository: ContactRepository;
  notifier: Notifier;
  verifier: SpamVerifier;
  limiter: RateLimiter;
  logger: Logger;
  now: () => Date;
};

export type SubmitContactContext = {
  /** Identifica el origen del envío (la IP). Se usa para limitar y verificar; nunca se guarda. */
  clientKey: string | null;
};

export type SubmitContactResult =
  | { status: "accepted" }
  | { status: "invalid"; errors: ContactErrors; malformed: boolean }
  | { status: "spam-rejected" }
  | { status: "rate-limited" }
  | { status: "unavailable" };

const reason = (error: unknown) => (error instanceof Error ? error.name : "unknown");

/**
 * Recibe una consulta. Si devuelve `accepted` con una consulta real, está guardada.
 * El aviso al equipo es secundario: si falla, se registra y la consulta sigue aceptada.
 */
export async function submitContact(input: unknown, context: SubmitContactContext, deps: SubmitContactDeps): Promise<SubmitContactResult> {
  const parsed = parseContact(input);
  if (!parsed.ok) return { status: "invalid", errors: parsed.errors, malformed: parsed.malformed };
  const { data } = parsed;

  // Campo trampa: se responde como si todo fuera bien, para no dar pistas, y no se hace nada.
  // Va antes del límite y de la verificación para no gastarlos en robots.
  // Se cuenta, sin nada de lo enviado: si el número sube sin motivo, el campo atrapa a personas.
  if (data.website !== "") {
    deps.logger.info("contact.honeypot");
    return { status: "accepted" };
  }

  const clientKey = context.clientKey ?? "desconocido";
  try {
    if (!(await deps.limiter.allow(clientKey))) return { status: "rate-limited" };
  } catch (error) {
    // Si el limitador falla, se deja pasar: quedan las otras dos capas.
    deps.logger.error("contact.limiter-failed", { reason: reason(error) });
  }

  try {
    if (!(await deps.verifier.verify(data.turnstileToken, context.clientKey))) return { status: "spam-rejected" };
  } catch (error) {
    // Sin poder verificar no se guarda nada: el visitante verá la alternativa del correo.
    deps.logger.error("contact.verify-failed", { reason: reason(error) });
    return { status: "unavailable" };
  }

  let saved;
  try {
    saved = await deps.repository.save({
      name: data.name,
      company: data.company,
      email: data.email,
      phone: data.phone,
      message: data.message,
      locale: data.locale,
      consentAt: deps.now().toISOString(),
      consentVersion: CONSENT_VERSION,
      utmSource: data.utmSource,
      utmMedium: data.utmMedium,
      utmCampaign: data.utmCampaign,
      referrerHost: data.referrerHost,
    });
  } catch (error) {
    deps.logger.error("contact.save-failed", { reason: reason(error) });
    return { status: "unavailable" };
  }

  try {
    await deps.notifier.notify(saved);
  } catch (error) {
    deps.logger.error("contact.notify-failed", { reason: reason(error) });
  }

  return { status: "accepted" };
}
