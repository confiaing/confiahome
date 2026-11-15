import type { Purger } from "@/domain/maintenance/ports";

/** Tabla en memoria reducida a sus fechas de creación, para probar el borrado por conservación. */
export function createMemoryPurger(createdAt: string[], options: { failing?: boolean } = {}): Purger & { rows: string[] } {
  const purger = {
    rows: [...createdAt],
    async purgeOlderThan(cutoff: Date) {
      if (options.failing) throw new Error("El almacén no está disponible.");
      const before = purger.rows.length;
      purger.rows = purger.rows.filter((value) => new Date(value).getTime() >= cutoff.getTime());
      return before - purger.rows.length;
    },
  };
  return purger;
}
