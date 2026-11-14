# Design

## Context

Ver `proposal.md` para la motivación. El repositorio tiene las carpetas de `src/` y `tests/` vacías (con `.gitkeep`), los documentos de arquitectura y ningún archivo de configuración. Restricciones que condicionan el diseño: plan gratuito de Cloudflare (Worker ≤ 3 MiB comprimido), un único layout raíz en `[locale]/`, sin middleware, y pruebas U/I/E sin red.

## Goals / Non-Goals

**Goals:**
- Que `npm run dev`, `preview`, `lint`, `typecheck`, `test`, `e2e` y `build` existan y pasen.
- Que las reglas de arquitectura fallen solas cuando se violen.
- Que sea imposible escribir en producción desde desarrollo o pruebas sin un acto deliberado.

**Non-Goals:**
- Diseño visual, tokens o componentes reales.
- Negociación de idioma en `/` (L2). En L0, `/` no existe todavía.
- Adaptadores reales de Supabase, correo o Turnstile (L5).
- Integración continua.

## Decisions

### D1 · Creación manual del proyecto, no `create-next-app`
Las carpetas ya existen con una estructura decidida. Se instalan las dependencias y se escriben los archivos de configuración a mano. *Alternativa:* `create-next-app` en una carpeta temporal y mover archivos; añade plantillas que habría que borrar.

### D2 · Dónde vive cada pieza

| Pieza | Ubicación | Prueba |
|---|---|---|
| Layout raíz y página mínima | `src/app/[locale]/layout.tsx`, `page.tsx` | E |
| Lista de idiomas admitidos | `src/i18n/locales.ts` | U |
| Configuración pública | `src/lib/public-env.ts` | U |
| Configuración de servidor y validación | `src/lib/server/env.ts` | U |
| Composición de dependencias | `src/lib/server/container.ts` | U |
| Puertos mínimos | `src/domain/ports.ts` | — |
| Adaptadores en memoria | `src/adapters/memory/` | U |
| Reglas de lint | `eslint.config.mjs` | U (API de ESLint) |
| Violaciones de ejemplo | `tests/fixtures/lint/` | — |
| Comprobación de tamaño | `scripts/check-worker-size.mjs`, lógica en `scripts/lib/size.mjs` | U |
| Medición del JS inicial | `scripts/measure-initial-js.mjs` | M |

### D3 · Idiomas con `generateStaticParams` y `dynamicParams = false`
`[locale]` pre-genera `es` y `en`; cualquier otro valor responde 404 sin código adicional. *Alternativa:* validar en el layout y llamar a `notFound()`; funciona, pero renderiza bajo demanda.

### D4 · Reglas de arquitectura con `no-restricted-imports` por carpeta
La configuración plana de ESLint aplica bloques distintos a `src/domain/**`, `src/components/**`, etc. Para el dominio se usa una lista de permitidos (todo paquete salvo `zod` queda prohibido mediante un patrón). *Alternativa:* `eslint-plugin-boundaries`; más expresivo, pero una dependencia más para seis reglas.

### D5 · Colores literales con `no-restricted-syntax`
Una regla sobre literales y plantillas de texto que coincidan con `#hex`, `rgb(`, `hsl(` u `oklch(`, activa en `src/**` salvo `src/styles/tokens.css` (que ESLint no analiza). Las utilidades de paleta de Tailwind (`bg-red-500`) se prohíben en L1, cuando existan los tokens. *Limitación aceptada:* no analiza archivos CSS; en L1 se añade una comprobación para ellos.

### D6 · Las violaciones de ejemplo se prueban con la API de ESLint
`tests/fixtures/` queda en `ignores` de ESLint y fuera de `tsconfig`. Una prueba unitaria carga cada archivo con `ESLint.lintText()` indicando una ruta virtual bajo `src/`, de modo que se le apliquen las reglas reales. Así el lint del proyecto sigue en verde y la regla queda demostrada.

### D7 · `SERVICES` y validación perezosa con Zod
`src/lib/server/env.ts` exporta `loadServerEnv(source)`: función pura que recibe un objeto (por defecto `process.env`), valida con Zod y devuelve la configuración o lanza un error con los nombres de las variables. Con `memory` no exige secretos. Se invoca en el primer uso del contenedor, no al importar, para que el build no requiera secretos. *Alternativa:* validar al arrancar; rompería el build y las pruebas.

### D8 · E2E contra el build de producción con `next start`
Playwright levanta `next build && next start` con `SERVICES=memory`. `preview` (Workers) se comprueba aparte con una carga de `/es` en la puerta de cierre. *Alternativa:* E2E contra `preview`; más fiel, pero cada ejecución reconstruye el Worker y es varias veces más lenta para TDD.

### D9 · Tamaño del Worker desde `wrangler deploy --dry-run`
El script ejecuta el dry-run con `--outdir`, comprime el resultado con gzip y compara con 3 MiB. La comparación y el formato del mensaje viven en una función pura probada; la ejecución de Wrangler, no. `npm run build` encadena build de OpenNext y comprobación.

### D10 · Gestor de paquetes y versiones
npm. Última versión estable de cada paquete al instalar; si OpenNext no admite la última de Next.js, se usa la más reciente que admita y se anota en `tasks.md`.

## Risks / Trade-offs

- [Next.js más reciente incompatible con OpenNext o con Workers] → Es la primera tarea: página mínima y `preview`. Si falla, se detiene el lote y se consulta al fundador (ADR-0001 prevé la alternativa).
- [El Worker base ya roza los 3 MiB] → Se mide en L0 y se informa el margen; si es menor del 30 %, se avisa antes de L1.
- [La regla de colores da falsos positivos, p. ej. un identificador `#seccion`] → El patrón exige formato de color (3, 4, 6 u 8 dígitos hexadecimales); los falsos positivos restantes se resuelven renombrando, no con exclusiones.
- [Descarga de imágenes de Supabase local lenta o fallida] → No bloquea el resto del lote: es la última tarea y su evidencia es manual.
- [`supabase link` necesita la contraseña de la base] → La escribe el fundador en su terminal; el agente no la ve.

## Migration Plan

No aplica: no hay nada desplegado. Para deshacer el lote basta con volver al commit anterior.

## Open Questions

- Límite definitivo del JS inicial: se propone 200 kB; se confirma con la medición de la tarea 6.3 y, si la base de Next.js lo supera, se lleva al fundador con el dato.
