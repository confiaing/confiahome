// De dónde salen los servicios del servidor. Sin dependencias: lo usan la validación
// completa del entorno (env.ts) y la tarea diaria del Worker (maintenance.ts), que no
// carga con aquella.

export const SERVICE_MODES = ["memory", "real"] as const;
export type ServiceMode = (typeof SERVICE_MODES)[number];

export type EnvSource = Record<string, string | undefined>;

export class EnvError extends Error {
  override readonly name = "EnvError";
}

/**
 * SERVICES=memory  adaptadores en memoria, sin red (por defecto).
 * SERVICES=real    servicios reales; exige sus secretos.
 */
export function readServiceMode(source: EnvSource): ServiceMode {
  const mode = source.SERVICES?.trim() || "memory";
  if (!(SERVICE_MODES as readonly string[]).includes(mode)) {
    // No se incluye el valor recibido: un mensaje de error nunca repite contenido del entorno.
    throw new EnvError(`SERVICES no es válido. Valores admitidos: ${SERVICE_MODES.join(", ")}.`);
  }
  return mode as ServiceMode;
}
