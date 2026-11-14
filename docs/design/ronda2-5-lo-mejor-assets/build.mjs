// Genera ../ronda2-5-lo-mejor.html a partir de template.html:
// incrusta scene-states.js y las versiones SVG estaticas de cada estado de la escena.
// Uso: node build.mjs   (el HTML resultante no necesita build para servirse)
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const statesSrc = readFileSync(join(here, 'scene-states.js'), 'utf8');
const confiaStates = new Function(statesSrc + '; return confiaStates;')();

const LIT = [0, 0.18, 0.38, 0.58, 0.8, 1];
function svg(k, N, label) {
  const st = confiaStates(N, 20261114);
  const ry = k === 5 ? 0.45 : 0.28, rx = k === 5 ? -0.32 : -0.16;
  const cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx);
  const groups = { ash: [], lit: [], ember: [] };
  for (let i = 0; i < N; i++) {
    let x = st.pos[k][i * 3], y = st.pos[k][i * 3 + 1], z = st.pos[k][i * 3 + 2];
    const x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
    const y1 = y * cx - z1 * sx, z2 = y * sx + z1 * cx;
    const p = 1 / (1 - z2 * 0.1);
    const px = Math.round(x1 * p * 100), py = Math.round(-y1 * p * 100);
    if (px < -179 || px > 179 || py < -114 || py > 114) continue;
    const g = st.role[i] ? 'ember' : (st.r2[i] < LIT[k] ? 'lit' : 'ash');
    groups[g].push(`M${px} ${py}h0`);
  }
  const path = (c, w) => groups[c].length ? `<path class="sv-${c}" stroke-width="${w}" d="${groups[c].join('')}"/>` : '';
  return `<svg class="scene-svg" viewBox="-180 -115 360 230" role="img" aria-label="${label}" focusable="false" fill="none" stroke-linecap="round">${path('ash', 2.1)}${path('lit', 2.6)}${path('ember', 3)}</svg>`;
}
const labels = [
  'Puntos dispersos atravesados por un hilo naranja: el trabajo manual de una empresa antes de ordenarlo.',
  'Dos arcos que se enlazan, uno claro y uno naranja: la primera conversación.',
  'Los puntos ordenados en una retícula y un marco naranja sobre una zona: las oportunidades priorizadas.',
  'Una ruta ascendente con cinco hitos: el roadmap.',
  'Un circuito con tres arcos que giran dentro: los ciclos del piloto.',
  'Una esfera completa de puntos claros con una órbita naranja alrededor: la solución en manos de tu equipo.'
];
let html = readFileSync(join(here, 'template.html'), 'utf8');
html = html.replace('/*@@STATES@@*/', () => statesSrc);
for (let k = 0; k < 6; k++) html = html.replaceAll(`<!--@@SVG${k}@@-->`, () => svg(k, k === 0 ? 760 : 620, labels[k]));
if (/@@(SVG|STATES)/.test(html)) throw new Error('marcador sin resolver');
writeFileSync(join(here, '..', 'ronda2-5-lo-mejor.html'), html);
console.log('ok', (html.length / 1024).toFixed(1) + ' KB');
