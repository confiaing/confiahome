# Design

## Context

Motivación y alcance: ver [proposal.md](proposal.md). Requisitos: ver `specs/`.

Estado de partida, comprobado en el código:

- `src/domain/ports.ts` solo define `HealthCheck`. `src/adapters/` tiene `memory/health.ts` y las carpetas `supabase/`, `email/` y `turnstile/` vacías.
- `src/lib/server/container.ts` lanza un error con `SERVICES=real`; `env.ts` ya exige `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `TURNSTILE_SECRET_KEY`, `NOTIFY_FROM` y `NOTIFY_TO`.
- `supabase/migrations/` está vacío. Supabase local está en marcha y el proyecto remoto, enlazado.
- `wrangler.jsonc` no declara bindings de correo ni de límite de frecuencia.
- `closing.tsx` tiene el bloque `#consulta` con un título, una línea y el correo.
- Componentes disponibles: `Field`, `Checkbox`, `Button`, `Notice`, `Card`, `TextLink`. `src/lib/contact.ts` tiene el correo.
- `publicEnv.turnstileSiteKey` existe y puede ser `null`.
- `vitest.contract.config.ts` existe sin pruebas.
- JS inicial: 139,5 kB de 200 kB.

Referencia: `docs/design/ronda5-cercano-3d-finalista.html`, bloque `#consulta` (líneas 734 a 818) y su script (`checkForm`, `startTerm`, `renderJson`).

## Goals / Non-Goals

**Goals:**

- Que una consulta válida no se pierda: si se respondió 201, está guardada.
- Que el caso de uso se pruebe entero sin red, con adaptadores en memoria.
- Que el mismo esquema decida en el navegador y en el servidor.

**Non-Goals:**

- Reintentos, colas o envío diferido del aviso.
- Guardar borradores del formulario en el navegador.
- Enviar el formulario sin JavaScript.

## Decisions

### D1 — Dominio: esquema y caso de uso

`src/domain/contact/`:

| Archivo | Contenido |
|---|---|
| `schema.ts` | Esquema Zod de la consulta. Campos: `name` (1 a 120), `company` (opcional, ≤ 160), `email` (opcional), `phone` (opcional, ≥ 7 dígitos, ≤ 32), `message` (opcional, ≤ 2000), `consent` (debe ser `true`), `locale`, `formMode` (`terminal` \| `classic`), y de control: `website` (campo trampa) y `turnstileToken`. Atribución opcional: `utmSource`, `utmMedium`, `utmCampaign`, `referrerHost`. Regla cruzada: correo o teléfono |
| `errors.ts` | Códigos de error por campo (`required`, `contact-required`, `email-format`, `phone-format`, `too-long`, `consent-required`). El dominio no contiene textos |
| `consent.ts` | `CONSENT_VERSION`, la versión del aviso que el formulario enlaza |
| `ports.ts` | `ContactRepository`, `Notifier`, `SpamVerifier`, `RateLimiter`, `Logger`, `Clock` |
| `submit-contact.ts` | El caso de uso |

`submitContact(input, context, deps)` devuelve una unión: `accepted`, `invalid` (con errores por campo), `spam-rejected`, `rate-limited` o `unavailable`. Orden:

1. Validar. Si falla → `invalid`.
2. Campo trampa relleno → `accepted`, sin guardar ni avisar.
3. Límite de frecuencia por origen → `rate-limited`.
4. Verificar Turnstile → `spam-rejected`.
5. Guardar, con fecha y versión del consentimiento. Si falla → `unavailable`.
6. Avisar. Si falla, se registra y el resultado sigue siendo `accepted`.

El campo trampa va antes del límite y de Turnstile para no gastar verificaciones en robots.

*Mensaje opcional:* el PRD lo lista como campo; los escenarios aceptan una consulta sin él y la maqueta no lo marca como obligatorio.

*Nivel de prueba:* unitario para el esquema; integración para el caso de uso con adaptadores en memoria.

### D2 — Zod en el navegador

El formulario valida con el mismo `schema.ts`. Se importa de `zod/mini`, la variante de funciones sueltas del propio paquete, pensada para pesar poco en el cliente; la regla del dominio («solo `zod`») se cumple.

*Alternativa:* validar a mano en el cliente y con Zod en el servidor. Descartada: dos fuentes de la misma regla.

Si aun así el JS inicial supera el presupuesto, el formulario se parte con `next/dynamic` (se sigue pintando en el servidor; solo se retrasa su hidratación).

### D3 — Adaptadores

| Puerto | Memoria (`adapters/memory/`) | Real |
|---|---|---|
| `ContactRepository` | Lista en memoria; puede configurarse para fallar | `adapters/supabase/contact-repository.ts`: `POST` a PostgREST con `fetch` y la secret key (ADR-0014) |
| `SpamVerifier` | Acepta todo salvo el token `invalid` | `adapters/turnstile/verifier.ts`: `POST` a `siteverify` |
| `Notifier` | Guarda los avisos; puede fallar | `adapters/email/notifier.ts`: binding `send_email`, mensaje MIME de texto plano compuesto a mano |
| `RateLimiter` | Contador por clave | `adapters/ratelimit/limiter.ts`: binding de límite de frecuencia de Workers |

- El aviso se compone en `adapters/email/compose.ts`, función pura: asunto fijo, cuerpo con los campos, `Reply-To` si hay correo. Cualquier salto de línea en un valor que vaya a una cabecera se elimina.
- Los adaptadores reales reciben `fetch` y los bindings por parámetro: se prueban sin red con dobles.
- **ADR-0014 — PostgREST sin SDK.** Una inserción es una petición HTTP; `@supabase/supabase-js` añadiría peso al Worker (límite de 3 MiB) para una sola llamada.

*Nivel de prueba:* unitario con dobles para Turnstile, correo y límite; contrato para Supabase y para Turnstile con sus claves de prueba.

### D4 — Composición y entorno

- `container.ts` construye las dependencias de contacto: en memoria, o reales leyendo los bindings con `getCloudflareContext()` de OpenNext. Solo `lib/server` conoce los adaptadores.
- `wrangler.jsonc` declara `send_email` (destino restringido a la dirección verificada) y `ratelimits` (5 envíos por minuto y origen).
- `env.ts` no cambia de variables.
- El contenedor en memoria expone lo guardado y lo avisado solo a las pruebas.

### D5 — Route Handler

`src/app/api/contact/route.ts`, `POST`:

| Comprobación | Respuesta si falla |
|---|---|
| Método | 405 |
| `Origin` igual al del sitio (por `request.url` o `Host`) | 403 |
| `Content-Type: application/json` | 415 |
| Cuerpo ≤ 10 kB | 413 |
| JSON válido | 400 |

Después llama a `submitContact` y traduce: `accepted` → 201, `invalid` → 422, `spam-rejected` → 403, `rate-limited` → 429, `unavailable` → 503. Todas con `Cache-Control: no-store`.

- Los mensajes de error se resuelven con el diccionario del `locale` del cuerpo; si no es válido, español.
- La IP sale de `cf-connecting-ip`, se usa como clave del límite y como `remoteip` de Turnstile, y no se guarda ni se registra.
- `src/lib/server/http.ts`: comprobación de origen y lectura acotada del cuerpo, reutilizables por `/api/events` (L7).

*Nivel de prueba:* integración, llamando al `POST` con un `Request`.

### D6 — Migración

`supabase/migrations/<fecha>_contact_requests.sql`:

- Tabla con las columnas del modelo de datos de `docs/architecture/README.md`.
- `alter table … enable row level security`, sin ninguna política.
- `check (email is not null or phone is not null)`, `check (locale in ('es','en'))`, `check (status in ('new','answered','archived'))`, y longitudes máximas iguales a las del esquema.
- Sin columna para la IP.
- Permisos: se retiran los de `anon` y `authenticated` sobre la tabla.

Se aplica en local con `supabase db reset`. **No se aplica a producción en este lote** (L10, con confirmación del fundador).

*Nivel de prueba:* contrato (`tests/contract/`), contra Supabase local.

### D7 — Formulario

`src/components/contact/`:

| Archivo | Tipo | Contenido |
|---|---|---|
| `contact-form.tsx` | cliente | Estado único: valores, errores, modo, fase (`idle`, `sending`, `sent`, `failed`). Valida con el esquema, envía con `fetch`, gestiona el foco |
| `terminal-fields.tsx` | — | Presentación terminal: ventana índigo, comando tecleado, filas `› campo` |
| `classic-fields.tsx` | — | Presentación clásica con `Field` y el panel JSON |
| `live-json.tsx` | — | Panel `consulta.json`, `aria-hidden`, hecho de nodos de texto de React |
| `typed-command.tsx` | — | Tecleo del comando al entrar en pantalla; completo con movimiento reducido |
| `turnstile.tsx` | cliente | Carga el script de Turnstile cuando el formulario entra en pantalla y entrega el token |
| `use-contact-form.ts` | — | La lógica del formulario, separada de las dos presentaciones |

- **Un solo `<form>`** con `noValidate`. Los dos modos pintan los mismos controles con los mismos `name`; solo uno está montado, y los valores viven en el estado, así que cambiar de modo no pierde nada.
- **Control de modo:** dos botones con `aria-pressed` en un grupo con nombre, como en la maqueta.
- **Errores:** `aria-invalid` y `aria-describedby` por campo; al enviar con errores, foco al primero. El error «correo o teléfono» se muestra en el correo y se asocia a ambos campos.
- **Envío:** botón deshabilitado con `aria-busy` y texto «Enviando…». Al aceptarse, el formulario se sustituye por la confirmación en una región `role="status"` que ya existía vacía, y recibe el foco.
- **Fallo:** `Notice` de error con el correo; los campos siguen con su contenido.
- **Sin JavaScript:** `globals.css` oculta el formulario con `scripting: none` y deja la línea del correo, que se conserva siempre debajo como alternativa.
- **Turnstile sin clave** (`turnstileSiteKey` nulo, en desarrollo y pruebas): no se carga nada y se envía un token vacío, que el verificador en memoria acepta.
- **Atribución:** `utm_*` de la dirección y el host de `document.referrer`, leídos al enviar.
- **Tema:** la ventana del terminal usa `theme-dark`; el resto, la tarjeta clara. En oscuro, error y éxito son coral 300 y salvia, parejas ya verificadas.

`closing.tsx` monta `ContactForm` en `#consulta`.

*Nivel de prueba:* integración parametrizada por modo, con `fetch` simulado; E2E contra el servidor en memoria.

### Dependencias

- `domain/contact` importa solo `zod`. `adapters/*` importan `domain`. `lib/server` compone. `app/api/contact` importa `lib/server`, `domain` e `i18n`. `components/contact` importa `domain`, `i18n`, `lib` y `components/ui`.
- `"use client"`: `contact-form.tsx` y `turnstile.tsx`.

## Risks / Trade-offs

- **Zod infla el JS inicial** → `zod/mini`, medición, y partir el formulario si hace falta.
- **Bindings de Workers solo en el runtime real** (`send_email`, límite de frecuencia) → Dobles en las pruebas; en `preview` se comprueba que el Worker arranca con ellos declarados. El envío real se prueba en L10.
- **`send_email` exige una dirección de destino verificada** → Hasta que el fundador la tenga, el adaptador real fallará al avisar; por diseño eso no pierde la consulta.
- **Turnstile necesita su script de terceros** → Se carga solo al acercarse el formulario; si no carga, error con el correo. La CSP que lo permita llega en L9.
- **El campo trampa puede rellenarlo un gestor de contraseñas** → Nombre poco habitual (`website`), `autocomplete="off"`, `tabindex="-1"` y oculto también a lectores de pantalla.
- **El límite en memoria no vale entre instancias** → Solo se usa en pruebas y desarrollo.
- **Datos personales en registros** → `Logger` recibe un código y un contexto sin campos del visitante; una prueba lo comprueba.
- **Pruebas de contrato dependen de Docker** → Si Supabase local no está en marcha, la suite falla con un mensaje claro; no forma parte de `npm test`.
- **El lote es grande** → Orden: dominio, adaptadores en memoria y handler; migración y contrato; adaptadores reales; formulario; E2E.

## Migration Plan

La migración se aplica solo en local. Para revertir el lote: revertir el commit y `supabase db reset`.

## Cambios durante la implementación

- **Archivos del formulario.** `classic-fields.tsx` y `terminal-fields.tsx` quedaron en un solo `form-fields.tsx`: comparten atributos, identificadores y la regla de qué describe a cada campo.
- **Identificador de la consulta.** Lo genera el adaptador (`crypto.randomUUID()`) y se inserta con `Prefer: return=minimal`. Guardar ya no depende de leer la respuesta.
- **Token antispam.** El formulario espera al token (15 s como máximo) en vez de enviar sin él, y pide uno nuevo tras cada envío fallido, incluido un fallo de red.
- **Campo trampa.** En el HTML se llama `cf_ref_code`; en el JSON sigue siendo `website`. Cada activación se registra como `contact.honeypot`, sin datos. El puerto `Logger` ganó `info`.
- **Antes de hidratar.** Botón desactivado y `method="post"`: lo escrito nunca acaba en la URL.
- **Esquema.** Retira caracteres de control antes de validar, rechaza lo que no sea un objeto e informa de la falta de medio de contacto aunque haya otros errores.
- **Tiempos máximos.** 8 s para Turnstile y Supabase; 20 s para el envío desde el navegador.
- **Límite del cuerpo.** 16 kB.
- **Mensaje.** Opcional, como en la propuesta; pendiente de confirmación del fundador.
