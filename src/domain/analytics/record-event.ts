import type { Logger, RateLimiter } from "../ports.ts";
import { normalizeEvent, type ResolvePath } from "./events.ts";
import type { EventRepository } from "./ports.ts";

export type RecordEventDeps = {
  repository: EventRepository;
  limiter: RateLimiter;
  logger: Logger;
  resolvePath: ResolvePath;
};

export type RecordEventContext = {
  /** La IP: solo como clave efímera del límite de frecuencia. No se guarda ni se registra. */
  clientKey: string | null;
  /** Solo para reconocer robots. No se guarda ni se registra. */
  userAgent: string | null;
};

/** `ignored`: aceptado sin guardarse (un robot, o el almacén falló). Para quien envía, igual que `recorded`. */
export type RecordEventResult = "recorded" | "ignored" | "invalid" | "rate-limited";

// Robots, vistas previas de enlaces y navegadores automatizados: no son visitas.
// «bot» solo como palabra final o seguida de signo: «Cubot» es una marca de teléfonos.
const ROBOT = /(?<![a-z])bot\b|[a-z]bot(?![a-z])(?<!cubot)|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|externalhit|monitor|curl|wget|python|scrapy/i;

const reason = (error: unknown) => (error instanceof Error ? error.name : "unknown");

/** Recibe un evento de la página. La analítica nunca es motivo de error para el visitante. */
export async function recordEvent(input: unknown, context: RecordEventContext, deps: RecordEventDeps): Promise<RecordEventResult> {
  const normalized = normalizeEvent(input, deps.resolvePath);
  if (!normalized.ok) return "invalid";

  if (context.userAgent && ROBOT.test(context.userAgent)) return "ignored";

  try {
    if (!(await deps.limiter.allow(context.clientKey ?? "desconocido"))) return "rate-limited";
  } catch (error) {
    // Sin limitador se deja pasar: un evento de más no hace daño.
    deps.logger.error("analytics.limiter-failed", { reason: reason(error) });
  }

  try {
    await deps.repository.save(normalized.event);
  } catch (error) {
    deps.logger.error("analytics.save-failed", { reason: reason(error) });
    return "ignored";
  }
  return "recorded";
}
