import type { HealthCheck } from "@/domain/ports";
import type { SupabaseOptions } from "./contact-repository";

const TIMEOUT_MS = 8000;

/**
 * Latido: una consulta mínima que mantiene activo el proyecto de Supabase (se pausa tras
 * una semana sin actividad). Pregunta por la tabla de eventos anónimos, sin leer filas:
 * no toca ningún dato personal.
 */
export function createSupabaseHealthCheck(options: Omit<SupabaseOptions, "newId">): HealthCheck {
  const send = options.fetch ?? fetch;
  const endpoint = `${options.url.replace(/\/+$/, "")}/rest/v1/analytics_events?select=id&limit=1`;
  return {
    async ping() {
      const response = await send(endpoint, {
        method: "HEAD",
        headers: { apikey: options.secretKey, Authorization: `Bearer ${options.secretKey}` },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      return { ok: response.ok, backend: "real" };
    },
  };
}
