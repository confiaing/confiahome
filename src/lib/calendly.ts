// Protocolo del calendario incrustado de Calendly. Sin DOM: solo qué dirección es válida
// y cómo se leen los avisos que su marco envía a la página (window.postMessage).

export const CALENDLY_ORIGIN = "https://calendly.com";
export const CALENDLY_SCRIPT = "https://assets.calendly.com/assets/external/widget.js";

export type CalendlySignal = "viewed" | "date-selected" | "scheduled" | "other";

const SIGNALS: Record<string, CalendlySignal> = {
  "calendly.profile_page_viewed": "viewed",
  "calendly.event_type_viewed": "viewed",
  "calendly.date_and_time_selected": "date-selected",
  "calendly.event_scheduled": "scheduled",
};

/**
 * Qué comunica un mensaje recibido en la página, o null si no es de Calendly.
 * Solo se confía en el origen exacto: cualquier otra ventana puede enviar un mensaje
 * con el mismo nombre. «other» son avisos de Calendly sin interés propio (su altura,
 * por ejemplo), que aun así prueban que el calendario está vivo.
 */
export function calendlySignal(origin: string, data: unknown): CalendlySignal | null {
  if (origin !== CALENDLY_ORIGIN) return null;
  if (typeof data !== "object" || data === null) return null;
  const event = (data as { event?: unknown }).event;
  if (typeof event !== "string" || !event.startsWith("calendly.")) return null;
  return SIGNALS[event] ?? "other";
}

/** La dirección que se entrega al widget, o null si no es una página de reserva de Calendly. */
export function embedUrl(base: string): string | null {
  let url: URL;
  try {
    url = new URL(base.trim());
  } catch {
    return null;
  }
  if (url.origin !== CALENDLY_ORIGIN || url.username !== "" || url.password !== "") return null;
  if (url.pathname.replace(/\/+$/, "") === "") return null;
  return url.href;
}
