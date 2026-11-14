// Contraste según WCAG 2.1 (luminancia relativa y razón de contraste).
export type PairKind = "text" | "large" | "ui";

export const THRESHOLD: Record<PairKind, number> = { text: 4.5, large: 3, ui: 3 };

function channel(value: number): number {
  const srgb = value / 255;
  return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex: string): number {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!match) throw new Error(`Color no admitido: ${hex}`);
  const [r, g, b] = [match[1]!, match[2]!, match[3]!].map((part) => channel(parseInt(part, 16)));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light! + 0.05) / (dark! + 0.05);
}

export type PairCheck = {
  theme: string;
  foreground: string;
  background: string;
  kind: PairKind;
  ratio: number;
  passes: boolean;
  message: string;
};

export function checkPair(input: {
  theme: string;
  foreground: { role: string; hex: string };
  background: { role: string; hex: string };
  kind: PairKind;
}): PairCheck {
  const ratio = contrastRatio(input.foreground.hex, input.background.hex);
  const passes = ratio >= THRESHOLD[input.kind];
  const verdict = passes ? "cumple" : "no cumple";
  return {
    theme: input.theme,
    foreground: input.foreground.role,
    background: input.background.role,
    kind: input.kind,
    ratio,
    passes,
    message: `${input.theme}: ${input.foreground.role} sobre ${input.background.role} ${verdict} (${ratio.toFixed(2)}:1, mínimo ${THRESHOLD[input.kind]}:1)`,
  };
}
