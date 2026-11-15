// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createMemoryLogger } from "@/adapters/memory/contact";
import { createMemoryPurger } from "@/adapters/memory/maintenance";
import { EVENT_RETENTION_MONTHS } from "@/domain/analytics/retention";
import { CONTACT_RETENTION_MONTHS } from "@/domain/contact/retention";
import { cutoff, runMaintenance, RETENTION } from "@/domain/maintenance/run-maintenance";

const NOW = new Date("2026-11-15T03:10:00.000Z");
const months = (n: number) => cutoff(NOW, n);

function setup(options: { healthFails?: boolean; contactsFail?: boolean; eventsFail?: boolean } = {}) {
  const contacts = createMemoryPurger(["2024-11-14T23:59:59.000Z", "2024-11-15T03:10:00.000Z", "2024-11-16T00:00:00.000Z", "2026-11-01T00:00:00.000Z"], { failing: options.contactsFail });
  const events = createMemoryPurger(["2025-10-14T00:00:00.000Z", "2025-10-15T03:09:59.000Z", "2025-10-15T03:10:01.000Z", "2026-11-14T00:00:00.000Z"], { failing: options.eventsFail });
  const logger = createMemoryLogger();
  let pings = 0;
  const health = {
    async ping() {
      pings += 1;
      if (options.healthFails) throw new Error("sin respuesta de ana@empresa.com");
      return { ok: true, backend: "memory" as const };
    },
  };
  const run = () => runMaintenance({ health, contacts, events, logger }, NOW);
  return { contacts, events, logger, run, pings: () => pings };
}

// scheduled-maintenance · Borrado por conservación
describe("fecha de corte", () => {
  it("resta meses naturales a la fecha de ejecución", () => {
    expect(months(24).toISOString()).toBe("2024-11-15T03:10:00.000Z");
    expect(months(13).toISOString()).toBe("2025-10-15T03:10:00.000Z");
  });

  it("a final de mes no se pasa al mes siguiente", () => {
    expect(cutoff(new Date("2026-03-31T12:00:00.000Z"), 1).toISOString()).toBe("2026-02-28T12:00:00.000Z");
    expect(cutoff(new Date("2028-02-29T00:00:00.000Z"), 24).toISOString()).toBe("2026-02-28T00:00:00.000Z");
  });

  it.each([0, -1, 1.5, Number.NaN])("rechaza un plazo de %s meses", (value) => {
    expect(() => cutoff(NOW, value)).toThrow();
  });

  it("los plazos del borrado son los que declara la política de privacidad", () => {
    expect(RETENTION).toEqual({ contacts: CONTACT_RETENTION_MONTHS, events: EVENT_RETENTION_MONTHS });
  });
});

describe("runMaintenance", () => {
  it("consulta el almacén y borra lo vencido, y solo lo vencido", async () => {
    const { contacts, events, run, pings } = setup();
    const summary = await run();
    expect(pings()).toBe(1);
    expect(summary).toEqual({ heartbeat: true, contactsPurged: 1, eventsPurged: 2 });
    // Lo creado justo en la fecha de corte todavía no ha vencido.
    expect(contacts.rows).toEqual(["2024-11-15T03:10:00.000Z", "2024-11-16T00:00:00.000Z", "2026-11-01T00:00:00.000Z"]);
    expect(events.rows).toEqual(["2025-10-15T03:10:01.000Z", "2026-11-14T00:00:00.000Z"]);
  });

  it("deja constancia con las cuentas y nada más", async () => {
    const { logger, run } = setup();
    await run();
    expect(logger.entries).toEqual([{ level: "info", code: "maintenance.done", context: { heartbeat: true, contactsPurged: 1, eventsPurged: 2 } }]);
  });

  // scheduled-maintenance · La tarea nunca falla a medias ni en silencio
  it("si falla el latido, se registra y los borrados se ejecutan igualmente", async () => {
    const { logger, run } = setup({ healthFails: true });
    const summary = await run();
    expect(summary).toEqual({ heartbeat: false, contactsPurged: 1, eventsPurged: 2 });
    expect(logger.entries.map((entry) => entry.code)).toEqual(["maintenance.heartbeat-failed", "maintenance.done"]);
    expect(JSON.stringify(logger.entries)).not.toContain("ana@empresa.com");
  });

  it("si el almacén responde que no está disponible, el latido cuenta como fallido", async () => {
    const logger = createMemoryLogger();
    const summary = await runMaintenance(
      { health: { ping: async () => ({ ok: false, backend: "real" as const }) }, contacts: createMemoryPurger([]), events: createMemoryPurger([]), logger },
      NOW,
    );
    expect(summary.heartbeat).toBe(false);
    expect(logger.entries.map((entry) => entry.code)).toEqual(["maintenance.heartbeat-failed", "maintenance.done"]);
  });

  it("si falla un borrado, se registra y el otro se ejecuta", async () => {
    const first = setup({ contactsFail: true });
    expect(await first.run()).toEqual({ heartbeat: true, contactsPurged: null, eventsPurged: 2 });
    expect(first.logger.entries.map((entry) => entry.code)).toEqual(["maintenance.contacts-purge-failed", "maintenance.done"]);
    expect(first.events.rows).toHaveLength(2);

    const second = setup({ eventsFail: true });
    expect(await second.run()).toEqual({ heartbeat: true, contactsPurged: 1, eventsPurged: null });
    expect(second.contacts.rows).toHaveLength(3);
  });

  it("nunca lanza, falle lo que falle", async () => {
    const { run } = setup({ healthFails: true, contactsFail: true, eventsFail: true });
    await expect(run()).resolves.toEqual({ heartbeat: false, contactsPurged: null, eventsPurged: null });
  });
});
