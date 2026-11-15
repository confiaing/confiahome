import { deviceFor } from "@/domain/analytics/device";
import type { EventName } from "@/domain/analytics/events";
import { readAttribution, type Attribution } from "@/lib/attribution";
import { optedOut } from "@/lib/privacy";

const ENDPOINT = "/api/events";

type Extra = { formMode?: "terminal" | "classic" };

// La campaña y la procedencia son las de la llegada a esta página. Se leen una vez y se
// reutilizan en todos sus eventos. No se guardan en el navegador: al pasar a otra página
// del sitio se pierden (los enlaces internos recargan la página), salvo al cambiar de
// idioma, que conserva las etiquetas de campaña (api/locale).
let arrival: Attribution | null = null;
const attribution = () => (arrival ??= readAttribution(window.location, document.referrer));

/** Solo para pruebas: olvida la llegada recordada. */
export function forgetVisit(): void {
  arrival = null;
}

/**
 * Envía un evento anónimo (ADR-0005): su nombre y el contexto de la visita —idioma,
 * tipo de dispositivo, página, procedencia y campaña—. Nada que el visitante haya escrito.
 * No guarda nada en el navegador, no espera respuesta y nunca lanza: la analítica no
 * puede estropear la página.
 */
export function track(name: EventName, extra: Extra = {}): void {
  try {
    if (optedOut()) return;
    const body = JSON.stringify({
      name,
      locale: document.documentElement.lang,
      device: deviceFor(window.innerWidth),
      path: window.location.pathname,
      ...attribution(),
      ...(extra.formMode ? { formMode: extra.formMode } : {}),
    });

    // sendBeacon sobrevive a la salida de la página (cambio de idioma, enlace externo).
    if (typeof navigator.sendBeacon === "function" && navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }))) return;
    void fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
  } catch {
    // Sin analítica, la página sigue igual.
  }
}
