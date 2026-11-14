import type { PairKind } from "./contrast";
import type { Theme } from "./tokens";

// Parejas texto/fondo PERMITIDAS en cada tema. Usar una combinación que no esté
// aquí exige añadirla primero y que la prueba de contraste la acepte.
export type Pair = { theme: Theme; foreground: string; background: string; kind: PairKind };

const SURFACES = ["--color-background", "--color-surface"] as const;

function common(theme: Theme): Pair[] {
  const pairs: Pair[] = [];
  for (const background of SURFACES) {
    pairs.push(
      { theme, foreground: "--color-text", background, kind: "text" },
      { theme, foreground: "--color-text-muted", background, kind: "text" },
      { theme, foreground: "--color-link", background, kind: "text" },
      { theme, foreground: "--color-emphasis", background, kind: "text" },
      { theme, foreground: "--color-focus", background, kind: "ui" },
      { theme, foreground: "--color-border-strong", background, kind: "ui" },
    );
  }
  pairs.push(
    { theme, foreground: "--color-on-primary", background: "--color-primary", kind: "text" },
    { theme, foreground: "--color-on-primary", background: "--color-primary-hover", kind: "text" },
    // Mensajes de estado: siempre legibles sobre la superficie de tarjetas y campos.
    { theme, foreground: "--color-error", background: "--color-surface", kind: "text" },
    { theme, foreground: "--color-success", background: "--color-surface", kind: "text" },
  );
  return pairs;
}

export const ALLOWED_PAIRS: Pair[] = [
  ...common("light"),
  { theme: "light", foreground: "--color-text", background: "--color-background-alt", kind: "text" },
  { theme: "light", foreground: "--color-text-muted", background: "--color-background-alt", kind: "text" },
  { theme: "light", foreground: "--color-emphasis", background: "--color-background-alt", kind: "text" },
  { theme: "light", foreground: "--color-text", background: "--color-surface-warm", kind: "text" },
  { theme: "light", foreground: "--color-text", background: "--color-surface-fresh", kind: "text" },
  { theme: "light", foreground: "--color-error", background: "--color-background", kind: "text" },
  { theme: "light", foreground: "--color-success", background: "--color-background", kind: "text" },

  ...common("dark"),
  { theme: "dark", foreground: "--color-error", background: "--color-background", kind: "text" },
  { theme: "dark", foreground: "--color-success", background: "--color-background", kind: "text" },
  { theme: "dark", foreground: "--color-accent", background: "--color-background", kind: "text" },

  ...common("fresh"),
  ...common("coral"),
  ...common("warm"),

  ...common("calm"),
  { theme: "calm", foreground: "--color-error", background: "--color-background", kind: "text" },
  { theme: "calm", foreground: "--color-success", background: "--color-background", kind: "text" },
];
