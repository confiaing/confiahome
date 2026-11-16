# Proposal

## Why

El proyecto solo tiene documentación: no hay aplicación, pruebas ni comandos que ejecutar. Antes de construir cualquier funcionalidad hace falta una base sobre la que se pueda trabajar con TDD y que haga cumplir por sí misma las reglas de arquitectura, de entorno y de tamaño, en lugar de confiar en que cada lote las recuerde.

## What Changes

Cubre el lote **L0 — Cimientos** del BACKLOG.md: L0-2, L0-3, L0-4, L0-5, L0-6, L0-7 y L0-8. (L0-1, la guía de trabajo, ya está aprobada.)

- Aplicación Next.js (App Router) con TypeScript estricto y Tailwind v4, desplegable en Cloudflare Workers con OpenNext, que sirve `/es` y `/en` con una página mínima.
- Comandos del proyecto: `dev`, `preview`, `lint`, `typecheck`, `test`, `e2e`, `test:contract`, `build`.
- Herramientas de prueba en los tres niveles (Vitest, Testing Library, Playwright, axe) con una prueba de humo en cada uno.
- Reglas de lint que imponen la tabla de dependencias entre carpetas y prohíben colores literales bajo `src/`.
- Carga de variables de entorno con selección de servicios (`SERVICES=memory|real`) y composición de dependencias en memoria.
- Supabase local levantado con Docker y proyecto enlazado con producción (sin migraciones todavía).
- Comprobación del tamaño del Worker y medición del JS inicial de `/es`.
- Carpetas que faltaban: `src/domain/scene/`, `src/lib/server/`, `tests/fixtures/`.

**Fuera de alcance:** tokens de diseño y componentes (L1), detección y cambio de idioma (L2), contenido de la home (L3), cualquier tabla o migración (L5, L7), despliegue (L10), CI. La página de L0 es un marcador sin diseño.

**ADR que aplican:** 0001 (Next.js + OpenNext), 0002 (Supabase solo servidor, entornos), 0004 (sin middleware, layout por idioma), 0007 (tokens), 0008 (pruebas, puertos y adaptadores). No contradice ninguno.

## Capabilities

### New Capabilities

- `app-shell`: la aplicación responde en sus rutas por idioma con el documento HTML correcto, en desarrollo y en el runtime de Workers.
- `architecture-guardrails`: las reglas de dependencia entre carpetas y la prohibición de colores literales se comprueban automáticamente.
- `environment-config`: cómo se eligen servicios reales o en memoria y cómo se validan las variables de entorno.
- `build-budgets`: límites de tamaño del Worker y del JS inicial que el build hace cumplir o informa.

### Modified Capabilities

Ninguna: no existen specs previas.

## Impact

- **Código nuevo:** `package.json`, configuración de Next.js, TypeScript, ESLint, Vitest, Playwright, OpenNext y Wrangler; `src/app/[locale]/`, `src/lib/server/`, `src/adapters/memory/`, `scripts/`, `tests/`.
- **Dependencias:** next, react, typescript, tailwindcss, zod, @opennextjs/cloudflare, wrangler, vitest, @testing-library/react, playwright, axe, eslint, supabase (CLI). Versiones: última estable al instalar, fijadas en `package-lock.json`.
- **Sistemas externos:** descarga de imágenes de Docker para Supabase local; `supabase link` pide al fundador la contraseña de la base de datos. No se despliega ni se escribe en producción.
- **Riesgo principal:** que la versión actual de Next.js no funcione con OpenNext en Workers o exceda el tamaño del plan gratuito. Se comprueba en la primera tarea y, si falla, se detiene el lote para decidir.
