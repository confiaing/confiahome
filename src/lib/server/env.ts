import { z } from "zod";
import { EnvError, readServiceMode, type EnvSource } from "./service-mode";

export { EnvError };

/**
 * Configuración del servidor. Se valida en el primer uso, no al importar,
 * para que el build y las pruebas no necesiten secretos.
 *
 * SERVICES=memory  adaptadores en memoria, sin red (por defecto).
 * SERVICES=real    Supabase, Turnstile y correo; exige todos los secretos.
 */
const REQUIRED_WHEN_REAL = [
  "SUPABASE_URL",
  "SUPABASE_SECRET_KEY",
  "TURNSTILE_SECRET_KEY",
  "NOTIFY_FROM",
  "NOTIFY_TO",
] as const;

const required = z.string().trim().min(1);

const realSchema = z.object({
  SUPABASE_URL: required,
  SUPABASE_SECRET_KEY: required,
  TURNSTILE_SECRET_KEY: required,
  NOTIFY_FROM: required,
  NOTIFY_TO: required,
});

export type ServerEnv =
  | { services: "memory" }
  | {
      services: "real";
      supabaseUrl: string;
      supabaseSecretKey: string;
      turnstileSecretKey: string;
      notifyFrom: string;
      notifyTo: string;
    };

export function loadServerEnv(source: EnvSource = process.env): ServerEnv {
  if (readServiceMode(source) === "memory") return { services: "memory" };

  const parsed = realSchema.safeParse(source);
  if (!parsed.success) {
    const missing = REQUIRED_WHEN_REAL.filter((key) => parsed.error.issues.some((issue) => issue.path[0] === key));
    throw new EnvError(
      `Faltan variables de entorno para SERVICES=real: ${missing.join(", ")}. ` +
        "Defínelas en .env.development.local (desarrollo) o con `wrangler secret put` (producción).",
    );
  }
  return {
    services: "real",
    supabaseUrl: parsed.data.SUPABASE_URL,
    supabaseSecretKey: parsed.data.SUPABASE_SECRET_KEY,
    turnstileSecretKey: parsed.data.TURNSTILE_SECRET_KEY,
    notifyFrom: parsed.data.NOTIFY_FROM,
    notifyTo: parsed.data.NOTIFY_TO,
  };
}
