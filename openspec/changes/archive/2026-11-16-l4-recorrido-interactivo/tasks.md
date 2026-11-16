# Tasks

Cada tarea de implementación va precedida por su prueba en rojo. Entre paréntesis, la spec y el escenario que cubre.

## 1. Modelo de la escena (L4-8)

- [x] 1.1 Pruebas unitarias en rojo de `model.ts` y `state.ts`: cinco tramos, generación determinista, bloques en cada tramo, estado por etapa (antes de la 1, en la 3, en la 5), `buildAmount` monótono entre 0 y 1 (scene-rendering: Un solo modelo). Verificación: `npm test` falla por módulo inexistente.
- [x] 1.2 Implementar `src/domain/scene/model.ts` y `state.ts`, portando `MODEL`, `curve`, `STOPS` y `buildAmount` de la maqueta. Verificación: `npm test` y `npm run lint` en verde.
- [x] 1.3 Pruebas unitarias en rojo e implementación de `projection.ts`: polígonos agrupados por tramo, roles de color válidos, orden de pintado estable, cajas de vista finitas para `hero`, `journey` y `closing`. Verificación: `npm test` en verde.

## 2. Elección de versión (L4-7)

- [x] 2.1 Pruebas unitarias en rojo de `decideMode`: sin WebGL; `saveData`; 2G y 3G; memoria ≤ 2 GB; ≤ 2 núcleos; movimiento reducido; elección guardada que manda sobre lo automático; elección «completa» sin WebGL; equipo capaz; capacidades desconocidas (scene-rendering: Elección automática de versión). Verificación: `npm test` falla.
- [x] 2.2 Implementar `src/domain/scene/mode.ts`. Verificación: `npm test` en verde.
- [x] 2.3 Pruebas en rojo e implementación de `src/lib/scene-preference.ts`: lee y escribe solo `ligera` o `completa`, ignora otros valores, tolera un almacenamiento que lanza error. Verificación: `npm test` en verde.

## 3. Pestañas del recorrido (L4-1, L4-2, L4-3)

- [x] 3.1 Escribir el ADR-0013 (pestañas que degradan a enlaces) y enlazarlo en README y `docs/architecture/README.md`. Verificación: el ADR existe y los enlaces abren.
- [x] 3.2 Pruebas de integración en rojo de `JourneyTabs`: estado inicial; elegir la etapa 3 muestra «Roadmap» con sus tres partes; flechas en los cuatro sentidos, circular; Inicio y Fin; Espacio y Enter; `aria-selected`, `aria-controls`, `tabIndex` itinerante; nombre de pestaña con número y etapa; ES y EN; axe (journey-navigation: Una etapa a la vez; Patrón de pestañas accesible). Verificación: `npm test` falla.
- [x] 3.3 Implementar `journey-tabs.tsx`, las claves de diccionario necesarias y adaptar `journey-overview.tsx`. Verificación: `npm test`, `typecheck` y `lint` en verde.
- [x] 3.4 E2E en rojo: sin JavaScript se ven las cinco etapas en orden; `/es#etapa-4` muestra la etapa 4; dos tabuladores pasan por la pestaña seleccionada y su panel; a 375 px sin desplazamiento horizontal, pestañas de 44 px y la seleccionada a la vista en ES y EN; cambio de panel sin transición con movimiento reducido (journey-navigation: No dependen de JavaScript; móvil; movimiento reducido). Verificación: `npm run e2e` falla.
- [x] 3.5 CSS de las pestañas en `globals.css` (`scripting`, `:target`, forma desde el primer pintado) y ajustes. Verificación: `npm run e2e` en verde; CLS anotado en «Evidencia».
- [x] 3.6 Actualizar las pruebas de L3 que contaban cinco `<article>` visibles. Verificación: toda la suite en verde.

## 4. Versión ligera (L4-7)

- [x] 4.1 Pruebas de integración en rojo de `SceneSvg` y `SceneSlot`: tres tipos, `aria-hidden`, grupos por tramo, sin colores literales, tamaño reservado (scene-rendering: Versión ligera en el HTML). Verificación: `npm test` falla.
- [x] 4.2 Implementar `scene-svg.tsx` y `scene-slot.tsx`. Verificación: `npm test` en verde.
- [x] 4.3 Colocar las ranuras en `hero.tsx`, el recorrido y `closing.tsx`, con la disposición de design.md D7. Verificación: pruebas de integración de las secciones en verde.
- [x] 4.4 E2E en rojo y CSS de etapa: con JS desactivado las tres ilustraciones son visibles; al elegir la etapa 3 los tramos 4 y 5 quedan atenuados (scene-rendering: Presente sin JavaScript; Sigue a la etapa). Verificación: `npm run e2e` en verde.
- [x] 4.5 Revisión visual de la versión ligera frente a la maqueta, a 390 y 1440 px. Verificación: capturas en `docs/brand/img/` y diferencias anotadas aquí.

## 5. Estado compartido y control de versión (L4-9)

- [x] 5.1 Pruebas en rojo e implementación de `scene-store.ts`: lectura, escritura y suscripción. Verificación: `npm test` en verde.
- [x] 5.2 Pruebas de integración en rojo de `ModeSwitch`: no se pinta sin escena registrada; dos opciones con `aria-pressed`; elegir cambia el modo y guarda la preferencia; sin WebGL, «completa» no cambia el modo y explica el motivo; motivo de la versión automática en ES y EN; `role="status"`; axe (scene-rendering: Control de versión del visitante). Verificación: `npm test` falla.
- [x] 5.3 Implementar `mode-switch.tsx`, sus textos en los diccionarios y colocarlo en `SiteFooter`. Verificación: `npm test` en verde.
- [x] 5.4 Pruebas en rojo e implementación de `scene-controller.tsx` sin la parte 3D: reúne capacidades, decide el modo, refleja `data-mode` y `data-stage`, registra la escena. Verificación: `npm test` en verde.
- [x] 5.5 E2E: con movimiento reducido el modo es ligero y el pie lo explica; elegir ligera se recuerda al recargar; el almacenamiento tiene una sola entrada; en una página legal no hay control (scene-rendering). Verificación: `npm run e2e` en verde.

## 6. Escena 3D (L4-8, L4-6)

- [x] 6.1 Instalar `three` y sus tipos; añadir la regla de lint que limita su importación y su prueba con un archivo de violación. Verificación: `npm test` y `npm run lint` en verde.
- [x] 6.2 E2E en rojo: en modo completo la librería se pide después de `load`; no está en los scripts iniciales; hay un solo lienzo y está en la ranura visible al desplazarse por hero, recorrido y cierre; sin errores de consola (scene-rendering: La escena 3D no retrasa la lectura). Verificación: `npm run e2e` falla.
- [x] 6.3 Implementar `three-scene.ts` (lienzo, bloques, esferas, luz, colores desde los tokens) y la carga diferida en el controlador. Verificación: sus E2E en verde.
- [x] 6.4 E2E en rojo e implementación: al elegir la etapa 4 la escena recibe ese destino; el desplazamiento de la página nunca se bloquea (ningún oyente no pasivo de rueda o toque; la posición de scroll avanza lo pedido) (scene-rendering: Sigue a la etapa y al desplazamiento). Verificación: `npm run e2e` en verde.
- [x] 6.5 E2E en rojo e implementación: el bucle se detiene con la pestaña oculta y con las ranuras fuera de pantalla, y se reanuda al volver (scene-rendering: No consume recursos sin verse). Verificación: `npm run e2e` en verde.
- [x] 6.6 E2E en rojo e implementación: con la petición de la librería abortada, la página queda en ligera y el pie lo comunica; lo mismo al perder el contexto WebGL (scene-rendering: Falla hacia la versión ligera). Verificación: `npm run e2e` en verde.
- [x] 6.7 Ampliar `scripts/measure-initial-js.ts`: falla si la librería está en los scripts iniciales e informa del tamaño del trozo diferido. Verificación: `npm run measure:js` muestra ambos; cifras anotadas aquí. **Si el trozo supera 200 kB comprimido, detener y consultar.**
- [x] 6.8 Revisión visual de la escena 3D frente a la maqueta, en hero, recorrido (etapas 1, 3 y 5) y cierre, a 390 y 1440 px. Verificación: capturas en `docs/brand/img/` y diferencias anotadas aquí.

## 7. La home completa

- [x] 7.1 E2E: LCP < 2,5 s, CLS < 0,1 y JS inicial ≤ 200 kB en móvil simulado, en modo ligero y en modo completo (journey-navigation: presupuestos; home-page). Verificación: valores anotados aquí.
- [x] 7.2 E2E: axe sin infracciones en `/es` y `/en`, a 375 y 1280 px, en ambos modos y con cada etapa seleccionada. Verificación: `npm run e2e` en verde.
- [x] 7.3 Comprobar a mano el recorrido con teclado y con VoiceOver, en ambos modos. Verificación: resultado anotado aquí (nivel M); lo que no se pueda comprobar, dicho.

## 8. Cierre del lote

- [x] 8.1 Revisión de código con `fullstack-dev-skills:code-reviewer` en un subagente independiente y corrección de los hallazgos. Verificación: hallazgos y resolución anotados aquí.
- [x] 8.2 Puerta de cierre: `npm run lint`, `typecheck`, `test`, `e2e`, `build:worker`, `measure:js` y carga de `/es` y `/en` en `preview`. Verificación: todo en verde; cifras anotadas aquí.
- [x] 8.3 Actualizar README, BACKLOG, `docs/architecture/` (componentes y estructura) y `docs/brand/README.md` (escena y capturas). Verificación: enlaces comprobados.
- [x] 8.4 Commit local del lote, sin `push`. Verificación: `git status` limpio y `git log -1` muestra el commit.

## Evidencia

Todo ejecutado el 2026-11-14.

**Puerta de cierre (8.2)**

| Comprobación | Resultado |
|---|---|
| `npm run lint` | 0 errores |
| `npm run typecheck` | 0 errores |
| `npm test` | 418 pruebas en 33 archivos, en verde |
| `npm run e2e` | 212 en verde, 16 omitidas (escena 3D y métricas, solo Chromium) |
| `npm run build:worker` | 978,7 KiB de 3072 KiB (margen 68,1 %); sin secretos ni Three.js en el Worker |
| `npm run measure:js` | JS inicial 139,5 kB de 200 kB (70 %); escena 3D aparte, 135,8 kB en un trozo diferido |
| `preview` (runtime de Workers) | `/es`, `/en` y `/es/privacidad` responden 200; `/es` trae las tres ilustraciones, cinco pestañas y cinco paneles en el HTML |

**Rendimiento (3.5, 7.1).** Móvil simulado (Pixel 7, CPU ×4, 1,6 Mbps, 150 ms): versión completa, LCP 0,75 s y CLS 0,0060; versión ligera, LCP 0,76 s y CLS 0,0060. Las pestañas no producen salto al hidratar.

**Peso (6.7).** HTML de `/es`: 202 kB, 29,5 kB comprimido (era 412 kB antes de compartir las formas del SVG). Three.js: 135,8 kB comprimido, pedido tras `load`; por debajo del tope de 200 kB.

**Revisión visual (4.5, 6.8).** Capturas en `docs/brand/img/`: `home-*-desktop/mobile.png` (versión ligera) y `scene-*.png` (versión completa: hero, recorrido en las etapas 1, 3 y 5, y cierre). Diferencias con la maqueta: sin marcadores numerados sobre la escena 3D (fuera de alcance); filtro de sombras distinto (Three.js 0.187 frente a 0.160).

**Revisión de código (8.1).** Subagente independiente con `code-reviewer`: 1 hallazgo crítico, 7 importantes y 9 menores. El port del modelo, la proyección y la escena no tiene diferencias de lógica con la maqueta.

- **Crítico, corregido:** con el script sin ejecutarse, las pestañas 2 a 5 llevaban `tabindex="-1"` y no se alcanzaban con teclado. Mi prueba usaba el ratón; ahora hay una con Tab y Enter.
- Corregidos: cambio de ancla tras cargar (2); reglas de hidratado dentro de una consulta que no todos los navegadores entienden (3); la página se movía al elegir una pestaña (4); faltaba `aria-orientation` (5); pruebas débiles (6: versión que no cambiaba, destino de la escena, motivo de la versión ligera, entrada por teclado desde fuera); peso del HTML (8); aviso de sombras en consola (9); contexto gráfico sin liberar (10); mensaje del pie antes de tiempo (12); preferencia duplicada (13); `data-mode` residual (15).
- Encontrado al cerrar: Three.js había entrado en el Worker como trozo de servidor (+162 KiB). Corregido y con guarda en `build:worker`.
- Documentados como limitación o decisión pendiente en design.md: 11, 14, 16, 17 y las discrepancias de 15.

**Comprobación manual (7.3, nivel M).** Hecha con teclado en navegador automatizado: Tab entra por la pestaña seleccionada y pasa a su panel; flechas, Inicio y Fin; el control del pie con Tab y Enter. **No hecha con VoiceOver ni NVDA:** no dispongo de lector de pantalla en este entorno.

**Desviaciones de TDD**

- `projection.ts` se cambió a formas compartidas después de la revisión; sus pruebas se adaptaron a la vez.
- Las pruebas de `hashchange`, orientación, foco sin desplazamiento y teclado sin script se escribieron junto con su corrección.
- El almacén de la escena (5.1) se escribió con las pestañas; sus pruebas propias llegaron tras la revisión.

**No verificado**

- Lectores de pantalla reales.
- La escena 3D en Safari, Firefox y en un móvil real: solo en Chromium sin cabeza, con WebGL por software. En WebKit móvil simulado se verifica la versión ligera.
- Fugas de memoria gráfica más allá de alternar de versión veinte veces sin avisos.
- El parecido fino de cámara y luz con la maqueta: comparado a la vista en capturas, no medido.

## Workflow follow-up

- `/opsx:verify` del cambio.
- `/opsx:archive` cuando el fundador lo apruebe.
