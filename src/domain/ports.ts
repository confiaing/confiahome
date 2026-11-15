/**
 * Puertos compartidos: interfaces que varios casos de uso del dominio necesitan y que los
 * adaptadores implementan. Los propios de un caso de uso viven en su carpeta
 * (contact/ports.ts, analytics/ports.ts, maintenance/ports.ts).
 */
export type Backend = "memory" | "real";

export interface HealthCheck {
  /** Comprueba que el almacén de datos responde. Lo usa el latido diario. */
  ping(): Promise<{ ok: boolean; backend: Backend }>;
}

export interface RateLimiter {
  /** ¿Se admite otro envío de este origen? */
  allow(key: string): Promise<boolean>;
}

export interface Logger {
  /** Registra un fallo. `context` nunca lleva datos del visitante. */
  error(code: string, context?: Record<string, string | number | boolean>): void;
  /** Deja constancia de algo que no es un fallo. Mismas reglas para `context`. */
  info(code: string, context?: Record<string, string | number | boolean>): void;
}
