import { SCENE_ITEMS, STAGE_COUNT, STAGE_STOPS, curve, type ItemKind, type ItemTone, type SceneItem, type Vec3 } from "./model.ts";
import { buildAmount } from "./state.ts";

// Versión ligera de la escena: el mismo modelo en proyección isométrica. Devuelve
// geometría y nombres de rol; los colores los pone quien pinta, desde los tokens.

export type SceneKind = "hero" | "journey" | "closing";

/** Las tres caras visibles de un tipo de bloque, como listas de puntos relativas a su centro. */
export type BoxShape = { left: string; right: string; top: string };

/** Un bloque colocado: qué forma usa, de qué tono y dónde va. */
export type ProjectedBox = {
  kind: ItemKind;
  tone: ItemTone;
  x: number;
  y: number;
  /** Giro en grados; 0 cuando el bloque está en su sitio. */
  rotate: number;
};

export type ProjectedCircle = { role: "comp-a" | "comp-b" | "bead"; cx: number; cy: number; r: number };

export type SceneGroup = {
  /** Qué representa el grupo; `segment` y `fragment` reaccionan a la etapa elegida. */
  role: "segment" | "fragment" | "companions" | "label" | "static";
  /** Tramo al que pertenece (0 a 4), o null si no depende de la etapa. */
  segment: number | null;
  boxes: ProjectedBox[];
  circles: ProjectedCircle[];
  label?: { x: number; y: number; text: string };
};

export type ProjectedScene = {
  /** minX, minY, ancho, alto. */
  viewBox: [number, number, number, number];
  groups: SceneGroup[];
};

const SCALE = 20;
const PADDING = 34;
const round = (value: number) => Math.round(value * 10) / 10;

type Point = [number, number];
const project = (x: number, y: number, z: number): Point => [(x + z) * 0.866 * SCALE, ((z - x) * 0.5 - y) * SCALE];

const corners = (points: Vec3[]) =>
  points
    .map(([x, y, z]) => {
      const [px, py] = project(x, y, z);
      return `${round(px)},${round(py)}`;
    })
    .join(" ");

/**
 * Todos los bloques de un mismo tipo tienen el mismo tamaño, así que comparten forma:
 * quien pinta la define una vez y la reutiliza en cada bloque.
 */
export const BOX_SHAPES: Record<ItemKind, BoxShape> = Object.fromEntries(
  (["step", "edge", "tile", "post"] as const).map((kind) => {
    const [hm, h, hl] = SCENE_ITEMS.find((item) => item.kind === kind)!.size.map((side) => side / 2) as [number, number, number];
    return [
      kind,
      {
        left: corners([[-hm, h, -hl], [-hm, h, hl], [-hm, -h, hl], [-hm, -h, -hl]]),
        right: corners([[-hm, h, hl], [hm, h, hl], [hm, -h, hl], [-hm, -h, hl]]),
        top: corners([[-hm, h, -hl], [hm, h, -hl], [hm, h, hl], [-hm, h, hl]]),
      },
    ];
  }),
) as Record<ItemKind, BoxShape>;

const ordered = (item: SceneItem): Vec3 => {
  const [x, y, z] = curve(item.t);
  return [x + item.along, y + item.lift, z + item.side];
};
const scattered =
  (factor: number) =>
  (item: SceneItem): Vec3 => {
    const [x, y, z] = ordered(item);
    return [x + item.scatter[0] * factor, y + item.scatter[1] * factor, z + item.scatter[2] * factor];
  };

/** Orden de pintado: de atrás hacia delante. */
const depth = (position: Vec3) => (position[2] - position[0]) * 100 + position[1];

export function projectScene(kind: SceneKind): ProjectedScene {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  const extend = ([x, y]: Point) => {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  };

  const box = (item: SceneItem, position: Vec3, rotate: number): ProjectedBox => {
    const origin = project(...position);
    extend(origin);
    return { kind: item.kind, tone: item.tone, x: round(origin[0]), y: round(origin[1]), rotate };
  };

  const draw = (items: readonly SceneItem[], place: (item: SceneItem) => Vec3, tilt = false): ProjectedBox[] =>
    items
      .map((item) => ({ item, position: place(item) }))
      .sort((a, b) => depth(a.position) - depth(b.position))
      .map(({ item, position }) => box(item, position, tilt ? Math.round((item.angle / (Math.PI * 2) - 0.5) * 80) : 0));

  /** Las dos esferas que recorren el camino juntas: tú y nosotros. */
  const companions = (progress: number): ProjectedCircle[] => {
    const [x, y, z] = curve(progress);
    const a = project(x - 0.1, y + 0.36, z - 0.3);
    const b = project(x + 0.1, y + 0.36, z + 0.3);
    return [
      { role: "comp-a", cx: round(a[0]), cy: round(a[1]), r: 4.6 },
      { role: "comp-b", cx: round(b[0]), cy: round(b[1]), r: 4.6 },
    ];
  };

  const group = (partial: Partial<SceneGroup> & Pick<SceneGroup, "role">): SceneGroup => ({
    segment: null,
    boxes: [],
    circles: [],
    ...partial,
  });

  const groups: SceneGroup[] = [];
  const inSegment = (segment: number) => SCENE_ITEMS.filter((item) => item.segment === segment);

  if (kind === "hero") {
    // El principio: unos pocos bloques ya en su sitio y el resto todavía en el aire.
    const start = 0.06;
    groups.push(group({ role: "static", boxes: draw(SCENE_ITEMS.filter((item) => buildAmount(item, start) > 0.5), ordered) }));
    groups.push(group({ role: "static", circles: companions(0.04) }));
    groups.push(group({ role: "static", boxes: draw(SCENE_ITEMS.filter((item) => buildAmount(item, start) <= 0.5), scattered(0.8), true) }));
  } else if (kind === "journey") {
    // El camino entero por tramos; la etapa elegida decide cuáles se ven construidos.
    for (let segment = STAGE_COUNT - 1; segment >= 0; segment -= 1) {
      groups.push(group({ role: "segment", segment, boxes: draw(inSegment(segment), ordered) }));
    }
    for (let segment = STAGE_COUNT - 1; segment >= 0; segment -= 1) {
      const fragments = SCENE_ITEMS.filter((item, index) => item.segment === segment && item.kind !== "edge" && index % 2 === 0);
      groups.push(group({ role: "fragment", segment, boxes: draw(fragments, scattered(0.5), true) }));
    }
    for (let segment = 0; segment < STAGE_COUNT; segment += 1) {
      groups.push(group({ role: "companions", segment, circles: companions(STAGE_STOPS[segment]!) }));
    }
    for (let segment = 0; segment < STAGE_COUNT; segment += 1) {
      const [x, y, z] = curve(STAGE_STOPS[segment]!);
      const at = project(x, y + 2.1, z);
      extend(at);
      groups.push(group({ role: "label", segment, label: { x: round(at[0]), y: round(at[1]), text: `0${segment + 1}` } }));
    }
  } else {
    // El final: el camino completo, con las cuentas de lo andado.
    for (let segment = STAGE_COUNT - 1; segment >= 0; segment -= 1) {
      groups.push(group({ role: "static", boxes: draw(inSegment(segment), ordered) }));
    }
    const beads: ProjectedCircle[] = [];
    for (let bead = 1; bead < 12; bead += 1) {
      const [x, y, z] = curve(bead / 12.6);
      const at = project(x, y + 0.6, z);
      beads.push({ role: "bead", cx: round(at[0]), cy: round(at[1]), r: 2.4 });
    }
    groups.push(group({ role: "static", circles: beads }));
    groups.push(group({ role: "static", circles: companions(1) }));
  }

  return {
    viewBox: [Math.round(minX - PADDING), Math.round(minY - PADDING), Math.round(maxX - minX + PADDING * 2), Math.round(maxY - minY + PADDING * 2)],
    groups,
  };
}
