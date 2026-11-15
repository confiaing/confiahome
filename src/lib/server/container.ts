import { createMemoryEventRepository } from "@/adapters/memory/analytics";
import {
  createMemoryContactRepository,
  createMemoryNotifier,
  createMemoryRateLimiter,
  createMemorySpamVerifier,
} from "@/adapters/memory/contact";
import { createEmailNotifier, type EmailBinding } from "@/adapters/email/notifier";
import { createMemoryHealthCheck } from "@/adapters/memory/health";
import { createBindingRateLimiter, type RateLimitBinding } from "@/adapters/ratelimit/limiter";
import { createSupabaseContactRepository } from "@/adapters/supabase/contact-repository";
import { createSupabaseEventRepository } from "@/adapters/supabase/event-repository";
import { createTurnstileVerifier } from "@/adapters/turnstile/verifier";
import type { RecordEventDeps } from "@/domain/analytics/record-event";
import type { SubmitContactDeps } from "@/domain/contact/submit-contact";
import type { Backend, HealthCheck } from "@/domain/ports";
import { matchRoute, pathFor } from "@/i18n/routes";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { type ServerEnv, loadServerEnv } from "./env";
import { consoleLogger } from "./logger";

/** Dependencias que los Route Handlers y el Worker piden aquí, nunca a los adaptadores. */
export type Container = {
  backend: Backend;
  health: HealthCheck;
  /** Lo que necesita el caso de uso de contacto. */
  contact: SubmitContactDeps;
  /** Lo que necesita el registro de eventos anónimos. */
  analytics: RecordEventDeps;
};

/** Una ruta recibida del navegador, reducida a una página del sitio; null si no lo es. */
function resolvePath(raw: string): string | null {
  const match = matchRoute(raw);
  return match ? pathFor(match.locale, match.routeId) : null;
}

export function createContainer(env: ServerEnv): Container {
  if (env.services === "memory") {
    return {
      backend: "memory",
      health: createMemoryHealthCheck(),
      contact: {
        repository: createMemoryContactRepository(),
        notifier: createMemoryNotifier(),
        verifier: createMemorySpamVerifier(),
        // Holgado: en memoria todos los envíos llegan del mismo origen (pruebas y desarrollo).
        limiter: createMemoryRateLimiter(10_000),
        logger: consoleLogger,
        now: () => new Date(),
      },
      analytics: {
        repository: createMemoryEventRepository(),
        limiter: createMemoryRateLimiter(10_000),
        logger: consoleLogger,
        resolvePath,
      },
    };
  }
  const bindings = workerBindings();
  return {
    backend: "real",
    // El latido real contra Supabase llega en el lote L9 (L9-8). Hasta entonces no afirma nada.
    health: { ping: async () => ({ ok: false, backend: "real" }) },
    contact: {
      repository: createSupabaseContactRepository({ url: env.supabaseUrl, secretKey: env.supabaseSecretKey }),
      verifier: createTurnstileVerifier({ secretKey: env.turnstileSecretKey }),
      notifier: createEmailNotifier({
        from: env.notifyFrom,
        to: env.notifyTo,
        binding: bindings.SEND_EMAIL ?? missingBinding("SEND_EMAIL"),
        createMessage: createEmailMessage,
        now: () => new Date(),
        newId: () => crypto.randomUUID(),
      }),
      limiter: createBindingRateLimiter(bindings.CONTACT_RATE_LIMITER ?? missingBinding("CONTACT_RATE_LIMITER")),
      logger: consoleLogger,
      now: () => new Date(),
    },
    analytics: {
      repository: createSupabaseEventRepository({ url: env.supabaseUrl, secretKey: env.supabaseSecretKey }),
      limiter: createBindingRateLimiter(bindings.EVENTS_RATE_LIMITER ?? missingBinding("EVENTS_RATE_LIMITER"), "events"),
      logger: consoleLogger,
      resolvePath,
    },
  };
}

type WorkerBindings = { SEND_EMAIL?: EmailBinding; CONTACT_RATE_LIMITER?: RateLimitBinding; EVENTS_RATE_LIMITER?: RateLimitBinding };

/** Bindings del Worker (wrangler.jsonc). Fuera de Workers no existen. */
function workerBindings(): WorkerBindings {
  try {
    return getCloudflareContext().env as WorkerBindings;
  } catch {
    return {};
  }
}

class MissingBindingError extends Error {
  override readonly name = "MissingBindingError";
}

/**
 * Sustituto de un binding que no está: falla al usarlo, no al arrancar. El caso de uso
 * ya sabe qué hacer con ese fallo (registrar el aviso perdido, dejar pasar el límite).
 */
function missingBinding(name: string): EmailBinding & RateLimitBinding {
  const fail = async (): Promise<never> => {
    throw new MissingBindingError(`Falta el binding ${name} en wrangler.jsonc.`);
  };
  return { send: fail, limit: fail };
}

/**
 * `EmailMessage` solo existe en el runtime de Workers. Se importa al usarlo y con el
 * nombre en una variable, para que el build de Next.js no intente resolverlo.
 */
async function createEmailMessage(from: string, to: string, raw: string): Promise<unknown> {
  const specifier = "cloudflare:email";
  const { EmailMessage } = (await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ specifier)) as {
    EmailMessage: new (from: string, to: string, raw: string) => unknown;
  };
  return new EmailMessage(from, to, raw);
}

let cached: Container | undefined;
let override: Container | undefined;

/** Contenedor del proceso. Valida el entorno en el primer uso. */
export function getContainer(): Container {
  if (override) return override;
  cached ??= createContainer(loadServerEnv());
  return cached;
}

/** Solo para pruebas: sustituye el contenedor (o lo restaura con `undefined`). */
export function overrideContainer(container: Container | undefined): void {
  override = container;
}
