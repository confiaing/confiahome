# ADR-0009: Escena 3D del recorrido con versión ligera obligatoria

**Estado:** Aceptada · **Fecha:** 2026-11-14 · **Decide:** fundador de Confia.ing

## Contexto

El diseño elegido ([ronda5-cercano-3d-finalista.html](../../design/ronda5-cercano-3d-finalista.html)) usa una escena 3D: bloques dispersos que se ordenan en un camino de cinco terrazas, recorrido por dos esferas. Aparece en el hero, en el recorrido y en el cierre. El PRD exige buen rendimiento en móvil y conexiones lentas, y que nada dependa solo de animación (§9, §10). El fundador pidió que quien no pueda ver el 3D reciba una versión más sencilla, coherente en colores e imágenes.

La arquitectura de la Fase 2 no contemplaba WebGL: preveía Motion para animación.

## Decisión

1. **Three.js sin envoltorios**, un solo `canvas` que se muda a la ranura visible (hero, recorrido o cierre). Geometría procedural; ningún modelo ni textura externos.
2. **Dos modos, decididos antes del primer pintado:**
   - **Completo:** escena WebGL.
   - **Ligero:** la misma escena como SVG isométrico estático, generado desde el mismo modelo de datos.
3. **Se sirve el modo ligero** cuando se cumple cualquiera de estas condiciones: no hay WebGL, `saveData` activo, conexión `2g`/`3g`, dispositivo con ≤ 2 GB de memoria o ≤ 2 núcleos, `prefers-reduced-motion`, fallo al cargar la librería o pérdida del contexto gráfico.
4. **El visitante puede cambiar de modo** con un control en el pie; la elección se recuerda en `localStorage` (preferencia funcional, no rastreo).
5. **Carga diferida:** Three.js se importa de forma dinámica, después de `load` y en tiempo ocioso, y solo en modo completo. El SVG ya está en el HTML inicial.
6. **Los colores de la escena salen de los tokens** (`--scene-*`), leídos con `getComputedStyle`.
7. **Se sustituye Motion** por CSS y la Web Animations API para el resto del movimiento.

## Opciones consideradas

| Opción | Peso | Control | Nota |
|---|---|---|---|
| Three.js directo (elegida) | Medio, diferido | Total | Una sola escena simple no justifica más capas |
| React Three Fiber + drei | Mayor | Alto | Añade dependencias y acopla la escena al árbol de React |
| Spline u otro editor | Alto, runtime propio | Bajo | Rápido de prototipar, difícil de ligar a tokens y de aligerar |
| Solo SVG animado | Mínimo | Medio | Pierde la profundidad que hizo ganar a esta propuesta |

## Consecuencias

- **Más fácil:** cumplir accesibilidad y rendimiento, porque el contenido y una imagen equivalente existen sin WebGL.
- **Más difícil:** hay dos representaciones de la misma escena que mantener sincronizadas. Se mitiga con un modelo único en `src/domain/scene/` del que derivan ambas.
- **Rendimiento:** Three.js no entra en el JS inicial ni en el presupuesto de LCP; se mide aparte. `devicePixelRatio` limitado, sombras solo en escritorio, render en pausa fuera de pantalla o con la pestaña oculta.
- **Pruebas:** el modelo y las reglas de elección de modo son lógica pura (unitario). El modo ligero se prueba en integración y E2E. El WebGL no se verifica píxel a píxel: el E2E comprueba que arranca, que no hay errores de consola y que degrada al modo ligero.
- **Privacidad:** `localStorage` guarda solo `"ligera"` o `"completa"`.
- **A revisar:** si el tamaño del Worker o el rendimiento en móvil no cumplen, el modo ligero pasa a ser el predeterminado en pantallas pequeñas.
