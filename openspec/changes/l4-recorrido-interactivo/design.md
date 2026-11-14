# Design

## Context

Motivación y alcance: ver [proposal.md](proposal.md). Requisitos: ver `specs/`.

Estado de partida, comprobado en el código:

- `journey-overview.tsx` pinta las cinco etapas como `<ol>` de `<article>` con un `<dl>` de tres apartados. Es de servidor.
- `hero.tsx` deja libre la mitad derecha; `closing.tsx` no tiene imagen.
- `tokens.css` declara los once roles `--scene-*` en los seis temas.
- `src/domain/scene/` existe vacío. La regla de lint del dominio solo admite `zod`.
- Único componente de cliente: `nav-disclosure.tsx`. JS inicial: 135,7 kB de 200 kB.
- `globals.css` ya usa `@media (scripting: none)` para el menú.

Referencia: `docs/design/ronda5-cercano-3d-finalista.html`. El modelo (`MODEL`, `curve`, `STOPS`, `buildAmount`), el SVG isométrico (`buildSVG`, `svgStage`), las pestañas (`selectStage`), la elección de modo (`autoLiteReason`, `setMode`) y la escena (`createScene`) están en su `<script>`, líneas 926 a 1430. Se portan a TypeScript; no se copia su carga de Three.js desde un CDN.

## Goals / Non-Goals

**Goals:**

- Que la página sea completa en versión ligera: el 3D es una mejora, nunca un requisito.
- Que Three.js no toque el JS inicial, el LCP ni el Worker.
- Que las dos versiones no puedan divergir: un modelo, dos pintores.

**Non-Goals:**

- Comparar píxeles de la escena 3D.
- React Three Fiber u otra capa sobre Three.js.
- Animar el cambio de panel de las pestañas.

## Decisions

### D1 — Modelo de la escena (dominio puro)

`src/domain/scene/`, sin dependencias:

| Archivo | Contenido |
|---|---|
| `model.ts` | `STAGE_STOPS` (fin de cada tramo sobre el camino, de 0 a 1), `curve(t)`, `tangent(t)`, generador pseudoaleatorio con semilla fija, y `SCENE_ITEMS`: cada bloque con su tramo, posición ordenada, posición dispersa, tamaño y tono |
| `state.ts` | `stageProgress(stage)`, `buildAmount(item, progress)` y `segmentState(stage)` → `"built" \| "scattered"` por tramo |
| `projection.ts` | Proyección isométrica y orden de pintado: `projectScene(kind)` devuelve polígonos con el **nombre del rol** de color de cada cara, agrupados por tramo |
| `mode.ts` | `decideMode(capabilities, preference)` → `{ mode: "full" \| "lite", reason }`; `Capabilities`, `LiteReason` y `parsePreference` |

`reason` es un código (`no-webgl`, `save-data`, `slow-connection`, `low-end-device`, `reduced-motion`, `load-failed`, `context-lost`, `chosen`), no un texto: el texto sale del diccionario.

*Nivel de prueba:* unitario.

### D2 — Versión ligera: SVG de servidor

`src/components/journey/scene/scene-svg.tsx`, de servidor: pinta `projectScene(kind)` como `<svg aria-hidden="true" focusable="false">`, con `fill` y `stroke` por clases de rol (`fill-[var(--scene-top)]`…). `kind` es `hero` (bloques dispersos que empiezan a ordenarse), `journey` (el camino entero, por tramos) o `closing` (el camino completo).

**El cambio de etapa en la versión ligera es solo CSS.** Cada tramo es un `<g data-segment="n">`; la ranura lleva `data-stage`; `globals.css` atenúa los tramos posteriores a la etapa y oculta los fragmentos dispersos de los anteriores. El SVG se sirve una vez y no se regenera en el navegador.

*Alternativa:* regenerar el SVG en el cliente a cada etapa. Descartada: lleva el modelo y la proyección al JS inicial.
*Alternativa:* cinco SVG, uno por etapa. Descartada: quintuplica el HTML.

`scene-slot.tsx` (servidor) es el contenedor de cada ranura: reserva su tamaño con `aspect-ratio` o alto fijo —así no hay salto cuando llega el lienzo—, contiene el SVG y es donde el controlador coloca el `<canvas>`.

*Nivel de prueba:* integración (estructura, roles, `aria-hidden`); E2E (visible sin JS, sigue a la etapa).

### D3 — Pestañas que degradan a enlaces (ADR-0013)

`src/components/journey/journey-tabs.tsx`, de cliente. Recibe las etapas ya renderizadas en el servidor.

- Cada pestaña es `<a role="tab" href="#etapa-n" aria-controls="etapa-n">`; cada panel, `<div role="tabpanel" id="etapa-n" tabIndex={0}>` con el `<article>` actual dentro.
- **Sin JavaScript** (`scripting: none`): la lista de pestañas se oculta y los cinco paneles se ven en orden.
- **Con JavaScript, antes de hidratar o si el script falla:** el CSS muestra el panel señalado por `:target`, o el primero si no hay ninguno. Las pestañas funcionan como enlaces.
- **Hidratado:** el componente toma el control: `aria-selected`, `tabIndex` itinerante, flechas, Inicio y Fin, Espacio; actualiza el ancla con `history.replaceState` sin desplazar la página; lee el ancla inicial.
- La forma de pestañas está en el CSS desde el primer pintado, así que hidratar no mueve nada.
- Orientación: horizontal con desplazamiento lateral en móvil; vertical junto a la escena desde `lg`. `aria-orientation` sigue al ancho.
- Sin animación de cambio de panel.

| Opción | Sin JS | JS que no llega a ejecutarse | Coste |
|---|---|---|---|
| **Enlaces con `:target` (elegida)** | Todo visible | Cada etapa alcanzable | El ancla cambia la URL; `aria-selected` queda sin sincronizar hasta hidratar |
| Botones y paneles ocultos por CSS | Todo visible | Solo la etapa 1; el resto, inalcanzable | Rompe la regla de no depender de JavaScript para contenido |
| Paneles apilados y pestañas solo como índice | Todo visible | Todo visible | No es el diseño elegido: cinco paneles a la vez |

*Nivel de prueba:* integración (teclado, ARIA, estado inicial); E2E (sin JS, enlace directo, foco, móvil, sin salto).

### D4 — Estado compartido de la escena

`src/components/journey/scene/scene-store.ts`: un almacén mínimo con `useSyncExternalStore`. Guarda `stage`, `mode`, `reason` y `status` (`idle`, `loading`, `ready`). Lo escriben las pestañas (etapa) y el control del pie (modo); lo leen el controlador y el control.

Hace falta porque las pestañas viven en la página y el control en el pie del layout: no comparten un ancestro donde poner un contexto de React sin volver cliente todo el árbol.

`src/lib/scene-preference.ts`: lee y escribe `localStorage["confia-modo"]` con valores `ligera` o `completa`; tolera que el almacenamiento falle.

### D5 — Controlador y escena 3D

`scene-controller.tsx` (cliente, montado una vez en la home, no pinta nada):

1. Al montar, reúne las capacidades (`WebGL`, `navigator.connection`, `deviceMemory`, `hardwareConcurrency`, `prefers-reduced-motion`), lee la preferencia y llama a `decideMode`. Refleja el modo en `<html data-mode>` y la etapa en la ranura del recorrido (`data-stage`).
2. En modo completo espera a `load` y a tiempo ocioso (`requestIdleCallback`, con alternativa), y hace `import("./three-scene")`.
3. Si la importación o la creación fallan, o llega `webglcontextlost`: modo ligero con su motivo.
4. Al pasar a ligero, destruye la escena y libera la memoria gráfica.

`three-scene.ts` (único archivo que importa `three`): `createScene({ slots, getStage, readTokens })` devuelve `{ setStage, destroy }`.

- Un `<canvas>` que se muda a la ranura con mayor área visible (`IntersectionObserver`).
- Bloques con `InstancedMesh`; dos esferas que recorren el camino; cuentas que marcan lo andado.
- Colores leídos de `--scene-*` con `getComputedStyle` de la ranura, de modo que la tarjeta índigo del recorrido y la banda índigo claro del cierre dan su propia paleta. Ningún color literal.
- Bucle con `requestAnimationFrame`, detenido con `visibilitychange` y cuando ninguna ranura está a la vista. Expone `data-rendering` en el lienzo para que las pruebas lo observen.
- `devicePixelRatio` limitado a 2; sombras solo desde `lg`.
- La cámara se interpola hacia la etapa y se desplaza con la posición de scroll de la ranura, leída en un oyente pasivo. Nunca llama a `preventDefault` ni fija el scroll.

La ilustración SVG sigue en el DOM bajo el lienzo y se oculta por CSS cuando `data-three="ready"`: si la escena cae, reaparece sin pintar nada nuevo.

*Nivel de prueba:* E2E. Se comprueba que la librería se pide tras `load`, que hay un solo lienzo en la ranura visible, que el bucle se detiene, que no hay errores de consola y que los fallos degradan. Chromium sin cabeza ofrece WebGL por software.

### D6 — Control de versión en el pie

`src/components/journey/scene/mode-switch.tsx` (cliente), dentro de `SiteFooter`:

- Dos botones con `aria-pressed` en un grupo con nombre, y una línea `role="status"` con el motivo.
- Solo se muestra si la página tiene ranuras de escena: lo sabe porque el controlador se registra en el almacén al montar. En las páginas legales no aparece.
- Sin JavaScript no se pinta: sin JavaScript solo existe la versión ligera.
- Textos y motivos en los diccionarios (`scene.*`).

### D7 — Colocación en la página

- **Hero:** ranura a la derecha desde `lg` (60 % del ancho, fundida con máscara hacia el texto); debajo del texto en móvil.
- **Recorrido:** dos columnas desde `lg`: tarjeta índigo con la escena, fija al desplazarse (`sticky`), y a su lado pestañas y panel. En móvil, la tarjeta arriba y las pestañas debajo.
- **Cierre:** ranura sobre el título, dentro de la banda índigo claro.

### D8 — Guardas

- Regla de lint: `three` solo puede importarse desde `src/components/journey/scene/three-scene.ts`, con su prueba de violación en `tests/fixtures/lint/`.
- `scripts/measure-initial-js.ts` falla si algún script inicial contiene el identificador de versión de Three.js; `npm run measure:js` informa aparte del tamaño del trozo diferido.

### Dependencias

- `domain/scene` no importa nada. `components/journey` importa `domain`, `i18n`, `lib` y `components/ui`. `components/sections` importa `components/journey`.
- `"use client"`: `journey-tabs.tsx`, `scene-controller.tsx`, `mode-switch.tsx` (pestañas, escena y selector, previstos en las convenciones). `three-scene.ts` solo se carga por importación dinámica.

## Risks / Trade-offs

- **Three.js pesa** (del orden de 150 kB comprimido tras descartar lo no usado) → Fuera del JS inicial, tras `load` y en ocioso; solo importaciones con nombre. Si supera 200 kB comprimido se anota y se consulta; el ADR-0009 ya prevé hacer ligera la versión por defecto en pantallas pequeñas.
- **WebGL en las pruebas** → Chromium sin cabeza lo ofrece por software; WebKit móvil puede no ofrecerlo. Las pruebas de la versión completa corren en Chromium; en WebKit se verifica la ligera. Se anota lo que no se pudo cubrir.
- **Las pruebas existentes de LCP y CLS pasan a ejecutar la versión completa** → Las ranuras reservan su tamaño; se mide de nuevo en ambos modos.
- **`:target` cambia la URL y puede desplazar la página al pulsar una pestaña antes de hidratar** → `scroll-margin` en los paneles; hidratado, se usa `replaceState` sin desplazamiento.
- **Dos pintores del mismo modelo** → Ambos consumen `SCENE_ITEMS` y `STAGE_STOPS`; una prueba unitaria fija el número de bloques por tramo que los dos deben respetar.
- **`navigator.connection` y `deviceMemory` no existen en Safari ni Firefox** → `decideMode` trata lo desconocido como «sin restricción»; quedan WebGL, núcleos y movimiento reducido.
- **Portar 500 líneas de la maqueta** → Se porta por piezas, cada una con su prueba; la maqueta no se edita.
- **El lote es grande** → Orden de construcción en cuatro tramos que dejan la suite en verde: pestañas, modelo y versión ligera, control de versión, escena 3D. Si la escena 3D se atasca, los tres primeros ya entregan una home completa en versión ligera.

## Migration Plan

Nada desplegado. Para revertir, revertir el commit del lote.

## Cambios durante la implementación

Lo construido difiere de lo escrito arriba en estos puntos. Donde hay contradicción, vale esta sección.

| Punto | Previsto | Construido | Motivo |
|---|---|---|---|
| D1 · Estado por tramo | `segmentState` | `segmentStates(stage)`, que devuelve los cinco | Lo que se necesita siempre es la lista. |
| D2 · Geometría del SVG | Tres polígonos por bloque | Cuatro formas en `<symbol>` y un `<use>` por bloque; el tono llega a las caras por propiedades CSS heredadas (`--face-*`) | Con un polígono por cara el HTML de `/es` pesaba 412 kB y el DOM tenía 2.250 nodos, 1.868 dentro de los SVG. Ahora: 202 kB (29,5 kB comprimido) y 36 polígonos. Hallazgo de la revisión. |
| D2 · Etapa en la versión ligera | `data-stage` en la ranura | `data-selected` en el contenedor del recorrido, que ya lo lleva por las pestañas | La ranura va dentro de ese contenedor: no hace falta otro atributo ni que el controlador lo escriba. |
| D2 · Colores | Clases `fill-[var(--scene-top)]` | Selectores `data-face` y `data-tone` en `globals.css` | Cientos de bloques con las mismas clases inflaban el HTML. |
| D3 · Foco itinerante | Desde el HTML servido | Solo con el componente en marcha (`tabIndex` se fija al hidratar) | Con `tabindex="-1"` en el HTML, si el script no llegaba a ejecutarse las pestañas 2 a 5 no se alcanzaban con teclado. **Hallazgo crítico de la revisión.** |
| D3 · Ancla tras cargar | Se lee al hidratar | Se escucha `hashchange`: si la dirección cambia, manda la dirección | Editar la URL o un enlace a `#etapa-n` dejaba la dirección y la etapa desincronizadas. |
| D3 · Reglas CSS de hidratado | Dentro de `@media (scripting: enabled)` | Fuera | Los navegadores que no conocen esa consulta dejaban los cinco paneles visibles y las pestañas sin efecto. |
| D3 · Traer la pestaña a la vista | `scrollIntoView` | `focus({ preventScroll: true })` y desplazamiento horizontal de la propia lista | `scrollIntoView` movía la página en vertical. |
| D5 · Interfaz de la escena | `createScene({ slots, getStage, readTokens })` → `{ setStage, destroy }` | `createScene({ slots, getStage, onContextLost })` → `{ destroy }` | La escena lee la etapa en cada fotograma y los tokens al cambiar de ranura; no necesita que se los empujen. |
| D5 · Señal de lienzo | `data-three="ready"` en `<html>` | `data-has-canvas` en la ranura | La ilustración se oculta solo en la ranura que tiene el lienzo. |
| D5 · Lectura del desplazamiento | Oyente pasivo de scroll | `getBoundingClientRect()` de la ranura en cada fotograma | Como en la maqueta; no hay ningún oyente de scroll, rueda ni toque. |
| D5 · Sombras | `PCFSoftShadowMap` | `PCFShadowMap` | Three.js 0.187 retiró el primero y avisaba en consola en cada carga. |
| D5 · Three.js y el servidor | — | La importación dinámica se descarta en el build del servidor (`typeof window`) | El trozo de Three.js entraba en el Worker: 162 KiB más. `build:worker` falla ahora si reaparece. |
| D5 · Liberación | `renderer.dispose()` | Además `forceContextLoss()` y el mapa de sombras; el contexto de sondeo de WebGL también se suelta | `dispose()` no libera el contexto gráfico. |
| D6 · Mensaje del pie | «Versión completa» en cuanto se elige | «Cargando la escena 3D…» hasta que está lista | Anunciaba una escena que aún no existía. |
| D8 · Medición | Identificador de versión de Three.js | La marca `isWebGLRenderer` | Sobrevive a la minificación. |
| Preferencia guardada | En `domain/scene/mode.ts` y en `lib/` | Solo en `src/lib/scene-preference.ts` | Había dos copias de «ligera/completa». |
| ADR-0009, punto 2 | Versión decidida antes del primer pintado | Se decide al hidratar | La ilustración ligera siempre va primero en el HTML, así que no hay nada que cambie a la vista. |

**Limitaciones aceptadas**

- **Movimiento reducido con la versión completa elegida a mano:** la escena se anima. La elección explícita del visitante manda (spec), pero es una excepción a «todo respeta `prefers-reduced-motion`». Pendiente de decisión del fundador.
- Las flechas arriba y abajo cambian de etapa también con la lista horizontal (móvil); el patrón de pestañas solo lo prevé en vertical. La spec lo pide así.
- El número de la pestaña forma parte de su nombre accesible («01 Roadmap»): un lector de pantalla dirá «cero uno» además de «3 de 5».
- Si `createScene` falla después de crear el renderizador, lo ya creado no se libera de forma explícita. El caso probado (WebGL que no arranca) falla antes y deja la página en ligera.
- Firefox con protección de huella informa de 2 núcleos y recibe siempre la versión ligera; el control permite forzar la completa.
- Un equipo con WebGL por software recibe la versión completa.
- Antes de hidratar, la ilustración ligera muestra la etapa 1 aunque la dirección señale otra.

## Open Questions

- Valores finos de cámara, luz y niebla: se ajustan a la vista contra la maqueta durante la implementación. No cambian specs ni tareas.
