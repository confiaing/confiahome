import { describe, expect, it } from "vitest";
import { STAGE_COUNT, STAGE_STOPS, SCENE_ITEMS, createSceneItems, curve, segmentOf } from "@/domain/scene/model";
import { BOX_SHAPES, projectScene, type SceneKind } from "@/domain/scene/projection";
import { buildAmount, segmentStates, stageProgress } from "@/domain/scene/state";

// scene-rendering · Un solo modelo para las dos versiones (L4-8)
describe("modelo de la escena", () => {
  it("el camino tiene cinco tramos que terminan en 1", () => {
    expect(STAGE_COUNT).toBe(5);
    expect(STAGE_STOPS).toHaveLength(5);
    expect(STAGE_STOPS.at(-1)).toBe(1);
    expect([...STAGE_STOPS].sort((a, b) => a - b)).toEqual([...STAGE_STOPS]);
  });

  it("es determinista: generarlo dos veces da lo mismo", () => {
    expect(createSceneItems()).toEqual(createSceneItems());
    expect(createSceneItems()).toEqual(SCENE_ITEMS);
  });

  it("cada tramo tiene escalones, su terraza de nueve losas y un poste", () => {
    for (let segment = 0; segment < STAGE_COUNT; segment += 1) {
      const items = SCENE_ITEMS.filter((item) => item.segment === segment);
      expect(items.filter((item) => item.kind === "tile"), `terraza ${segment}`).toHaveLength(9);
      expect(items.filter((item) => item.kind === "post"), `poste ${segment}`).toHaveLength(1);
      expect(items.some((item) => item.kind === "step"), `escalones ${segment}`).toBe(true);
    }
  });

  it("segmentOf asigna cada punto del camino a su tramo", () => {
    expect(segmentOf(0)).toBe(0);
    expect(segmentOf(STAGE_STOPS[0]!)).toBe(0);
    expect(segmentOf(STAGE_STOPS[0]! + 0.01)).toBe(1);
    expect(segmentOf(1)).toBe(4);
  });

  it("el camino sube y avanza", () => {
    expect(curve(1)[0]).toBeGreaterThan(curve(0)[0]);
    expect(curve(1)[1]).toBeGreaterThan(curve(0)[1]);
  });
});

describe("estado por etapa", () => {
  it("en la etapa 3 los tramos 1 a 3 están construidos y los 4 y 5 dispersos", () => {
    expect(segmentStates(3)).toEqual(["built", "built", "built", "scattered", "scattered"]);
  });

  it("antes de la etapa 1 todo está disperso; en la 5, todo construido", () => {
    expect(segmentStates(0)).toEqual(Array(5).fill("scattered"));
    expect(segmentStates(5)).toEqual(Array(5).fill("built"));
  });

  it("una etapa fuera de rango se acota", () => {
    expect(segmentStates(-2)).toEqual(segmentStates(0));
    expect(segmentStates(9)).toEqual(segmentStates(5));
  });

  it("el avance de cada etapa es el final de su tramo", () => {
    expect(stageProgress(0)).toBe(0);
    expect(stageProgress(1)).toBe(STAGE_STOPS[0]);
    expect(stageProgress(5)).toBe(1);
  });

  it("buildAmount va de 0 a 1 sin retroceder y deja construido lo que la etapa alcanza", () => {
    const item = SCENE_ITEMS.find((candidate) => candidate.segment === 2)!;
    let previous = 0;
    for (let progress = 0; progress <= 1.0001; progress += 0.02) {
      const amount = buildAmount(item, progress);
      expect(amount).toBeGreaterThanOrEqual(previous);
      expect(amount).toBeLessThanOrEqual(1);
      previous = amount;
    }
    for (const candidate of SCENE_ITEMS.filter((entry) => entry.segment <= 2)) {
      expect(buildAmount(candidate, stageProgress(3))).toBe(1);
    }
  });
});

// scene-rendering · Versión ligera: proyección isométrica
describe("proyección", () => {
  const ROLES = new Set(["stone", "alt", "dark", "accent"]);

  it.each(["hero", "journey", "closing"] as SceneKind[])("%s: caja de vista finita y solo tonos conocidos", (kind) => {
    const scene = projectScene(kind);
    expect(scene.viewBox.every(Number.isFinite)).toBe(true);
    expect(scene.viewBox[2]).toBeGreaterThan(0);
    expect(scene.viewBox[3]).toBeGreaterThan(0);
    const boxes = scene.groups.flatMap((group) => group.boxes);
    expect(boxes.length).toBeGreaterThan(20);
    for (const box of boxes) {
      expect(ROLES.has(box.tone)).toBe(true);
      expect(Object.keys(BOX_SHAPES)).toContain(box.kind);
      expect(Number.isFinite(box.x) && Number.isFinite(box.y)).toBe(true);
    }
  });

  it("journey: cinco tramos, sus fragmentos, compañeros y números, del último al primero", () => {
    const scene = projectScene("journey");
    const of = (role: string) => scene.groups.filter((group) => group.role === role);
    expect(of("segment").map((group) => group.segment)).toEqual([4, 3, 2, 1, 0]);
    expect(of("fragment").map((group) => group.segment)).toEqual([4, 3, 2, 1, 0]);
    expect(of("companions").map((group) => group.segment)).toEqual([0, 1, 2, 3, 4]);
    expect(of("label").map((group) => group.label?.text)).toEqual(["01", "02", "03", "04", "05"]);
    for (const group of of("companions")) expect(group.circles.map((circle) => circle.role)).toEqual(["comp-a", "comp-b"]);
  });

  it("journey usa todos los bloques del modelo, una vez cada uno", () => {
    const boxes = projectScene("journey").groups.filter((group) => group.role === "segment").flatMap((group) => group.boxes);
    expect(boxes).toHaveLength(SCENE_ITEMS.length);
  });

  it("closing: el camino completo, con cuentas y los dos compañeros al final", () => {
    const scene = projectScene("closing");
    const circles = scene.groups.flatMap((group) => group.circles);
    expect(circles.filter((circle) => circle.role === "bead")).toHaveLength(11);
    expect(circles.filter((circle) => circle.role !== "bead")).toHaveLength(2);
    expect(scene.groups.flatMap((group) => group.boxes)).toHaveLength(SCENE_ITEMS.length);
  });

  it("hero: unos bloques ordenados y el resto dispersos y girados", () => {
    const scene = projectScene("hero");
    const [built, , scattered] = scene.groups;
    expect(built!.boxes.length).toBeGreaterThan(0);
    expect(scattered!.boxes.length).toBeGreaterThan(built!.boxes.length);
    expect(built!.boxes.every((box) => box.rotate === 0)).toBe(true);
    expect(scattered!.boxes.some((box) => box.rotate !== 0)).toBe(true);
  });

  it("es determinista", () => {
    expect(projectScene("journey")).toEqual(projectScene("journey"));
  });

  it("cada tipo de bloque tiene una forma de tres caras de cuatro puntos", () => {
    expect(Object.keys(BOX_SHAPES).sort()).toEqual(["edge", "post", "step", "tile"]);
    for (const shape of Object.values(BOX_SHAPES)) {
      for (const face of [shape.left, shape.right, shape.top]) expect(face).toMatch(/^(-?\d+(\.\d)?,-?\d+(\.\d)?( |$)){4}$/);
    }
    // El poste es alto y estrecho; la losa, ancha y baja.
    expect(BOX_SHAPES.post).not.toEqual(BOX_SHAPES.tile);
  });
});
