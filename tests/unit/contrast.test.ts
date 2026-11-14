import { describe, expect, it } from "vitest";
import { checkPair, contrastRatio } from "../support/contrast";
import { ALLOWED_PAIRS } from "../support/contrast-pairs";
import { PALETTE } from "../support/palette";
import { THEMES, loadTokens, resolve } from "../support/tokens";

// design-tokens · Contraste AA en las parejas permitidas (L1-2)
describe("cálculo de contraste", () => {
  it("negro sobre blanco da 21:1 y un color consigo mismo, 1:1", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    expect(contrastRatio("#FF6B4A", "#FF6B4A")).toBeCloseTo(1, 5);
  });

  it("blanco sobre coral 500 no cumple y el informe lo explica", () => {
    const result = checkPair({
      theme: "light",
      foreground: { role: "--white", hex: PALETTE["--white"]! },
      background: { role: "--color-primary", hex: PALETTE["--coral-500"]! },
      kind: "text",
    });
    expect(result.passes).toBe(false);
    expect(result.message).toContain("light");
    expect(result.message).toContain("--white");
    expect(result.message).toContain("--color-primary");
    expect(result.message).toMatch(/no cumple \(\d\.\d\d:1/);
  });
});

describe("parejas permitidas", () => {
  const tokens = loadTokens();
  const results = ALLOWED_PAIRS.map((pair) =>
    checkPair({
      theme: pair.theme,
      foreground: { role: pair.foreground, hex: resolve(tokens, pair.theme, pair.foreground) },
      background: { role: pair.background, hex: resolve(tokens, pair.theme, pair.background) },
      kind: pair.kind,
    }),
  );

  it("todas alcanzan su umbral", () => {
    expect(results.filter((result) => !result.passes).map((result) => result.message)).toEqual([]);
  });

  it.each(THEMES)("el tema %s cubre texto, atenuado, enlace, foco y acción principal", (theme) => {
    const covered = new Set(
      ALLOWED_PAIRS.filter((pair) => pair.theme === theme).map((pair) => pair.foreground),
    );
    for (const role of ["--color-text", "--color-text-muted", "--color-link", "--color-focus", "--color-on-primary"]) {
      expect(covered, `${role} en ${theme}`).toContain(role);
    }
  });
});
