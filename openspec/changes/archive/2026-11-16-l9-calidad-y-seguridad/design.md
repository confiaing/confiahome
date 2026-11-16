# Design

## Context

- `wrangler.jsonc` apunta `main` a `.open-next/worker.js`, la entrada que genera OpenNext. No hay `triggers`. `observability.enabled` es `true`.
- `worker/` está vacío. `HealthCheck.ping()` existe como puerto; el adaptador real devuelve `ok: false` a propósito hasta este lote.
- Las seis páginas y la 404 son estáticas, generadas al construir. Next.js escribe en su HTML scripts en línea (los datos con los que React se activa en el navegador) y la home lleva un bloque JSON-LD.
- No se usa middleware (CLAUDE.md: su soporte en OpenNext no está confirmado).
- `npm run e2e` corre contra `next start`, no contra Workers. `npm run preview` levanta el runtime real.
- Terceros que carga la página: `assets.calendly.com` y `calendly.com` (agenda, tras el clic), `challenges.cloudflare.com` (Turnstile, script y marco), `static.cloudflareinsights.com` y `cloudflareinsights.com` (visitas).
- Plazos: `CONTACT_RETENTION_MONTHS = 24`, `EVENT_RETENTION_MONTHS = 13`. La tabla de eventos ya concede `delete` a `service_role`; la de consultas también.
- Pendientes heredados: etiquetas `utm_*` de la consulta sin formato estricto; registros de invocación; límite de eventos comprobado solo con su valor anterior.

Lo que **no sé todavía** y hay que comprobar antes de construir: cómo exporta OpenNext su manejador para envolverlo; si los scripts en línea de Next son idénticos entre builds del mismo código; y el nombre exacto de la opción de wrangler que desactiva los registros de invocación. De ahí la tarea 1.

## Goals / Non-Goals

**Goals**

- Cabeceras y CSP estrictas sin dejar de servir páginas estáticas.
- Cumplir lo que la política de privacidad promete sobre conservación.
- Una mirada de conjunto a la v1 con todo hallazgo serio cerrado.

**Non-Goals**

- Despliegue y CI. Monitorización. Revisión legal.

## Decisions

### D1 — Prueba de concepto antes de nada

Primera tarea, con resultado escrito en `tasks.md`: (a) envolver la entrada de OpenNext desde `worker/index.ts` y servir una página en `preview`; (b) calcular las huellas de los scripts en línea del HTML generado y servir la home con una CSP que solo autorice esas huellas, sin infracciones en la consola; (c) confirmar en la documentación de wrangler la opción de registros.

Si (a) o (b) no son viables, **se detiene el lote y se consulta al fundador** con las alternativas de D3.

### D2 — Entrada propia del Worker (ADR-0016)

`worker/index.ts` exporta `fetch` y `scheduled`:

- `fetch` delega en el manejador de OpenNext, añade las cabeceras y, si la respuesta es HTML, sella sus scripts con el código de esa respuesta.
- `scheduled` llama a `runMaintenance(container)`.

`wrangler.jsonc`: `main` pasa a la entrada propia y se añade `triggers.crons` con un disparo diario. `build:worker` sigue generando `.open-next/` antes.

*Alternativa:* `headers()` en `next.config.ts`. No puede poner un código distinto en cada respuesta ni da dónde poner la tarea programada.

### D3 — CSP con código por respuesta, sellado en el Worker

**Resultado de la prueba de concepto (2026-11-14):**

- Envolver la entrada de OpenNext funciona: `worker/index.ts` importa `../.open-next/worker.js`, reexporta sus tres clases y delega `fetch`. Los archivos estáticos no pasan por el Worker (los sirve el binding de `assets`): sus cabeceras van en `public/_headers`.
- **La CSP por huella no es fiable.** El HTML generado al construir tiene 44 scripts en línea en la home; el que sirve el Worker, 7: Next.js vuelve a trocear los datos de la página al servirla (`x-nextjs-cache: MISS`). Las huellas del build no coinciden, y depender de cómo se trocea un flujo es jugarse que el sitio deje de activarse.
- **Sellar con un código por respuesta sí funciona.** `HTMLRewriter` añade `nonce` a cada `<script>` del HTML y la política autoriza ese código. Probado en Chromium y WebKit, versión completa y ligera, con formulario, agenda y páginas legales: cero infracciones. Incluso con `style-src 'self'`, sin estilos en línea: el HTML servido no lleva ni atributos `style` ni bloques `<style>`.
- El disparo programado se puede lanzar en local con `GET /cdn-cgi/handler/scheduled`.

El fundador eligió esta vía el 2026-11-14, frente a renderizar cada visita o aceptar `unsafe-inline`.

`src/lib/server/security/headers.ts` (puro, probado en unitario): `newNonce()` (16 bytes aleatorios en base64), `contentSecurityPolicy(nonce)` y `securityHeaders({ html, nonce })`.

```
default-src 'self'; base-uri 'self'; form-action 'self'; object-src 'none'; frame-ancestors 'none';
script-src 'self' 'nonce-<código>' https://assets.calendly.com https://challenges.cloudflare.com https://static.cloudflareinsights.com;
frame-src https://calendly.com https://challenges.cloudflare.com;
connect-src 'self' https://cloudflareinsights.com https://challenges.cloudflare.com;
img-src 'self' data:; font-src 'self'; style-src 'self'
```

Sin `upgrade-insecure-requests`: la página no pide ningún recurso por HTTP y HSTS ya obliga a HTTPS; con la directiva, WebKit dejaba de cargar los scripts del sitio servido en local por HTTP y la página no se activaba.

**Límite conocido:** el Worker sella todos los scripts que vienen en el HTML. Si el HTML generado trajera un script inyectado, también quedaría autorizado. Hoy no hay vía para eso: las páginas no renderizan nada escrito por un visitante. Next.js sí copia la ruta y los parámetros pedidos en uno de sus scripts de datos, siempre codificados y dentro de una cadena; una prueba contra `preview` lo vigila con direcciones hostiles. La política sí frena lo que se inserte en el navegador, los manejadores en línea y cualquier origen no declarado. Si algún día una página renderiza contenido de usuarios, hay que revisar esta decisión.

*Alternativas descartadas:* huellas del build (no fiables, arriba); nonce de Next con páginas dinámicas (cada visita se renderiza en el Worker); `'unsafe-inline'` (incumple L9-5).

### D4 — Resto de cabeceras

`Strict-Transport-Security: max-age=31536000` · `X-Content-Type-Options: nosniff` · `Referrer-Policy: strict-origin-when-cross-origin` (el cambio de idioma necesita la ruta de origen dentro del sitio, ADR-0012) · `Permissions-Policy` que niega cámara, micrófono, geolocalización y pago · `X-Frame-Options: DENY` como respaldo de `frame-ancestors` · `Cross-Origin-Opener-Policy: same-origin`. `poweredByHeader` ya está desactivado.

### D5 — Mantenimiento: dominio y adaptadores

- `src/domain/maintenance/`: `cutoff(now, months)` (resta meses naturales), `runMaintenance(deps, now)` que ejecuta latido y dos borrados, cada uno en su `try`, y devuelve un resumen con cuentas.
- Puertos: `HealthCheck` (ya existe) y `Purger { purgeOlderThan(cutoffIso): Promise<number> }`, uno por tabla.
- `adapters/supabase/health.ts`: `HEAD` a `analytics_events?select=id&limit=1` (tabla sin datos personales). `adapters/supabase/purger.ts`: `DELETE …?created_at=lt.<corte>` con `Prefer: count=exact`; se niega a enviar la petición sin una fecha ISO válida.
- Adaptadores en memoria equivalentes. `container.ts` gana `maintenance`.
- Registro: `maintenance.done` con las cuentas; `maintenance.*-failed` con el nombre del error.

### D6 — Registros de la plataforma

`observability` con los registros propios activos y los de invocación desactivados (nombre exacto de la opción, según D1). Si no se pudieran separar, se desactiva la observabilidad entera y se anota: los fallos se verían solo en tiempo real.

### D7 — Etiquetas de campaña de la consulta

`schema.ts` de contacto: `utm*` pasa a validarse con `TAG_PATTERN` (dominio de analítica); lo que no encaja se guarda ausente en lugar de rechazar la consulta. La restricción de la tabla sigue admitiendo 120: no hace falta migración.

### D8 — Pruebas de conjunto

- `tests/e2e/journeys.spec.ts`: los dos flujos por idioma (L9-1) y el recorrido completo con teclado (L9-2), reutilizando los simuladores de Calendly ya escritos, que pasan a `tests/e2e/support/`.
- Accesibilidad (L9-3) y rendimiento (L9-4) ya están cubiertos por lote; se añade una matriz única que nombra cada combinación y se documenta en `docs/` qué prueba cubre cada tarea de L9.
- `tests/preview/` con `playwright.preview.config.ts` y `npm run e2e:preview`: contra `opennextjs-cloudflare preview`, comprueba cabeceras en cada tipo de respuesta, ausencia de infracciones de CSP en un recorrido completo, el flujo de consulta y la agenda. Entra en la puerta de cierre.
- La tarea programada se prueba en `preview` con `GET /cdn-cgi/handler/scheduled`.

### D9 — Auditoría y revisión

`security-audit` sobre todo el repositorio, con su informe en `docs/security/audit-v1.md`. Revisión de código de la v1 completa en un subagente independiente, por áreas (servidor y datos; cliente; build y configuración). Tabla de hallazgos con severidad, decisión y enlace a la prueba.

### Dependencias

Ninguna prevista.

## Risks / Trade-offs

- **El sellado autoriza todo script del HTML.** → Aceptado mientras el HTML no lleve contenido de visitantes (D3).
- **Una respuesta HTML que no pase por el Worker no llevaría política.** → Las E2E contra `preview` comprueban cabeceras en todas las páginas, incluida la 404.
- **Calendly o Turnstile cambian de dominio.** → La página lo acusaría con una infracción; la alternativa con enlace directo y el correo siguen funcionando.
- **Borrado irreversible.** → Solo por fecha, con guarda contra peticiones sin condición, probado en contrato contra la base local. En producción no se ejecuta hasta L10.
- **La copia en el correo no se borra sola.** → Documentado como tarea manual.
- **`e2e:preview` es más lento y depende de workerd.** → Suite corta, solo lo que no se puede ver con `next start`.
- **Tamaño del Worker.** → La entrada propia y el archivo de huellas son pequeños; se sigue midiendo.

## Migration Plan

Sin migración de datos. `wrangler.jsonc` cambia de entrada y gana un disparo programado; se verifica en `preview`. Producción, en L10.

## Cambios durante la implementación

- **CSP por código de un solo uso, no por huella** (D3), decidido con el fundador tras la prueba de concepto. Sin `scripts/build-csp.ts` ni `check-csp.ts`.
- **Sin `upgrade-insecure-requests`:** rompía WebKit con el sitio servido en local por HTTP.
- **`style-src 'self'`**, sin estilos en línea: el HTML servido no los necesita.
- **Archivos estáticos:** cabeceras en `public/_headers`, porque no pasan por el Worker.
- **La tarea diaria lee del entorno solo lo que usa** (`src/lib/server/maintenance.ts` y `service-mode.ts`): evita cargar la validación completa en la entrada del Worker, que crecía 120 KiB.
- **El contenedor pierde `health` y `backend`:** el latido vive en el mantenimiento.
- **`src/domain/attribution.ts`:** una sola validación de etiquetas de campaña y procedencia para analítica y formulario; migración nueva con las restricciones en `contact_requests`.
- **`build:worker` vacía los bloques de desarrollo y pruebas** que OpenNext incrusta (hallazgo S-01 de la auditoría).
- **Con «No rastrear» la consulta no lleva la procedencia** de la visita (`src/lib/privacy.ts`).
- **Reflexión de la dirección:** Next.js copia ruta y parámetros, codificados, en un script de datos. Vigilado con una prueba contra `preview`.
- **Limpieza del preview** por puerto (solo quien escucha) y por carpeta del proyecto.
