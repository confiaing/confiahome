# ADR-0011: Fuentes y archivos de marca guardados en el repositorio

**Estado:** Aceptada · **Fecha:** 2026-11-14 · **Decide:** fundador de Confia.ing (propuesta del lote L1)

## Contexto

El [ADR-0007](0007-tokens-de-diseno.md) fijó tipografías auto-alojadas con `next/font`, sin decir de dónde salen los archivos. El lote L1 necesita además los archivos del logo (SVG, PNG e icono), que deben verse igual fuera del sitio, donde las fuentes no están instaladas.

## Decisión

1. **Fuentes:** los `.woff2` y sus licencias SIL OFL se guardan en `src/styles/fonts/` y se declaran con `next/font/local` en `src/styles/fonts.ts`. Proceden de los paquetes de Fontsource, que quedan como dependencia de desarrollo para poder actualizarlos.
2. **Subconjunto:** solo `latin`. Cubre español e inglés; una prueba comprueba glifo a glifo los acentos y signos del español.
3. **Precarga:** solo Fraunces (normal) y Figtree. La cursiva de Fraunces y DM Mono se cargan sin precarga.
4. **Archivos de marca:** `scripts/build-brand-assets.ts` genera `public/brand/` y `public/favicon.ico` a partir de la geometría del logo (`src/lib/brand-geometry.ts`), los colores de `tokens.css` y las fuentes del proyecto. El nombre se convierte en trazados con `fontkit`. Los archivos generados se guardan en el repositorio y una prueba comprueba que regenerarlos da el mismo resultado.

## Opciones consideradas

| Opción | Por qué no |
|---|---|
| `next/font/google` | Descarga las fuentes de Google en cada build: el build dependería de la red y de un tercero. |
| `@font-face` a mano con archivos en `public/fonts/` | Sin respaldo de métricas ajustadas ni precarga automática; más riesgo de salto de diseño. |
| Subconjuntos `latin` y `latin-ext` | `next/font/local` no reparte por `unicode-range`: habría que descargar ambos siempre. Los textos son solo ES y EN. |
| Nombre como `<text>` en los SVG | Fuera del sitio caería en una fuente de respaldo. |
| SVG dibujados a mano | No se podrían regenerar si cambian la paleta o la geometría. |
| `opentype.js` para trazar el nombre | No lee `.woff2`: habría exigido archivos de fuente distintos de los que sirve el sitio, sin el eje de tamaño óptico que usa el logo. |

## Consecuencias

- El build no necesita red para las fuentes y el sitio no hace peticiones a terceros por ellas.
- Peso de fuentes: unos 200 kB en total, de los que se precargan 87 kB (Fraunces 67 kB, Figtree 20 kB).
- Añadir un idioma con caracteres fuera de `latin` exige cambiar los archivos; la prueba de cobertura lo detectaría.
- Cambiar la paleta o el logo obliga a ejecutar `npm run brand:build`; si se olvida, la prueba de regeneración falla.
- `fontkit` y `sharp` son dependencias de desarrollo: no entran en el Worker ni en el navegador.
