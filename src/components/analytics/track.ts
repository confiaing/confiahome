import { deviceFor } from "@/domain/analytics/device";
import type { EventName } from "@/domain/analytics/events";
import { readAttribution, type Attribution } from "@/lib/attribution";

const ENDPOINT = "/api/events";

type Extra = { formMode?: "terminal" | "classic" };

// La campaña y la procedencia son las de la llegada. Se recuerdan en memoria mientras la
// página siga abierta —no en el almacenamiento del navegador— para que una reserva hecha
// tras visitar otra página del sitio siga contando para su canal.
let arrival: Attribution | null = null;
const attribution = () => (arrival ??= readAttribution(window.location, document.referrer));

/** Solo para pruebas: olvida la llegada recordada. */
export function forgetVisit(): void {
  arrival = null;
}

/** El visitante pidió no ser rastreado (Global Privacy Control o Do Not Track). */
function optedOut(): boolean {
  const flags = navigator as Navigator & { globalPrivacyControl?: boolean };
  return flags.globalPrivacyControl === true || navigator.doNotTrack === "1";
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
