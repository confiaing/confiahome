# Design

## Context

Motivación y alcance: ver [proposal.md](proposal.md). Requisitos: ver `specs/`.

Estado de partida, comprobado en el código:

- `src/styles/globals.css` solo importa Tailwind con `source(none)`; no hay `tokens.css`.
- `src/components/ui/`, `public/brand/` y `public/fonts/` existen vacíos.
- `src/app/[locale]/layout.tsx` es el único layout raíz y no carga fuentes.
- `home-placeholder.tsx` muestra un título y una nota con textos provisionales propios.
- La regla de lint de L0 prohíbe colores literales en `src/**/*.{ts,tsx}`. No analiza CSS.
- `sharp` ya está instalado como dependencia de Next.js.

La referencia visual es `docs/design/ronda5-cercano-3d-finalista.html` (líneas 15 a 117 para los tokens; `.btn`, `.field`, `.check` y `.card` para los componentes) y `docs/design/logo-conceptos.html` (símbolos `s8`, `s8b` y `s2`; nombre `wm--mix`). Ninguno de los dos se edita.

## Goals / Non-Goals

**Goals:**

- Que los lotes L2 a L5 construyan sin volver a decidir color, tipografía ni estados.
- Que ninguna pieza de este lote añada JavaScript al navegador.
- Que los archivos de marca se puedan regenerar con un comando.

**Non-Goals:**

- Componentes con estado propio (pestañas, diálogo, menú): llegan con su lote.
- Escala completa de espaciado o de tipos: se declaran solo los valores que el diseño finalista usa.
- Una página de catálogo de componentes.

## Decisions

### D1 — Estructura de `tokens.css`

`src/styles/tokens.css`, importado desde `globals.css` después de Tailwind. Tres bloques:

1. `:root` con los 15 primitivos, los roles `--scene-*`, radios, margen lateral y alto de cabecera.
2. `@theme static` con `--color-*: initial` (anula la paleta de Tailwind) y los roles `--color-*` apuntando a primitivos, más `--font-display`, `--font-body` y `--font-mono`. `static` hace que Tailwind emita todas las variables aunque ninguna utilidad las use todavía; la escena las leerá desde JavaScript.
3. Una clase por tema (`.theme-light`, `.theme-dark`, `.theme-fresh`, `.theme-coral`, `.theme-warm`, `.theme-calm`) que reasigna los roles. Cada clase fija además `background-color` y `color`.

Los roles se nombran igual que la utilidad: `bg-background`, `text-text-muted`, `border-border-strong`, `bg-primary`.

*Alternativa:* `@theme inline` con un segundo juego de variables (`--role-*`). Descartada: duplica nombres y los temas tendrían que reasignar variables que Tailwind no ve.

**Diferencia con el finalista:** en su CSS, `theme-fresh`, `theme-coral`, `theme-warm` y `theme-calm` no declaran `--color-error`, `--color-success`, `--color-accent` ni las superficies cálida y fresca: las heredan. Aquí cada tema declara todos los roles con el valor del tema base, para que un tema anidado dentro de `theme-dark` no herede los de este. El resultado visual es el mismo.

*Nivel de prueba:* unitario. La prueba lee `tokens.css` como texto con un analizador mínimo en `tests/support/tokens.ts`.

### D2 — Verificación de contraste

- `tests/support/contrast.ts`: luminancia relativa y razón de contraste de WCAG 2.1. Función pura.
- `tests/support/contrast-pairs.ts`: la lista de parejas permitidas por tema, con roles (no colores) y su umbral: `text` 4,5 · `large` 3 · `ui` 3.
- `tests/unit/contrast.test.ts`: resuelve cada rol a su HEX en cada tema y comprueba el umbral.

Viven en `tests/` porque solo las usa la suite, y `tests/` está exento de la regla de color. Si otra pieza las necesitara, se mueven a `src/lib/`.

Parejas que no son universales y que la lista restringe a propósito: el texto de error solo sobre `surface` y sobre el fondo de los temas base, oscuro y calmado (rojo sobre salvia da 4,2:1 y no se usa); el borde normal (`border`) no es borde de control.

*Alternativa:* herramienta externa de auditoría en E2E. Descartada como única defensa: solo ve lo que hay en pantalla, no todas las parejas permitidas.

### D3 — Tipografías como archivos del repositorio

- Archivos `.woff2` y licencias OFL en `src/styles/fonts/`, tomados de los paquetes de Fontsource (dependencia de desarrollo; se copian una vez).
- `src/styles/fonts.ts` las declara con `next/font/local`: Fraunces variable con eje óptico (normal y cursiva), Figtree variable, DM Mono 400 y 500. Subconjuntos `latin` y `latin-ext`.
- `layout.tsx` aplica las tres variables a `<html>`. Se precargan Fraunces normal y Figtree; el resto, no.
- `next/font` genera el respaldo con métricas ajustadas (`adjustFontFallback`) y `font-display: swap`.
- `public/fonts/` se elimina: `next/font` publica los archivos en `_next/static/media`.

*Alternativa A:* `next/font/google`. Descarga las fuentes de Google en cada build: el build dependería de la red. Descartada.
*Alternativa B:* `@font-face` a mano con archivos en `public/fonts/`. Sin respaldo ajustado ni precarga automática. Descartada.

Se registra en el **ADR-0011**.

*Nivel de prueba:* E2E para origen, familia calculada, cobertura (`document.fonts.check`), precargas y CLS; unitario para licencias y variables.

### D4 — Logo

**Componente** `src/components/ui/logo.tsx`, de servidor:

- Propiedades: `label` (nombre accesible), `variant` (`full` | `symbol`), `className`.
- Raíz `<span role="img" aria-label={label}>`; el SVG y el nombre van con `aria-hidden`.
- Símbolo: SVG en línea con la geometría de `s8`. Tramos con `stroke: currentColor`; quinto tramo y punto con `var(--color-primary)`.
- Nombre: texto real con tres tramos — «conf» en Fraunces peso 450, «IA» en Figtree 700 al 80 % y color `--color-emphasis`, «.ing» en cursiva 400.

El texto de acento usa `--color-emphasis` y no `--color-primary`, porque coral 500 como texto no alcanza contraste sobre crema. En tema oscuro, `--color-emphasis` es coral 300.

**Archivos** en `public/brand/`, generados por `scripts/build-brand-assets.ts` y guardados en el repositorio:

| Archivo | Contenido |
|---|---|
| `logo.svg`, `logo-dark.svg` | Símbolo y nombre en horizontal |
| `logo-compact.svg`, `logo-compact-dark.svg` | Símbolo sobre nombre |
| `symbol.svg`, `symbol-dark.svg` | Solo símbolo |
| `favicon.svg` | Arco continuo y punto (`s2`) sobre ficha crema de esquinas redondeadas |
| `favicon-32.png`, `apple-touch-icon.png` (180 px) | Rasterizados del anterior con `sharp` |

`public/favicon.ico` contiene el PNG de 32 px. El nombre se convierte en trazados con `opentype.js` a partir de las fuentes estáticas de Fontsource, para que los archivos se vean igual sin las fuentes instaladas. La geometría del símbolo (trazados y medidas, sin colores) vive en `src/lib/brand-geometry.ts`; el componente y el script la importan de ahí.

El layout declara los iconos en `metadata.icons` apuntando a `/brand/`.

*Alternativa:* nombre como `<text>` en los SVG. Descartada: fuera del sitio caería en una fuente de respaldo.
*Alternativa:* dibujar los archivos a mano. Descartada: no se podrían regenerar si cambia la paleta.

*Nivel de prueba:* integración para el componente; unitario para los archivos (presencia, sin `<text>`, colores de la paleta, regeneración idéntica); E2E para los iconos.

### D5 — Componentes base

En `src/components/ui/`, todos de servidor, sobre elementos nativos y con estados resueltos en CSS:

| Archivo | Exporta | Notas |
|---|---|---|
| `button.tsx` | `Button`, `ButtonLink` | `variant`: `primary` \| `secondary`; `size`: `md` (52 px) \| `sm` (44 px). Clases compartidas en una función. |
| `text-link.tsx` | `TextLink` | `external` añade `target`, `rel` y un texto oculto que recibe por propiedad. |
| `field.tsx` | `Field` | `multiline` cambia a `<textarea>`. `id` con `useId`. `error` y `hint` se enlazan con `aria-describedby`. |
| `checkbox.tsx` | `Checkbox` | Etiqueta como `children`, para admitir enlaces. |
| `card.tsx` | `Card` | `theme` opcional; `as` para elegir el elemento. |
| `notice.tsx` | `Notice` | `tone`: `error` \| `success` \| `info`; icono SVG decorativo. |

- `src/lib/cx.ts`: une clases condicionales. Sin dependencias.
- El anillo de foco se define una vez en `globals.css` (`:focus-visible`, 3 px, `--color-focus`), como en el finalista.
- Estados de éxito y de error: borde y mensaje con `--color-success` y `--color-error`, siempre acompañados de texto.
- Movimiento: transiciones de color y borde; el botón se desplaza 1 px al pulsar. `globals.css` anula `transform` y acorta transiciones con `prefers-reduced-motion: reduce`.
- Ningún componente contiene texto visible: todo llega por propiedades.

*Alternativa:* una biblioteca de componentes sin estilos. Descartada: estos seis son elementos nativos y la biblioteca añadiría JS de cliente.

*Nivel de prueba:* integración (Testing Library, `user-event`, `vitest-axe`); E2E para foco visible, movimiento reducido y JS inicial.

### D6 — La página provisional como superficie de prueba

`home-placeholder.tsx` pasa a mostrar el logo, el título con la fuente de títulos, la nota, un `ButtonLink` a `mailto:hola@confia.ing` y una etiqueta en DM Mono. Sus textos siguen siendo provisionales y propios del archivo, como en L0; los diccionarios llegan en L2 y la página se sustituye en L3.

*Alternativa:* una ruta de catálogo de componentes. Descartada: es una página más que mantener y que excluir de producción.

### Dependencias

- `components/ui` importa solo `lib` (`cx`). `app` importa `styles`. Sin cambios en la tabla de CLAUDE.md.
- `scripts/` no se importa desde `src/`; el script de marca sí importa `src/lib/brand-geometry.ts`.

## Risks / Trade-offs

- **Una pareja del finalista no alcanza AA** → No se toca la paleta. Se retira la pareja de la lista si no se usa, o se propone al fundador otro rol de entre los 15 colores. Candidata conocida: borde de control índigo 300 sobre superficie índigo 700 en tema oscuro (≈ 2,9:1).
- **`opentype.js` no reproduce bien el nombre** (interletraje, eje óptico) → Comparar el resultado con el componente renderizado. Si difiere a la vista, exportar los trazados desde el navegador con Playwright una sola vez y guardarlos.
- **Las fuentes pesan** (Fraunces variable con eje óptico supera los 100 kB) → Subconjuntos, solo dos precargas, y medición de LCP y CLS en E2E. Si el LCP sube, se recorta el eje óptico a un tamaño fijo.
- **`metadata.icons` con el layout raíz bajo `[locale]`** → Lo cubre el E2E de iconos; el respaldo es `public/favicon.ico`.
- **Textos provisionales en la página de L0** → Excepción ya aceptada en L0, acotada a ese archivo y con fecha de retirada (L3).

## Migration Plan

Nada desplegado todavía. Para revertir basta con revertir el commit del lote.

## Cambios durante la implementación

Lo que se construyó difiere de lo escrito arriba en estos puntos. Donde hay contradicción, vale esta sección.

| Punto | Previsto | Construido | Motivo |
|---|---|---|---|
| D1 · Temas | Clases sin capa | Dentro de `@layer base` | Sin capa ganaban a cualquier utilidad del mismo elemento (`theme-dark bg-surface` no funcionaba). Hallazgo de la revisión. |
| D1 · Roles de escena | Solo en los temas que los cambian | Los 11 en los seis temas | Un tema claro anidado en el oscuro heredaba la escena oscura. |
| D1 · `--color-background-alt` | Sin mención | Arena 200 en todos los temas claros, como en la maqueta; índigo 700 en el oscuro | En la maqueta el oscuro heredaba arena, que no sirve como fondo alterno sobre índigo. |
| D1 · Borde de control en oscuro | Índigo 300 | Índigo 100 | 2,80:1 sobre índigo 700. Decidido por el fundador el 2026-11-14. |
| D3 · Subconjuntos | `latin` y `latin-ext` | Solo `latin` | `next/font/local` no reparte por `unicode-range`. `latin` cubre ES y EN (prueba con fontkit). |
| D3 · Cursiva de Fraunces | Mismo `localFont` | `localFont` aparte, sin precarga, y variable `--font-display-italic` | Un `localFont` precarga todos sus archivos: habrían sido tres precargas. |
| D3 · Respaldo ajustado | Las tres familias | Fraunces y Figtree | `next/font/local` solo ajusta sobre Arial o Times; DM Mono cae en la monoespaciada del sistema. CLS medido: 0,005. |
| D4 · Trazado del nombre | `opentype.js` con fuentes estáticas | `fontkit` con los `.woff2` variables del sitio | `opentype.js` no lee `.woff2`; con fontkit el archivo coincide con el logo en vivo (ADR-0011). |
| D4 · Geometría | `scripts/lib/` | `src/lib/brand-geometry.ts` | Una sola copia para componente y script. |
| D4 · Punto del nombre | «.ing» en cursiva | «.» recto y de acento, «ing» en cursiva | Así está en el concepto elegido (`logo-conceptos.html`, c8). Hallazgo de la revisión. |
| D4 · Colores de los archivos | — | Resueltos desde los roles de `tokens.css` | Si cambia un rol, los archivos lo siguen al regenerar. |
| D4 · Versión compacta | Símbolo sobre nombre | Igual, con el símbolo a 1,75× | A tamaño 1× quedaba pequeño frente al nombre. |
| D5 · Movimiento reducido | `globals.css` anula `transform` | El desplazamiento usa la variante `motion-safe:` | Tailwind v4 mueve con `translate`, no con `transform`. Cualquier desplazamiento futuro debe llevar `motion-safe:`. |
| D5 · `Card` | — | Sin tema usa `--color-surface` | En la maqueta la tarjeta usa el fondo de su propio tema; aquí una tarjeta sin tema es una superficie del tema que la contiene. |
| D5 · Texto en componentes | Ninguno | El `Logo` lleva el nombre de marca | No se traduce. |
| D5 · Enlaces | — | Todo `<a>` va subrayado por defecto | El reinicio de Tailwind quita el subrayado y el enlace quedaba distinguido solo por color. |

**Limitaciones aceptadas**

- La lista de parejas permitidas es una convención: nada impide en tiempo de compilación poner un mensaje de error sobre salvia o coral (4,3:1 y 2,7:1). `Field` y `Checkbox` lo documentan; el formulario real va en tarjeta sobre el tema calma. Se comprobará con axe en navegador cuando exista (L5).
- La prueba de paleta no detecta colores con nombre (`black`) en `tokens.css`.
- `shadow-*` de Tailwind sigue usando su negro translúcido por defecto; el diseño no usa sombras. Si se necesitan, se definen en `tokens.css`.
- El coral 500 como elemento gráfico (quinto tramo, punto, casilla marcada) no alcanza 3:1 sobre fondos claros. En el logo está exento; la casilla se revisa en L5.
- La cursiva «ing» del logo no se precarga: se pinta un instante con la fuente de respaldo. Se medirá con la cabecera real en L2.
- `Notice` fija el rol, pero el anuncio fiable de un aviso que aparece tras una acción depende de que su contenedor exista antes; lo resuelve el formulario en L5.
