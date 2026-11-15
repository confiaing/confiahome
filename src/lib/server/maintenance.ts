import { createMemoryHealthCheck } from "@/adapters/memory/health";
import { createMemoryPurger } from "@/adapters/memory/maintenance";
import { createSupabaseHealthCheck } from "@/adapters/supabase/health";
import { createSupabasePurger } from "@/adapters/supabase/purger";
import type { MaintenanceDeps } from "@/domain/maintenance/run-maintenance";
import { consoleLogger } from "./logger";
import { EnvError, readServiceMode, type EnvSource } from "./service-mode";

/**
 * Dependencias de la tarea diaria del Worker: latido y borrado por conservación.
 * Lee del entorno solo lo que necesita (dirección y clave de Supabase): la tarea no
 * depende de que estén el antispam o el correo, y la entrada del Worker no carga con
 * la validación completa del servidor.
 */
export function createMaintenanceDeps(source: EnvSource): MaintenanceDeps {
  if (readServiceMode(source) === "memory") {
    return { health: createMemoryHealthCheck(), contacts: createMemoryPurger([]), events: createMemoryPurger([]), logger: consoleLogger };
  }

  const url = source.SUPABASE_URL?.trim();
  const secretKey = source.SUPABASE_SECRET_KEY?.trim();
  const missing = [!url && "SUPABASE_URL", !secretKey && "SUPABASE_SECRET_KEY"].filter(Boolean);
  // El mensaje nombra lo que falta, nunca el valor de lo que hay.
  if (!url || !secretKey) throw new EnvError(`Faltan variables de entorno para la tarea diaria: ${missing.join(", ")}.`);

  const supabase = { url, secretKey };
  return {
    health: createSupabaseHealthCheck(supabase),
    contacts: createSupabasePurger({ ...supabase, table: "contact_requests" }),
    events: createSupabasePurger({ ...supabase, table: "analytics_events" }),
    logger: consoleLogger,
  };
}
