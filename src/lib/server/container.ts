import { createMemoryHealthCheck } from "@/adapters/memory/health";
import type { Backend, HealthCheck } from "@/domain/ports";
import { type ServerEnv, loadServerEnv } from "./env";

/** Dependencias que los Route Handlers y el Worker piden aquí, nunca a los adaptadores. */
export type Container = {
  backend: Backend;
  health: HealthCheck;
};

export function createContainer(env: ServerEnv): Container {
  if (env.services === "memory") {
    return { backend: "memory", health: createMemoryHealthCheck() };
  }
  throw new Error(
    "SERVICES=real todavía no tiene adaptadores: Supabase, Turnstile y correo se implementan en el lote L5.",
  );
}

let cached: Container | undefined;

/** Contenedor del proceso. Valida el entorno en el primer uso. */
export function getContainer(): Container {
  cached ??= createContainer(loadServerEnv());
  return cached;
}
