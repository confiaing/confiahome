// Qué versión de la escena se sirve: completa (3D) o ligera (SVG). Lógica pura: quien
// la llama reúne las capacidades del navegador y la elección guardada (ADR-0009).

export type SceneMode = "full" | "lite";

/** Por qué la versión es ligera. Los dos últimos solo ocurren con la escena en marcha. */
export type LiteReason =
  | "no-webgl"
  | "chosen"
  | "reduced-motion"
  | "save-data"
  | "slow-connection"
  | "low-end-device"
  | "load-failed"
  | "context-lost";

/** Lo que el navegador dice de sí mismo. Lo que no informa llega como `undefined`. */
export type Capabilities = {
  webgl: boolean;
  reducedMotion: boolean;
  saveData?: boolean;
  /** `navigator.connection.effectiveType`: «slow-2g», «2g», «3g», «4g». */
  effectiveType?: string;
  /** `navigator.deviceMemory`, en GB. */
  deviceMemory?: number;
  hardwareConcurrency?: number;
};

export type ModeDecision = { mode: SceneMode; reason: LiteReason | null };

const lite = (reason: LiteReason): ModeDecision => ({ mode: "lite", reason });

export function decideMode(capabilities: Capabilities, preference: SceneMode | null): ModeDecision {
  // Sin WebGL no hay escena 3D posible, se haya elegido lo que se haya elegido.
  if (!capabilities.webgl) return lite("no-webgl");

  // La elección del visitante manda sobre cualquier criterio automático.
  if (preference === "full") return { mode: "full", reason: null };
  if (preference === "lite") return lite("chosen");

  if (capabilities.reducedMotion) return lite("reduced-motion");
  if (capabilities.saveData) return lite("save-data");
  if (/(^|-)2g$|^3g$/.test(capabilities.effectiveType ?? "")) return lite("slow-connection");
  const memory = capabilities.deviceMemory;
  const cores = capabilities.hardwareConcurrency;
  if ((memory !== undefined && memory <= 2) || (cores !== undefined && cores <= 2)) return lite("low-end-device");

  return { mode: "full", reason: null };
}
