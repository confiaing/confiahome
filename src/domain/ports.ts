/**
 * Puertos: interfaces que el dominio necesita y que los adaptadores implementan.
 * En el lote L0 solo existe el de salud; los de contacto, analítica, correo y antispam
 * llegan con los lotes que los usan (L5, L7).
 */
export type Backend = "memory" | "real";

export interface HealthCheck {
  /** Comprueba que el almacén de datos responde. Lo usa el latido diario (L9-8). */
  ping(): Promise<{ ok: boolean; backend: Backend }>;
}
