# Design

## Context

`src/domain/analytics/`, `src/app/api/events/` y `worker/` están vacíos. Lo que ya existe y se reutiliza:

- **Patrón de L5:** dominio puro con `zod/mini`, puertos, adaptadores `memory` y `supabase` (PostgREST con `fetch`, ADR-0014), composición en `container.ts`, ayudas HTTP en `src/lib/server/http.ts` (`isSameOrigin`, `isJson`, `readJsonBody`, `clientAddress`, `json`), registro sin datos personales, pruebas de contrato contra Supabase local.
- **Avisos de la agenda (L6):** `AgendaPanel` ya emite `confia:agenda-opened` y `confia:agenda-scheduled` en `document`, sin datos.
- **Atribución (L5):** `use-contact-form.ts` ya lee `utm_*` y el sitio de procedencia para la consulta.
- **Marcas en el HTML:** las acciones de agenda llevan `data-agenda`; las de consulta son `a[href="#consulta"]`; el selector de idioma enlaza a `/api/locale?to=…`.
- `publicEnv.analyticsToken` existe y hoy no se usa.

## Goals / Non-Goals

**Goals**

- Medir las ocho acciones con contexto, sin que ningún dato personal pueda llegar a la base aunque el cliente lo envíe.
- Que la medición sea un añadido: quitar el componente no cambia nada más.

**Non-Goals**

- Sesiones, embudos por visitante, panel, borrado periódico, CSP.

## Decisions

### D1 — Dominio: `src/domain/analytics/`

- `events.ts`: `EVENT_NAMES` (los ocho), `FORM_EVENTS`, `DEVICES`, y `normalizeEvent(input): { ok: true; event: AnalyticsEvent } | { ok: false }`.
  - Obligatorios: `name`, `locale`, `device`. Si fallan, `ok: false`.
  - `path`: se compara con la lista de rutas del sitio que recibe por parámetro (`knownPaths`); si no está, `"other"`. El dominio no importa `i18n`: la lista la pasa quien compone.
  - `referrerHost`: se extrae el host de lo recibido (admite host o URL), minúsculas, patrón de nombre de host, máximo 255; si no, `null`.
  - `utm*`: `/^[A-Za-z0-9._~-]{1,40}$/`; si no, `null`.
  - `formMode`: solo en `form_started` y `form_submitted`, donde es obligatorio.
  - La salida se construye campo a campo: lo no previsto no puede pasar.
- `device.ts`: `deviceFor(width)` con los cortes del diseño (`< 768` móvil, `< 1100` tableta).
- `ports.ts`: `EventRepository { save(event): Promise<void> }`.
- `record-event.ts`: `recordEvent(input, context, deps)` → `"recorded" | "ignored" | "invalid" | "rate-limited"`. Orden: normalizar → robot (ignorado) → límite (si el limitador falla, pasa) → guardar (si falla, se registra `analytics.save-failed` y devuelve `"ignored"`).

*Alternativa:* validar con un esquema Zod que rechace campos extra. Descartada: un campo de más no debe perder el evento; se descarta el campo.

### D2 — Robots

`context.userAgent` se usa solo para una comprobación (`/bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview/i`) y no se guarda ni se registra. Chromium sin cabeza se anuncia como `HeadlessChrome`: en E2E el servidor corre con `SERVICES=memory` y las pruebas fijan un agente normal donde necesitan ver el evento guardado.

### D3 — Adaptadores y composición

- `adapters/memory/analytics.ts`: lista en memoria, con opción de fallar.
- `adapters/supabase/event-repository.ts`: `POST /rest/v1/analytics_events`, `Prefer: return=minimal`, tiempo máximo de 5 s.
- `container.ts`: `analytics: RecordEventDeps` con repositorio, limitador propio y registro. Binding nuevo `EVENTS_RATE_LIMITER` (20 por minuto) en `wrangler.jsonc`; en memoria, un limitador holgado.

### D4 — `POST /api/events`

403 origen ajeno · 415 no JSON · 413 más de 2 kB · 400 ilegible o inválido · 429 límite · **204** en `recorded` e `ignored`. Siempre `Cache-Control: no-store`. `knownPaths` se construye con `pathFor` de `src/i18n/routes.ts`.

`navigator.sendBeacon` no puede enviar `application/json` sin preflight salvo en el mismo origen, que es el caso: se envía un `Blob` con ese tipo.

### D5 — Migración `analytics_events`

`bigint generated always as identity`, `created_at timestamptz default now()`, `name`, `locale`, `device`, `path`, `referrer_host`, `utm_source`, `utm_medium`, `utm_campaign`, `form_mode`. `check` para cada lista cerrada, para longitudes y para «modo solo en eventos de formulario». RLS activado, sin políticas; `revoke` a `anon` y `authenticated`; `grant insert, select` a `service_role`. Índice por `(created_at, name)`. Se aplica solo en local.

### D6 — Cliente: `src/components/analytics/`

- `track.ts` (sin React): `track(name, extra?)` construye el contexto —`locale` de `<html lang>`, `deviceFor(window.innerWidth)`, `location.pathname`, procedencia externa, `utm_*`— y lo envía con `sendBeacon`; si no existe o devuelve `false`, `fetch` con `keepalive`. Envuelto en `try/catch`: nunca lanza. No hace nada si `navigator.globalPrivacyControl` es verdadero o `doNotTrack` es `"1"`.
- `analytics-tracker.tsx` (`"use client"`, devuelve `null`), montado en `[locale]/layout.tsx`:
  - `page_view` en el montaje (una vez por carga).
  - Un listener de `click` en `document`: `a[data-agenda]` → `cta_schedule_click`; `a[data-cta="contact"]` → `cta_contact_click`; `a[data-locale-switch]` → `language_switched`.
  - Listeners de `confia:agenda-opened` → `calendar_opened`; `confia:agenda-scheduled` → `meeting_scheduled`; `confia:form-started` y `confia:form-submitted` → sus eventos, con `detail.mode`.
- La lectura de `utm_*` y procedencia se extrae a `src/lib/attribution.ts` y la comparten `track.ts` y `use-contact-form.ts`.

`cta_schedule_click` y `calendar_opened` son distintos a propósito: el primero cuenta la intención; el segundo, que el calendario empezó a cargarse (también desde el botón del bloque).

### D7 — Cambios mínimos en lo existente

- `ButtonLink` de consulta (`contact-actions.tsx`): `data-cta="contact"`.
- `language-switch.tsx`: `data-locale-switch` en sus enlaces.
- `use-contact-form.ts`: emite `confia:form-started` (primera edición de cualquier campo, una vez) y `confia:form-submitted` (tras el 201), con `{ mode }` y nada más.

### D8 — Web Analytics

`[locale]/layout.tsx` añade, solo si `publicEnv.analyticsToken`, `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"…"}'>`. Componente de servidor `src/components/analytics/web-analytics.tsx`. También en la 404 global.

### D9 — Consultas

`docs/analytics.md`: embudo diario; conversión por idioma, dispositivo y canal (`utm_source` o procedencia); formulario por modo. Probadas contra la base local con eventos de ejemplo.

### Dependencias

Ninguna nueva.

## Risks / Trade-offs

- **Sin identificador no hay embudo por persona.** → Aceptado en ADR-0005: proporciones por día y segmento.
- **Eventos falsos enviados a mano.** → Mismo origen, lista cerrada, valores acotados y límite de frecuencia. No hay dato sensible que proteger; el riesgo es ruido.
- **Bloqueadores.** → El script de Cloudflare puede bloquearse; los eventos propios son de primera parte.
- **GPC/DNT reduce la muestra.** → Decisión del fundador; es una condición en `track.ts`.
- **`page_view` duplica en parte a Web Analytics.** → Es el denominador de las conversiones dentro de la misma tabla.
- **Robots no listados.** → Entrarán como visitas; se afinará la lista con datos reales.
- **Crecimiento de la tabla en el plan gratuito.** → Filas pequeñas; el borrado a 13 meses llega en L9.

## Migration Plan

Migración nueva aplicada solo en local (`npx supabase db reset`). En producción, en L10 con confirmación del fundador.

## Cambios durante la implementación

- **Límite de frecuencia: 20 por minuto**, no 60. Una visita real no pasa de una decena de eventos; el margen sobrante solo servía a un abuso contra una base que se comparte con el formulario.
- **Etiquetas de campaña: 40 caracteres**, no 120, en el dominio y en la base. Regla documentada: nunca un valor por destinatario.
- **El canal se conserva dentro de la visita.** `track.ts` recuerda la llegada en memoria (no en el almacenamiento), y `/api/locale` reenvía las tres etiquetas `utm_*` de la página de origen, ya saneadas, al cambiar de idioma. Esto toca el manejador del lote L2.
- **Robots.** «bot» se reconoce como palabra o sufijo, para no descartar los teléfonos Cubot.
- **Procedencia.** Se informa el nombre de host sin puerto.
- **404.** La página 404 también lleva la medición: su vista se guarda con ruta «other».
- **Consultas.** Agrupan por día de `America/Bogota` y hay una quinta, del clic a la reserva, más una de tamaño de la tabla.
- **`page_view` por ruta.** El componente usa `usePathname` para contar también la navegación sin recarga.
