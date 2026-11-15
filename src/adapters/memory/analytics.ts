import type { AnalyticsEvent } from "@/domain/analytics/events";
import type { EventRepository } from "@/domain/analytics/ports";

/** Almacén de eventos en memoria, para pruebas y desarrollo. */
export function createMemoryEventRepository(options: { failing?: boolean } = {}): EventRepository & { events: AnalyticsEvent[] } {
  const events: AnalyticsEvent[] = [];
  return {
    events,
    async save(event) {
      if (options.failing) throw new Error("El almacén de eventos no está disponible.");
      events.push(event);
    },
  };
}
