import type { Purger } from "@/domain/maintenance/ports";
import { SupabaseError, type SupabaseOptions } from "./contact-repository";

const TIMEOUT_MS = 15_000;

type PurgerOptions = Omit<SupabaseOptions, "newId"> & { table: "contact_requests" | "analytics_events" };

/**
 * Borra de una tabla las filas creadas antes de una fecha (conservación máxima que declara
 * la política de privacidad). El borrado es irreversible, así que solo se envía con una
 * fecha válida y ya pasada: sin esa condición PostgREST borraría la tabla entera.
 */
export function createSupabasePurger(options: PurgerOptions): Purger {
  const send = options.fetch ?? fetch;
  const endpoint = `${options.url.replace(/\/+$/, "")}/rest/v1/${options.table}`;

  return {
    async purgeOlderThan(cutoff) {
      if (!(cutoff instanceof Date) || Number.isNaN(cutoff.getTime())) throw new Error("El borrado necesita una fecha de corte válida.");
      if (cutoff.getTime() >= Date.now()) throw new Error("La fecha de corte del borrado debe ser pasada.");

      const response = await send(`${endpoint}?created_at=lt.${cutoff.toISOString()}`, {
        method: "DELETE",
        headers: {
          apikey: options.secretKey,
          Authorization: `Bearer ${options.secretKey}`,
          Prefer: "return=minimal, count=exact",
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!response.ok) throw new SupabaseError(response.status);
      // «*/3»: tres filas afectadas. Sin cabecera no se inventa una cuenta.
      const total = /\/(\d+)$/.exec(response.headers.get("content-range") ?? "")?.[1];
      return total ? Number(total) : 0;
    },
  };
}
