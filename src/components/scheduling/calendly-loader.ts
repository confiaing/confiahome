import { CALENDLY_SCRIPT } from "@/lib/calendly";

/** Lo único que se usa del script de Calendly: montar el calendario dentro de un elemento. */
export type CalendlyApi = {
  initInlineWidget(options: { url: string; parentElement: HTMLElement }): void;
};

const current = () => (window as unknown as { Calendly?: CalendlyApi }).Calendly;

/** Un script que ni carga ni falla se da por perdido: así un reintento puede pedirlo de nuevo. */
const SCRIPT_WAIT_MS = 15_000;

let pending: Promise<CalendlyApi> | null = null;

/**
 * Pide el script de Calendly, una sola vez, y entrega su API. Solo se llama tras una
 * acción del visitante: hasta entonces la página no descarga nada de Calendly.
 * Si falla, el script se retira para que un reintento lo pida de nuevo.
 */
export function loadCalendly(): Promise<CalendlyApi> {
  const ready = current();
  if (ready) return Promise.resolve(ready);
  if (pending) return pending;

  pending = new Promise<CalendlyApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = CALENDLY_SCRIPT;
    script.async = true;
    const fail = () => {
      window.clearTimeout(timer);
      script.remove();
      pending = null;
      reject(new Error("No se pudo cargar el calendario."));
    };
    const timer = window.setTimeout(fail, SCRIPT_WAIT_MS);
    script.addEventListener("load", () => {
      window.clearTimeout(timer);
      const api = current();
      if (api) resolve(api);
      else fail();
    });
    script.addEventListener("error", fail);
    document.head.append(script);
  }).finally(() => {
    pending = null;
  });
  return pending;
}
