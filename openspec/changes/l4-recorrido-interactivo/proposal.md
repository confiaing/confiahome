# Proposal

Lote **L4 — Recorrido interactivo** de [BACKLOG.md](../../../BACKLOG.md). Historias: L4-1 a L4-9.

## Why

Las cinco etapas se leen en la home como una rejilla estática, y el hero y el cierre no tienen imagen. Lo que hizo ganar a este diseño fue elegir una etapa y ver cómo el camino se construye hasta ella. Falta también la versión ligera para quien no pueda ver el 3D.

## What Changes

- **Recorrido con pestañas:** las cinco etapas pasan a un patrón de pestañas accesible (flechas, Inicio, Fin). Cada pestaña es además un enlace: sin JavaScript, o si falla, el contenido sigue alcanzable.
- **Modelo único de la escena** en `src/domain/scene/`: camino de cinco terrazas, bloques y estado por etapa. De él salen las dos versiones.
- **Versión ligera:** la escena como ilustración SVG isométrica, incluida en el HTML del hero, del recorrido y del cierre. En el recorrido cambia con la etapa elegida.
- **Versión completa:** la escena en 3D con Three.js, en un solo lienzo que se muda a la ranura visible. Se descarga después de que la página es legible y solo cuando aplica.
- **Elección automática de versión:** ligera si no hay WebGL, con ahorro de datos, conexión lenta, equipo modesto, movimiento reducido, o si la escena falla.
- **Control en el pie** para cambiar de versión; recuerda la elección y explica por qué se activó la ligera cuando fue automática.
- **La cámara acompaña el desplazamiento** dentro de cada ranura, sin bloquear ni alterar el scroll.

## Capabilities

### New Capabilities

- `journey-navigation`: selección de etapa, teclado, comportamiento sin JavaScript y en móvil.
- `scene-rendering`: modelo de la escena, versión ligera, versión 3D, elección de versión y control del visitante.

### Modified Capabilities

Ninguna. `home-page` conserva sus requisitos: las cinco etapas siguen en el HTML servido.

## Fuera de alcance

- Que la etapa activa cambie sola al desplazarse (parte de L4-6, prioridad C): choca con las pestañas. Solo la cámara sigue el scroll.
- Marcadores numerados clicables sobre la escena 3D: la selección se hace con las pestañas.
- Sombras en móvil, texturas, modelos externos y posprocesado.
- Eventos de analítica del recorrido (L7).
- Formulario y calendario (L5, L6).

## ADR que aplican

- [ADR-0009](../../../docs/architecture/adr/0009-escena-3d-y-version-ligera.md): escena 3D con versión ligera obligatoria. Se aplica íntegro.
- [ADR-0001](../../../docs/architecture/adr/0001-nextjs-sobre-cloudflare-workers.md): `"use client"` solo en hojas; Three.js fuera del JS inicial y del Worker.
- [ADR-0007](../../../docs/architecture/adr/0007-tokens-de-diseno.md): colores de la escena desde `--scene-*`.
- [ADR-0008](../../../docs/architecture/adr/0008-estrategia-de-pruebas.md): modelo y reglas de modo como lógica pura.
- **ADR nuevo, 0013:** pestañas que degradan a enlaces. No contradice ninguno anterior.

## Impact

- **Dependencia nueva:** `three` (y sus tipos). Se carga con `import()` dinámico; no entra en el JS inicial ni en el Worker.
- **Código nuevo:** `src/domain/scene/`, `src/components/journey/` (pestañas, ranuras, SVG, controlador, escena 3D, control de versión).
- **Código modificado:** `journey-overview.tsx`, `hero.tsx`, `closing.tsx`, `site-footer.tsx`, diccionarios, `globals.css`.
- **Presupuestos:** el JS inicial sube por pestañas y controlador; Three.js se mide aparte.
- **Lint:** `three` solo se importa desde el módulo de la escena.
