# Proposal

Lote **L1 — Marca y sistema de interfaz** de [BACKLOG.md](../../../BACKLOG.md). Historias: L1-1, L1-2, L1-3, L1-4, L1-5, L1-6 y L1-8.

## Why

El lote L0 dejó una aplicación que funciona pero sin identidad: no hay colores, tipografías, logo ni componentes. Todos los lotes siguientes (estructura, secciones, recorrido, formulario) necesitan esas piezas, y el PRD §6.7 exige que la paleta se cambie desde un solo archivo.

## What Changes

- **Tokens de diseño** en `src/styles/tokens.css`: los 15 colores de la paleta elegida, los roles semánticos, los roles de la escena y los seis temas por banda (base, `theme-dark`, `theme-fresh`, `theme-coral`, `theme-warm`, `theme-calm`), tal como están en el diseño finalista. La paleta por defecto de Tailwind se desactiva.
- **Contraste verificado**: una prueba calcula el contraste de cada pareja texto/fondo permitida en cada tema y falla si alguna no alcanza AA.
- **Tipografías servidas desde el propio dominio**: Fraunces, Figtree y DM Mono, con sus licencias en el repositorio y respaldo ajustado para que no haya salto de diseño.
- **Logo**: componente `Logo` con el concepto elegido (cinco tramos, punto coral, «IA» resaltada) y archivos SVG en `public/brand/`: principal, compacto, símbolo y favicon reducido, para fondo claro y oscuro, más favicon de 32 px e icono.
- **Componentes base**: botón, enlace, campo, casilla, tarjeta y aviso, con todos sus estados y operables con teclado.
- **Guía de marca** completa en `docs/brand/`, con ejemplos en móvil y escritorio.
- La página provisional de L0 pasa a usar estas piezas, como superficie para las pruebas E2E.

## Capabilities

### New Capabilities

- `design-tokens`: paleta, roles semánticos, temas por banda y garantía de contraste.
- `typography`: familias tipográficas, origen de los archivos y estabilidad del diseño al cargarlas.
- `brand-identity`: logo en la interfaz y archivos de marca publicados.
- `ui-components`: componentes base de interfaz, sus estados y su accesibilidad.

### Modified Capabilities

Ninguna. Las capacidades de L0 no cambian de requisitos.

## Fuera de alcance

- Diccionarios y textos definitivos (L2); cabecera, pie y secciones (L2 y L3).
- Recorrido, escena 3D y su versión ligera (L4); solo se definen sus roles de color.
- Formulario en sus dos modos (L5); aquí solo los campos base.
- Imagen para redes sociales (L8-6).
- Búsqueda de parecidos del logo con marcas registradas (después de la v1).
- Modo oscuro global: no está en el diseño aprobado.

## ADR que aplican

- [ADR-0007](../../../docs/architecture/adr/0007-tokens-de-diseno.md): tokens centralizados. Se aplica sin cambios.
- [ADR-0009](../../../docs/architecture/adr/0009-escena-3d-y-version-ligera.md): roles `--scene-*`.
- [ADR-0001](../../../docs/architecture/adr/0001-nextjs-sobre-cloudflare-workers.md): componentes de servidor por defecto y presupuesto de JS.
- **ADR nuevo, 0011**: archivos de fuentes y de marca guardados en el repositorio y generados por script. No contradice ninguno anterior; concreta el «`next/font`» del ADR-0007.

## Impact

- **Código nuevo:** `src/styles/tokens.css`, `src/styles/fonts.ts`, `src/styles/fonts/`, `src/components/ui/`, `public/brand/`, `scripts/build-brand-assets.ts`.
- **Código modificado:** `globals.css`, `[locale]/layout.tsx`, `home-placeholder.tsx`.
- **Dependencias de desarrollo:** Fontsource y `opentype.js`. Ninguna entra en el Worker ni en el navegador.
- **Presupuestos:** las fuentes añaden peso de red, no JS; se vuelve a medir al cerrar.
