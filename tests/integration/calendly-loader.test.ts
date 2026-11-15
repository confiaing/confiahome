import { afterEach, describe, expect, it, vi } from "vitest";
import { loadCalendly, type CalendlyApi } from "@/components/scheduling/calendly-loader";
import { CALENDLY_SCRIPT } from "@/lib/calendly";

// scheduling · El calendario se carga solo a petición; Alternativa si el calendario no carga
const scripts = () => [...document.head.querySelectorAll<HTMLScriptElement>(`script[src="${CALENDLY_SCRIPT}"]`)];
const api: CalendlyApi = { initInlineWidget: () => {} };
const setApi = (value: CalendlyApi | undefined) => ((window as unknown as { Calendly?: CalendlyApi }).Calendly = value);

afterEach(() => {
  vi.useRealTimers();
  for (const script of scripts()) script.remove();
  setApi(undefined);
});

describe("loadCalendly", () => {
  it("no hay script hasta que se pide; al pedirlo se inserta y resuelve con el API cuando carga", async () => {
    expect(scripts()).toHaveLength(0);
    const pending = loadCalendly();
    expect(scripts()).toHaveLength(1);
    expect(scripts()[0]!.async).toBe(true);
    setApi(api);
    scripts()[0]!.dispatchEvent(new Event("load"));
    await expect(pending).resolves.toBe(api);
  });

  it("pedido dos veces a la vez, inserta un solo script", async () => {
    const first = loadCalendly();
    const second = loadCalendly();
    expect(scripts()).toHaveLength(1);
    setApi(api);
    scripts()[0]!.dispatchEvent(new Event("load"));
    await expect(Promise.all([first, second])).resolves.toEqual([api, api]);
  });

  it("si el API ya está, no inserta nada", async () => {
    setApi(api);
    await expect(loadCalendly()).resolves.toBe(api);
    expect(scripts()).toHaveLength(0);
  });

  it("si el script falla, rechaza y lo retira para que un reintento lo vuelva a pedir", async () => {
    const pending = loadCalendly();
    scripts()[0]!.dispatchEvent(new Event("error"));
    await expect(pending).rejects.toThrow();
    expect(scripts()).toHaveLength(0);
    const retry = loadCalendly();
    expect(scripts()).toHaveLength(1);
    setApi(api);
    scripts()[0]!.dispatchEvent(new Event("load"));
    await expect(retry).resolves.toBe(api);
  });

  it("si el script carga pero no deja el API, rechaza", async () => {
    const pending = loadCalendly();
    scripts()[0]!.dispatchEvent(new Event("load"));
    await expect(pending).rejects.toThrow();
  });

  it("si el script ni carga ni falla, rechaza a los 15 s y lo retira: el reintento pide uno nuevo", async () => {
    vi.useFakeTimers();
    const pending = loadCalendly();
    const outcome = pending.then(
      () => "cargó",
      () => "rechazó",
    );
    const first = scripts()[0];
    await vi.advanceTimersByTimeAsync(14_000);
    expect(scripts()).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1_500);
    await expect(outcome).resolves.toBe("rechazó");
    expect(scripts()).toHaveLength(0);
    void loadCalendly().catch(() => {});
    expect(scripts()).toHaveLength(1);
    expect(scripts()[0]).not.toBe(first);
  });
});
