// Geometría del logo: medidas y trazados, sin colores. La comparten el componente
// Logo y el script que genera los archivos de public/brand/.
// Origen: docs/design/logo-conceptos.html, símbolos s8 (cinco tramos) y s2 (favicon).

export const SYMBOL_SIZE = 32;

const round = (value: number) => Math.round(value * 100) / 100;

function point(cx: number, cy: number, radius: number, degrees: number): string {
  const radians = (degrees * Math.PI) / 180;
  return `${round(cx + radius * Math.cos(radians))} ${round(cy + radius * Math.sin(radians))}`;
}

// La «c» abre hacia la derecha: el arco va de −40° a +40° pasando por la izquierda.
const CENTER = { x: 14.4, y: 16 };
const RADIUS = 11;
const OPENING = 40;
const SEGMENT_LENGTH = 8.35;
const GAP_LENGTH = 3;

export const SYMBOL_STROKE_WIDTH = 5.4;
export const SEGMENT_COUNT = 5;

const toDegrees = (length: number) => (length / RADIUS) * (180 / Math.PI);

/** Los cinco tramos, del primero (arriba a la derecha) al quinto (abajo a la derecha). */
export const SYMBOL_SEGMENTS: readonly string[] = Array.from({ length: SEGMENT_COUNT }, (_, index) => {
  const start = -OPENING - index * toDegrees(SEGMENT_LENGTH + GAP_LENGTH);
  const end = start - toDegrees(SEGMENT_LENGTH);
  return `M${point(CENTER.x, CENTER.y, RADIUS, start)}A${RADIUS} ${RADIUS} 0 0 0 ${point(CENTER.x, CENTER.y, RADIUS, end)}`;
});

/** El punto en la abertura: lo que sigue en marcha, el «.ing». */
export const SYMBOL_DOT = { cx: 26.6, cy: 16, r: 3.3 } as const;

/** Favicon reducido: a 16 px los cinco tramos se funden en un arco continuo. */
export const FAVICON_ARC = {
  d: `M${point(14, 16, 10, -45)}A10 10 0 1 0 ${point(14, 16, 10, 45)}`,
  strokeWidth: 5,
} as const;
export const FAVICON_DOT = { cx: 26.6, cy: 16, r: 3.7 } as const;

/** Proporciones del nombre respecto a su cuerpo de letra. */
export const WORDMARK = {
  /** Alto del símbolo en em del nombre. */
  symbolEm: 1.3,
  /** Separación entre símbolo y nombre, en em. */
  gapEm: 0.42,
  weight: 450,
  opticalSize: 72,
  tracking: -0.025,
  ia: { scale: 0.8, weight: 700, tracking: 0.01 },
  ing: { weight: 400 },
} as const;
