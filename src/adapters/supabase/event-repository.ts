import type { AnalyticsEvent } from "@/domain/analytics/events";
import type { EventRepository } from "@/domain/analytics/ports";
import { SupabaseError, type SupabaseOptions } from "./contact-repository";

// Guarda eventos anónimos en Supabase por su API REST, igual que las consultas (ADR-0014).

/** Un evento no merece esperar: si la base tarda, se pierde el evento, no la visita. */
const TIMEOUT_MS = 5000;

export function createSupabaseEventRepository(options: Omit<SupabaseOptions, "newId">): EventRepository {
  const send = options.fetch ?? fetch;
  const endpoint = `${options.url.replace(/\/+$/, "")}/rest/v1/analytics_events`;

  return {
    async save(event: AnalyticsEvent): Promise<void> {
      const response = await send(endpoint, {
        method: "POST",
        headers: {
          apikey: options.secretKey,
          Authorization: `Bearer ${options.secretKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        // Solo las columnas de la tabla. No hay ninguna para IP, agente ni visitante.
        body: JSON.stringify({
          name: event.name,
          locale: event.locale,
          device: event.device,
          path: event.path,
          referrer_host: event.referrerHost,
          utm_source: event.utmSource,
          utm_medium: event.utmMedium,
          utm_campaign: event.utmCampaign,
          form_mode: event.formMode,
        }),
      });
      if (!response.ok) throw new SupabaseError(response.status);
    },
  };
}
