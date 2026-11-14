// Modelo de la escena del recorrido: un camino de cinco tramos hecho de bloques.
// De aquí derivan las dos versiones —el SVG ligero y la escena 3D— para que no puedan
// divergir (ADR-0009). Portado del diseño finalista; es determinista: misma semilla,
// mismos bloques.

export type Vec3 = readonly [x: number, y: number, z: number];

export const STAGE_COUNT = 5;

/** Punto del camino (de 0 a 1) donde termina cada tramo y está su terraza. */
export const STAGE_STOPS: readonly number[] = [0.12, 0.34, 0.56, 0.78, 1];

export type ItemKind = "step" | "edge" | "tile" | "post";
export type ItemTone = "stone" | "alt" | "dark" | "accent";

export type SceneItem = {
  /** Posición sobre el camino, de 0 a 1. */
  t: number;
  /** Avance del recorrido a partir del cual el bloque queda construido. */
  buildAt: number;
  /** Desplazamiento a lo largo del camino, en altura y hacia el lado. */
  along: number;
  lift: number;
  side: number;
  size: Vec3;
  tone: ItemTone;
  kind: ItemKind;
  /** Tramo al que pertenece, de 0 a 4. */
  segment: number;
  /** Hacia dónde flota cuando aún no está construido. */
  scatter: Vec3;
  axis: Vec3;
  angle: number;
  spin: number;
  phase: number;
};

const TAU = Math.PI * 2;

/** Generador pseudoaleatorio con semilla (mulberry32): mismos valores en servidor y navegador. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 1831565813) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** El camino: avanza en x, sube en y y serpentea en z. */
export function curve(t: number): Vec3 {
  return [-13 + 26 * t, 5 * t, Math.sin(t * TAU) * 3.5];
}

/** Dirección del camino en el plano del suelo, normalizada. */
export function tangent(t: number): readonly [x: number, z: number] {
  const tx = 26;
  const tz = TAU * 3.5 * Math.cos(t * TAU);
  const length = Math.hypot(tx, tz);
  return [tx / length, tz / length];
}

export function segmentOf(t: number): number {
  for (let segment = 0; segment < STAGE_COUNT; segment += 1) {
    if (t <= STAGE_STOPS[segment]! + 1e-6) return segment;
  }
  return STAGE_COUNT - 1;
}

export function createSceneItems(): SceneItem[] {
  const random = seeded(11);
  const items: SceneItem[] = [];

  const add = (t: number, buildAt: number, along: number, lift: number, side: number, size: Vec3, tone: ItemTone, kind: ItemKind) => {
    items.push({
      t,
      buildAt,
      along,
      lift,
      side,
      size,
      tone,
      kind,
      segment: segmentOf(t),
      scatter: [(random() - 0.5) * 11, 0.8 + random() * 4.6, (random() - 0.5) * 10],
      axis: [random() - 0.5, random() - 0.5, random() - 0.5],
      angle: random() * TAU,
      spin: (random() - 0.5) * 0.5,
      phase: random() * TAU,
    });
  };

  // Escalones a lo largo del camino, con bordillos alternos; se dejan huecos para las terrazas.
  let index = 0;
  for (let t = 0; t <= 1.0001; t += 0.015, index += 1) {
    if (STAGE_STOPS.some((stop) => Math.abs(t - stop) < 0.04)) continue;
    const tone: ItemTone = random() < 0.2 ? "alt" : random() < 0.14 ? "dark" : "stone";
    add(t, t, 0, 0, 0, [0.36, 0.16, 1.7], tone, "step");
    if (index % 2 === 0) {
      add(t, t, 0, 0.13, 1.03, [0.13, 0.13, 0.13], "dark", "edge");
      add(t, t, 0, 0.13, -1.03, [0.13, 0.13, 0.13], "dark", "edge");
    }
  }

  // Una terraza de nueve losas y un poste de acento al final de cada tramo.
  for (const stop of STAGE_STOPS) {
    for (let a = -1; a <= 1; a += 1) {
      for (let b = -1; b <= 1; b += 1) {
        add(stop, stop - random() * 0.035, a * 0.8, 0.02, b * 0.8, [0.72, 0.2, 0.72], a === 0 && b === 0 ? "alt" : "stone", "tile");
      }
    }
    add(stop, stop, 0.8, 0.62, -0.8, [0.2, 1, 0.2], "accent", "post");
  }

  return items;
}

export const SCENE_ITEMS: readonly SceneItem[] = createSceneItems();
