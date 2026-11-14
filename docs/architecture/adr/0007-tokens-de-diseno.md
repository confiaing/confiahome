# ADR-0007: Tokens de diseño centralizados con Tailwind v4

**Estado:** Aceptada · **Fecha:** 2026-11-13

## Contexto

PRD §6.7: cambiar un color de marca debe requerir editar una sola fuente y reflejarse en toda la aplicación, sin valores duplicados en componentes. La identidad visual aún no existe y se define en la Fase 3.

## Decisión

- `src/styles/tokens.css` es la única fuente. Dos niveles de variables CSS:
  - **Primitivos:** la paleta en bruto (`--brand-500`, `--neutral-900`...).
  - **Semánticos:** roles que consumen los componentes (`--color-primary`, `--color-background`, `--color-text`, `--color-link`, `--color-focus`, `--color-error`, `--color-success`...).
- Tailwind v4 lee esos roles con `@theme`, de modo que las utilidades (`bg-primary`, `text-foreground`) apuntan a las variables.
- Los componentes solo usan roles semánticos. Una regla de lint prohíbe colores literales (hex, rgb, hsl) y clases de paleta de Tailwind fuera de `tokens.css`.
- Tipografías auto-alojadas con `next/font`, de licencia abierta, con fuentes de respaldo declaradas: Fraunces (títulos), Figtree (texto) y DM Mono (etiquetas).
- Paleta elegida: los 15 colores de «Cercano y vivo» (índigo, coral, mantequilla, salvia, crema, arena), con temas por banda (`theme-dark`, `theme-fresh`, `theme-coral`, `theme-warm`, `theme-calm`) que reasignan roles sin tocar componentes.
- La escena 3D lee sus colores de los roles `--scene-*` ([ADR-0009](0009-escena-3d-y-version-ligera.md)).

## Opciones consideradas

- **CSS Modules con variables:** cumple, pero sin el vocabulario de utilidades que acelera el desarrollo.
- **CSS-in-JS:** coste en tiempo de ejecución y mal encaje con Server Components.

## Consecuencias

- Cambiar la paleta es editar un archivo; una prueba automática comprueba el contraste de las parejas texto/fondo permitidas.
- La guía de marca digital se genera a partir de los mismos tokens.
- Un modo oscuro futuro sería un segundo bloque de valores semánticos, sin tocar componentes.
