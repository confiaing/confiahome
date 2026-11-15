import type { AnalyticsEvent } from "./events.ts";

/** Guarda eventos. La fecha la pone el almacén. */
export interface EventRepository {
  save(event: AnalyticsEvent): Promise<void>;
}
