import { STAGE_COUNT, STAGE_STOPS, type SceneItem } from "./model.ts";

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** Avance del recorrido (0 a 1) al que corresponde una etapa: 0 es «antes de empezar». */
export function stageProgress(stage: number): number {
  const index = clamp(Math.round(stage), 0, STAGE_COUNT);
  return index === 0 ? 0 : STAGE_STOPS[index - 1]!;
}

/** Cuánto está construido un bloque para un avance dado: 0 disperso, 1 en su sitio. */
export function buildAmount(item: SceneItem, progress: number): number {
  const x = clamp((progress - (item.buildAt - 0.14)) / 0.14, 0, 1);
  return x * x * (3 - 2 * x);
}

export type SegmentState = "built" | "scattered";

/** Estado de cada tramo cuando la etapa seleccionada es `stage` (1 a 5; 0, ninguna). */
export function segmentStates(stage: number): SegmentState[] {
  const reached = clamp(Math.round(stage), 0, STAGE_COUNT);
  return Array.from({ length: STAGE_COUNT }, (_, segment) => (segment < reached ? "built" : "scattered"));
}
