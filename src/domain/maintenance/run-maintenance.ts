import { EVENT_RETENTION_MONTHS } from "../analytics/retention.ts";
import { CONTACT_RETENTION_MONTHS } from "../contact/retention.ts";
import type { HealthCheck, Logger } from "../ports.ts";
import type { Purger } from "./ports.ts";

/** Meses de conservación de cada tabla: los mismos que declara la política de privacidad. */
export const RETENTION = { contacts: CONTACT_RETENTION_MONTHS, events: EVENT_RETENTION_MONTHS } as const;

export type MaintenanceDeps = { health: HealthCheck; contacts: Purger; events: Purger; logger: Logger };

/** Filas borradas de cada tabla; null si ese borrado falló. */
export type MaintenanceSummary = { heartbeat: boolean; contactsPurged: number | null; eventsPurged: number | null };

/**
 * La fecha de hace `months` meses naturales. Si el mes de destino es más corto, se queda
 * en su último día (31 de marzo menos un mes es 28 de febrero, no 3 de marzo).
 */
export function cutoff(now: Date, months: number): Date {
  if (!Number.isInteger(months) || months <= 0) throw new Error("El plazo de conservación debe ser un número entero de meses.");
  const result = new Date(now.getTime());
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() - months);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

const reason = (error: unknown) => (error instanceof Error ? error.name : "unknown");

/**
 * Tarea diaria: consulta el almacén (así el proyecto de Supabase no se pausa por
 * inactividad) y borra lo que ha superado su plazo de conservación. Cada trabajo va
 * por separado: que uno falle no impide los demás, y nada sale de aquí como excepción.
 */
export async function runMaintenance(deps: MaintenanceDeps, now: Date): Promise<MaintenanceSummary> {
  let heartbeat = false;
  try {
    heartbeat = (await deps.health.ping()).ok;
    if (!heartbeat) deps.logger.error("maintenance.heartbeat-failed", { reason: "unavailable" });
  } catch (error) {
    deps.logger.error("maintenance.heartbeat-failed", { reason: reason(error) });
  }

  const purge = async (purger: Purger, months: number, code: string): Promise<number | null> => {
    try {
      return await purger.purgeOlderThan(cutoff(now, months));
    } catch (error) {
      deps.logger.error(code, { reason: reason(error) });
      return null;
    }
  };
  const contactsPurged = await purge(deps.contacts, RETENTION.contacts, "maintenance.contacts-purge-failed");
  const eventsPurged = await purge(deps.events, RETENTION.events, "maintenance.events-purge-failed");

  const summary = { heartbeat, contactsPurged, eventsPurged };
  // Solo cuentas: nada del contenido de lo borrado.
  deps.logger.info("maintenance.done", { heartbeat, contactsPurged: contactsPurged ?? -1, eventsPurged: eventsPurged ?? -1 });
  return summary;
}
