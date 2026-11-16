# Tasks

Cada tarea de implementación va precedida por su prueba en rojo. Entre paréntesis, el escenario de `docs/escenarios.md` o de la spec que cubre.

## 1. Proyecto base (L0-2, L0-8)

- [x] 1.1 Crear `package.json`, instalar Next.js, React, TypeScript, Tailwind v4, Zod, `@opennextjs/cloudflare` y Wrangler; escribir `tsconfig.json` (estricto), `next.config.ts`, `open-next.config.ts` y `wrangler.jsonc`. Verificación: `npm ls` sin errores y versiones anotadas aquí.
- [x] 1.2 Crear las carpetas `src/domain/scene/`, `src/lib/server/` y `tests/fixtures/`. Verificación: `ls` las muestra (L0-8).
- [x] 1.3 Instalar Vitest, Testing Library, jsdom, Playwright y axe; escribir `vitest.config.ts` y `playwright.config.ts`; añadir scripts `test`, `e2e`, `typecheck`. Verificación: `npm test` ejecuta 0 pruebas sin error de configuración.
- [x] 1.4 Prueba unitaria en rojo de `src/i18n/locales.ts`: la lista de idiomas es `es` y `en`, y `isLocale('fr')` es falso. Verificación: `npm test` falla por módulo inexistente.
- [x] 1.5 Implementar `src/i18n/locales.ts`. Verificación: `npm test` en verde.
- [x] 1.6 E2E en rojo: `/es` responde 200 con `lang="es"`, `/en` con `lang="en"`, `/fr` responde 404 (app-shell: Rutas por idioma). Verificación: `npm run e2e` falla.
- [x] 1.7 Implementar `src/app/[locale]/layout.tsx` y `page.tsx` con `generateStaticParams` y `dynamicParams = false`. Verificación: `npm run e2e` en verde.
- [x] 1.8 Añadir scripts `dev`, `build` y `preview`; comprobar `/es` en el runtime de Workers (app-shell: Paridad con Workers). Verificación: `curl` a la vista previa devuelve 200 con `lang="es"`; salida anotada aquí. **Si falla, detener el lote y consultar.**

## 2. Reglas de arquitectura (L0-4)

- [x] 2.1 Instalar ESLint y escribir `eslint.config.mjs` base, con `tests/fixtures/` en `ignores`; script `lint`. Verificación: `npm run lint` termina con código 0.
- [x] 2.2 Crear violaciones de ejemplo en `tests/fixtures/lint/` y prueba unitaria en rojo con la API de ESLint: dominio que importa `next`, `react`, `@supabase/supabase-js` y `three` da error; dominio que importa `zod` no (architecture-guardrails: Dominio puro). Verificación: `npm test` falla.
- [x] 2.3 Implementar las reglas del dominio. Verificación: `npm test` en verde.
- [x] 2.4 Prueba en rojo: componente que importa `adapters` o `lib/server` da error (Componentes aislados). Verificación: `npm test` falla.
- [x] 2.5 Implementar las reglas de `components`, `adapters`, `i18n` y `lib` según la tabla de dependencias de CLAUDE.md. Verificación: `npm test` en verde.
- [x] 2.6 Prueba en rojo: `#FF6B4A` y `rgb(...)` dan error; `transparent`, `currentColor` e `inherit` no (Sin colores literales). Verificación: `npm test` falla.
- [x] 2.7 Implementar la regla de colores literales para `src/**`. Verificación: `npm test` y `npm run lint` en verde (El lint del proyecto permanece en verde).

## 3. Entorno y servicios (L0-5)

- [x] 3.1 Prueba unitaria en rojo de `loadServerEnv`: `SERVICES` ausente equivale a `memory`; `memory` sin secretos no falla; valor desconocido lanza error con los valores admitidos (environment-config: Selección de servicios). Verificación: `npm test` falla.
- [x] 3.2 Implementar `src/lib/server/env.ts` con Zod. Verificación: `npm test` en verde.
- [x] 3.3 Prueba en rojo: `SERVICES=real` sin `SUPABASE_SECRET_KEY` lanza un error que nombra la variable y no contiene ningún valor; con todo presente devuelve la configuración (Validación de secretos). Verificación: `npm test` falla.
- [x] 3.4 Implementar la validación de secretos. Verificación: `npm test` en verde.
- [x] 3.5 Prueba en rojo: el módulo de configuración pública solo expone claves `NEXT_PUBLIC_` (Los secretos no llegan al navegador). Verificación: `npm test` falla.
- [x] 3.6 Implementar `src/lib/public-env.ts`. Verificación: `npm test` en verde.
- [x] 3.7 Prueba en rojo: con `memory`, el contenedor devuelve los adaptadores en memoria; definir los puertos mínimos en `src/domain/ports.ts`. Verificación: `npm test` falla.
- [x] 3.8 Implementar `src/lib/server/container.ts` y un adaptador en memoria mínimo. Verificación: `npm test` y `npm run lint` en verde.

## 4. Prueba de integración de humo (L0-3)

- [x] 4.1 Prueba de integración que renderiza la página mínima con Testing Library y pasa axe sin infracciones. Verificación: `npm test` informa al menos una prueba unitaria y una de integración (app-shell: Suites en verde).
- [x] 4.2 Comprobar que unitario e integración no usan red: ejecutar `npm test` con la red bloqueada en la configuración de Vitest. Verificación: código 0 (Sin red).

## 5. Presupuestos de build (L0-7)

- [x] 5.1 Prueba unitaria en rojo de `scripts/lib/size.mjs`: por encima de 3 MiB devuelve fallo con tamaño y límite; por debajo, éxito con margen; sin medida, fallo indicando que no pudo medir (build-budgets: Límite de tamaño). Verificación: `npm test` falla.
- [x] 5.2 Implementar `scripts/lib/size.mjs` y `scripts/check-worker-size.mjs`; encadenarlo en `npm run build`. Verificación: `npm test` en verde y `npm run build` muestra tamaño y margen; salida anotada aquí.
- [x] 5.3 Escribir `scripts/measure-initial-js.mjs` y medir `/es`. Verificación: tamaño anotado aquí frente a 200 kB; si lo supera, consultar al fundador.

## 6. Supabase local (L0-6)

- [x] 6.1 Instalar la CLI de Supabase como dependencia de desarrollo y ejecutar `npx supabase init`. Verificación: existe `supabase/config.toml`.
- [x] 6.2 `npx supabase start` y anotar aquí que levantó (sin claves). Completar `.env.local` con la URL y la clave locales. Verificación: `npx supabase status` muestra los servicios activos (app-shell: Base de datos local).
- [x] 6.3 Pedir al fundador que ejecute `npx supabase link --project-ref nojdfpoqmrjpxkaqskyv` en su terminal. Verificación: `npx supabase migration list` responde sin pendientes. Script `test:contract` creado, sin pruebas todavía.

## 7. Cierre del lote

- [x] 7.1 Puerta de cierre: `lint`, `typecheck`, `test`, `e2e`, `build` y carga de `/es` en `preview`. Verificación: salida de cada comando anotada aquí.
- [x] 7.2 Revisión de código con `fullstack-dev-skills:code-reviewer` y hallazgos resueltos. Verificación: resumen anotado aquí.
- [x] 7.3 Actualizar README (comandos reales, cómo ejecutar en local) y BACKLOG (L0 hecho). Verificación: diff de ambos archivos.
- [x] 7.4 Commit local del lote. Verificación: `git log -1` muestra el commit; sin `push`.

## Evidencia y desviaciones

- **1.1 Versiones instaladas:** next 16.4.6, react 19.3.1, typescript 6.0.3, tailwindcss 4.3.5, zod 4.6.7, @opennextjs/cloudflare 1.20.17, wrangler 4.162.0, vitest 5.1.0, @playwright/test 1.65.1, eslint 10.15.0. npm bloquea por defecto los scripts de instalación; se aprobaron `esbuild` y `workerd` (necesarios para Wrangler). `fsevents` quedó sin aprobar.
- **1.6 / 1.7 Desviación de TDD:** la prueba E2E se escribió antes que el layout, pero no se ejecutó en rojo: los navegadores de Playwright aún se estaban descargando. Se ejecutó por primera vez con la implementación ya hecha (6 de 6 en verde). El resto de pruebas del lote sí se vieron fallar antes.
- **1.8 Workers:** `wrangler dev` sobre `.open-next/worker.js` → `/es` 200 `<html lang="es">`, `/en` 200 `<html lang="en">`, `/fr` 404. El riesgo de incompatibilidad Next.js 16 + OpenNext queda descartado.
- **Scripts de build (cambio respecto al diseño D9):** OpenNext invoca `npm run build` por dentro, así que `build` debe ser `next build`. El build del Worker con la comprobación de tamaño pasó a `npm run build:worker`. La puerta de cierre usa `build:worker`.
- **Tailwind:** su detección automática recorría todo el repositorio y fallaba con un socket dentro de `docs/design/`. Se limitó a `src/` con `source(none)` + `@source`.
- **5.2 Tamaño del Worker:** 847,3 KiB comprimido de 3072 KiB. Margen 72,4 %.
- **5.3 JS inicial de `/es`:** 174,3 kB (gzip) con la página mínima, el 87 % del límite propuesto de 200 kB. **Pendiente de decisión del fundador:** el límite no deja espacio para recorrido, formulario y agenda.
- **6.1 Desviación:** se usa la CLI de Supabase ya instalada en la máquina (3.1.0) en lugar de añadirla como dependencia de desarrollo, para no duplicar la descarga del binario.
- **Reglas de lint añadidas más allá de las tareas:** `adapters`, `i18n`, `lib`, `lib/server` y `app` tienen su propia regla y su prueba, siguiendo la tabla de dependencias de CLAUDE.md.

- **5.3 Corrección:** la primera medida (174,3 kB) incluía por error el polyfill `noModule`, que los navegadores modernos no descargan. La medida correcta es **134,8 kB**, el 67 % del límite de 200 kB.
- **6.2 Supabase local:** `supabase start` terminó con código 0; API en `http://127.0.0.1:54321`, Studio en `:54323`. `imgproxy` y `pooler` quedan detenidos por defecto (no se usan). URL y clave locales escritas en `.env.development.local`.
- **6.3 Enlace con producción:** hecho por el fundador el 2026-11-14. `supabase projects list` muestra `confiahomeDB` como `linked: true`; `supabase migration list --remote` responde sin migraciones. La CLI actual no pidió contraseña.
- **7.1 Puerta de cierre (2026-11-14):** `lint` 0 · `typecheck` 0 · `test` 49 pruebas en 9 archivos · `e2e` 6 de 6 · `build:worker` 0 (sin secretos incrustados, 847,3 KiB de 3072) · `measure:js` 134,8 kB de 200 · `opennextjs-cloudflare preview`: `/es` 200 `lang="es"`, `/en` 200 `lang="en"`, `/fr` 404.
- **7.2 Revisión de código** (revisor independiente, 15 hallazgos). Corregidos: reglas de lint que se saltaban con `import()`, `require`, rutas relativas, segmentos `..` y `./server` desde `lib/`; reglas ausentes en `app` y `worker`; colores numéricos (`0xff6b4a`), en mayúsculas y `color()`; falsos positivos con entidades HTML; diccionarios exentos de la regla de color; medición del JS que contaba el polyfill y daba 0 por válido; `reuseExistingServer`; bloqueo de `WebSocket`, `EventSource` y `XMLHttpRequest`; `scripts/` sin tipar; `engines`. **Hallazgo grave corregido:** OpenNext incrusta `.env` y `.env.local` en el Worker; el archivo de desarrollo pasó a `.env.development.local` (que no se incrusta), `wrangler.jsonc` fija `SERVICES=real` en producción y `build:worker` falla si detecta un secreto incrustado. No corregido, aceptado: los nombres de color (`"red"`) no se detectan; `node:http` no se bloquea en pruebas; `import "server-only"` no se añadió porque rompe Vitest.
- **Cobertura de escenarios:** «Vista previa en Workers» y «Supabase local» se verifican a mano (evidencia arriba), no con una prueba automática.

## Workflow follow-up

- `/opsx:verify` y, con el visto bueno del fundador, `/opsx:archive`.
