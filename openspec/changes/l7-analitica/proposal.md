# Proposal

Lote **L7 — Analítica** de [BACKLOG.md](../../../BACKLOG.md). Historias: L7-1 a L7-5.

## Why

La página ya tiene sus dos vías de contacto, pero no se sabe cuánta gente llega, cuánta pulsa cada acción ni cuánta termina reservando o escribiendo. El PRD fija como indicador principal las reuniones agendadas y las consultas enviadas, por idioma, dispositivo y canal. Se eligió medirlo sin cookies, sin banner y sin datos personales (ADR-0005).

## What Changes

- **Visitas** con Cloudflare Web Analytics: su script se incluye solo si hay token; sin cookies.
- **Eventos propios**, ocho y ninguno más: vista de página, clic en agendar, clic en consultar, calendario abierto, reunión agendada, formulario iniciado, formulario enviado y cambio de idioma.
- **`POST /api/events`:** acepta solo esos nombres y solo estos datos: idioma, tipo de dispositivo, ruta, sitio de procedencia, `utm_*` y, en los del formulario, el modo. Todo lo demás se descarta antes de guardar.
- **Tabla `analytics_events`** en Supabase, con RLS sin políticas públicas. Sin IP, sin identificador de visitante, sin texto libre.
- **Instrumentación** con un único componente cliente que escucha lo que la página ya emite (agenda) y lo que emitirán el formulario y las acciones. Un fallo de la analítica nunca afecta a la página.
- **Consultas SQL de conversión** documentadas: por idioma, dispositivo, canal y modo de formulario.

## Decisiones que propongo y puedes cambiar

1. **Respetar «No rastrear».** Si el navegador envía Global Privacy Control o Do Not Track, no se envían eventos propios. No es obligatorio (los eventos son anónimos), pero es coherente con no usar banner. Coste: no se cuenta a quien lo activa.
2. **Robots fuera.** Las peticiones de robots conocidos se aceptan y no se guardan.
3. **Límite de frecuencia** de 20 eventos por minuto y origen, para proteger el plan gratuito. La IP solo se usa como clave efímera, igual que en el formulario.
4. **Valores acotados.** `utm_*` solo admite letras, números y `. _ ~ -` (hasta 40): un correo o una frase en la dirección no llega a la base.

## Capabilities

### New Capabilities

- `analytics-events`: recepción, saneado y guardado de eventos anónimos.
- `analytics-instrumentation`: qué se mide en la página, cuándo, y la medición de visitas.

### Modified Capabilities

Ninguna en `openspec/specs/`. `contact-form` gana dos avisos internos (iniciado, enviado), sin cambio visible.

## Fuera de alcance

- Panel de informes: se consulta con SQL en Supabase.
- Borrado periódico a los 13 meses y latido diario (L9); texto de privacidad (L8); CSP con el origen de Cloudflare Insights (L9).
- Migración en producción y token real de Web Analytics (L10).

## ADR que aplican

[ADR-0002](../../../docs/architecture/adr/0002-acceso-a-supabase-solo-servidor.md), [ADR-0005](../../../docs/architecture/adr/0005-analitica-sin-cookies.md), [ADR-0008](../../../docs/architecture/adr/0008-estrategia-de-pruebas.md), [ADR-0014](../../../docs/architecture/adr/0014-supabase-por-postgrest-sin-sdk.md). Sin ADR nuevo.

## Impact

- **Código nuevo:** `src/domain/analytics/`, adaptadores de eventos (Supabase y memoria), `src/app/api/events/`, `src/components/analytics/`, migración, `docs/analytics.md`.
- **Código modificado:** `container.ts`, `[locale]/layout.tsx`, `use-contact-form.ts`, acciones y selector de idioma (un atributo `data-*`), `wrangler.jsonc` (segundo límite de frecuencia), `http.ts`.
- **Terceros:** `static.cloudflareinsights.com`, solo con token.
- Sin dependencias nuevas.
- **Del fundador, para L10:** token de Web Analytics.
