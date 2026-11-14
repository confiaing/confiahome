import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { SceneSlot } from "@/components/journey/scene/scene-slot";
import { SCENE_ITEMS } from "@/domain/scene/model";
import type { SceneKind } from "@/domain/scene/projection";

const KINDS: SceneKind[] = ["hero", "journey", "closing"];

// scene-rendering · Versión ligera en el HTML (L4-7)
describe.each(KINDS)("ranura %s", (kind) => {
  it("es decorativa: oculta a las tecnologías de apoyo y sin elementos enfocables", async () => {
    const { container } = render(<SceneSlot kind={kind} className="relative h-40" />);
    const slot = container.querySelector(`[data-scene="${kind}"]`)!;
    expect(slot).toHaveAttribute("aria-hidden", "true");
    const svg = slot.querySelector("svg")!;
    expect(svg).toHaveAttribute("focusable", "false");
    expect(svg.getAttribute("viewBox")).toMatch(/^-?\d+ -?\d+ \d+ \d+$/);
    expect(slot.querySelectorAll("a, button, [tabindex]")).toHaveLength(0);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("no lleva ningún color literal: los pone el CSS desde los roles de la escena", () => {
    const { container } = render(<SceneSlot kind={kind} className="relative h-40" />);
    const html = container.innerHTML;
    expect(html).not.toMatch(/#[0-9a-f]{3,8}\b(?!-)|rgb|hsl|fill=|stroke=|style=/i);
    const tones = new Set([...container.querySelectorAll("[data-tone]")].map((box) => box.getAttribute("data-tone")));
    for (const tone of tones) expect(["stone", "alt", "dark", "accent"]).toContain(tone);
  });

  it("define cada forma una vez, con sus tres caras, y cada bloque la reutiliza", () => {
    const { container } = render(<SceneSlot kind={kind} className="relative h-40" />);
    const symbols = [...container.querySelectorAll("symbol")];
    expect(symbols.map((symbol) => symbol.id).sort()).toEqual(["edge", "post", "step", "tile"].map((shape) => `scene-${kind}-${shape}`));
    for (const symbol of symbols) {
      expect([...symbol.querySelectorAll("polygon")].map((face) => face.getAttribute("data-face"))).toEqual(["left", "right", "top"]);
    }
    const blocks = [...container.querySelectorAll("use[data-tone]")];
    expect(blocks.length).toBeGreaterThan(20);
    const ids = new Set(symbols.map((symbol) => `#${symbol.id}`));
    for (const block of blocks) expect(ids.has(block.getAttribute("href")!)).toBe(true);
    // Los polígonos son los de las formas: la ilustración no repite geometría por bloque.
    expect(container.querySelectorAll("polygon")).toHaveLength(12);
  });
});

describe("ranura del recorrido", () => {
  it("agrupa los bloques por tramo, con fragmentos, compañeros y números", () => {
    const { container } = render(<SceneSlot kind="journey" className="relative h-40" />);
    const groups = (role: string) => [...container.querySelectorAll(`[data-role="${role}"]`)];
    expect(groups("segment").map((group) => group.getAttribute("data-segment")).sort()).toEqual(["0", "1", "2", "3", "4"]);
    expect(groups("fragment")).toHaveLength(5);
    expect(groups("companions")).toHaveLength(5);
    expect(groups("label").map((group) => group.textContent)).toEqual(["01", "02", "03", "04", "05"]);
    const inSegments = groups("segment").reduce((total, group) => total + group.querySelectorAll("[data-tone]").length, 0);
    expect(inSegments).toBe(SCENE_ITEMS.length);
  });
});

describe("varias ilustraciones en la misma página", () => {
  it("no repiten identificadores", () => {
    const { container } = render(
      <>
        <SceneSlot kind="hero" className="relative h-40" />
        <SceneSlot kind="journey" className="relative h-40" />
        <SceneSlot kind="closing" className="relative h-40" />
      </>,
    );
    const ids = [...container.querySelectorAll("[id]")].map((element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("ranuras de hero y cierre", () => {
  it("no dependen de la etapa", () => {
    for (const kind of ["hero", "closing"] as const) {
      const { container, unmount } = render(<SceneSlot kind={kind} className="relative h-40" />);
      expect(container.querySelectorAll('[data-role="segment"], [data-role="fragment"], [data-role="label"]')).toHaveLength(0);
      unmount();
    }
  });

  it("el cierre lleva las cuentas del camino y los dos compañeros", () => {
    const { container } = render(<SceneSlot kind="closing" className="relative h-40" />);
    expect(container.querySelectorAll('circle[data-circle="bead"]')).toHaveLength(11);
    expect(container.querySelectorAll('circle[data-circle="comp-a"], circle[data-circle="comp-b"]')).toHaveLength(2);
  });
});
