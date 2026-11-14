# ADR-0013: El recorrido usa pestañas que degradan a enlaces

**Estado:** Aceptada · **Fecha:** 2026-11-14 · **Decide:** fundador de Confia.ing (propuesta del lote L4)

## Contexto

El diseño elegido muestra las cinco etapas del recorrido una a la vez, con pestañas. El patrón habitual de pestañas oculta los paneles no seleccionados y depende de JavaScript para cambiarlos. El proyecto prohíbe que un contenido informativo exista solo con JavaScript (CLAUDE.md, reglas rojas), y las etapas son el corazón de la página: qué se hace, qué recibe el cliente y qué decide en cada una.

Hay dos situaciones distintas: el navegador con los scripts desactivados, y el navegador con scripts activados en el que el código de la página no llega a ejecutarse (red cortada a media carga, error en otro script, extensión que lo bloquea).

## Decisión

Cada pestaña es un enlace al ancla de su panel: `<a role="tab" href="#etapa-3">`. El comportamiento tiene tres niveles:

1. **Scripts desactivados** (`@media (scripting: none)`): no se muestran las pestañas; los cinco paneles se ven en orden.
2. **Scripts activados, antes de hidratar o si el código falla:** el CSS muestra el panel que señala la dirección (`:target`), o el primero si no señala ninguno. Las pestañas funcionan como enlaces normales.
3. **Hidratado:** el componente toma el control con el patrón completo de pestañas: una seleccionada, foco itinerante, flechas, Inicio y Fin, Espacio. Actualiza el ancla con `history.replaceState`, sin desplazar la página ni añadir entradas al historial.

La forma de pestañas está en el CSS desde el primer pintado, así que hidratar no mueve nada.

## Opciones consideradas

| Opción | Scripts desactivados | Código que no llega a ejecutarse | Coste |
|---|---|---|---|
| **Enlaces con `:target` (elegida)** | Todo visible | Cada etapa alcanzable | El ancla cambia la dirección; `aria-selected` no refleja la etapa mostrada hasta hidratar |
| Botones y paneles ocultos por CSS | Todo visible | Solo la etapa 1; las otras cuatro, inalcanzables | Rompe la regla de no depender de JavaScript para contenido |
| Paneles apilados, pestañas como índice | Todo visible | Todo visible | No es el diseño elegido: cinco paneles a la vez y una escena que no sabría cuál seguir |

## Consecuencias

- Una etapa se puede enlazar: `https://confia.ing/es#etapa-4` abre el recorrido en esa etapa.
- Al elegir una etapa cambia el ancla de la dirección. No se añaden entradas al historial: el botón Atrás no recorre las etapas.
- Antes de hidratar, un lector de pantalla puede anunciar como seleccionada la pestaña 1 aunque la dirección muestre otra; se corrige al hidratar.
- La ilustración de la versión ligera sigue a la etapa solo una vez hidratado el componente; antes muestra la etapa 1.
- Los navegadores sin `:has()` (anteriores a 2023) muestran, antes de hidratar y con un ancla de etapa en la dirección, el panel señalado y también el primero.
- Probado en E2E: scripts desactivados, enlace directo a una etapa y bloqueo de todos los scripts de la página.
