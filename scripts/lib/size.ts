/** Límite del script comprimido en el plan gratuito de Cloudflare Workers. */
export const WORKER_LIMIT_BYTES = 3 * 1024 * 1024;

/** Límite propuesto para el JS inicial de /es, comprimido y sin contar Three.js. */
export const INITIAL_JS_LIMIT_BYTES = 200 * 1000;

const kib = (bytes: number) => `${(bytes / 1024).toFixed(1)} KiB`;

export type BudgetResult = { ok: boolean; message: string };

export function evaluateWorkerSize(bytes: number | null, limit = WORKER_LIMIT_BYTES): BudgetResult {
  if (bytes === null || !Number.isFinite(bytes)) {
    return { ok: false, message: "No se pudo medir el tamaño del Worker: la comprobación no puede darse por superada." };
  }
  if (bytes > limit) {
    return {
      ok: false,
      message: `El Worker comprimido mide ${kib(bytes)} y supera el límite de ${kib(limit)} del plan gratuito.`,
    };
  }
  const margin = ((limit - bytes) / limit) * 100;
  return {
    ok: true,
    message: `Worker comprimido: ${kib(bytes)} de ${kib(limit)}. Margen restante: ${margin.toFixed(1)} %.`,
  };
}

/** Lee «gzip: 912.05 KiB» de la salida de `wrangler deploy --dry-run`. */
export function parseGzipSize(output: string): number | null {
  const match = /gzip:\s*([\d.]+)\s*(KiB|MiB)/i.exec(output);
  if (!match?.[1] || !match[2]) return null;
  const factor = match[2].toLowerCase() === "mib" ? 1024 * 1024 : 1024;
  return Math.round(Number.parseFloat(match[1]) * factor);
}
