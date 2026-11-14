# Design

## Context

Motivación y alcance: ver [proposal.md](proposal.md). Requisitos: ver `specs/`.

Estado de partida, comprobado en el código:

- `src/app/[locale]/layout.tsx` es el único layout raíz, con `dynamicParams = false`: `/fr` ya responde 404 con la página por defecto de Next.js.
- `src/i18n/` solo tiene `locales.ts`; `dictionaries/` está vacío. `home-placeholder.tsx` lleva sus textos dentro.
- `src/app/api/` existe con carpetas vacías. No hay ningún Route Handler ni componente de cliente todavía.
- `src/lib/public-env.ts` ya expone `siteUrl` y `calendlyUrl`.
- Componentes disponibles de L1: `Logo`, `ButtonLink`, `TextLink`, `Card`, `Notice`; temas por clase; enlaces subrayados por defecto.
- Next.js 16.4.6 incluye la opción experimental `globalNotFound`.

Referencia visual: `docs/design/ronda5-cercano-3d-finalista.html`, bloques `.skip`, `.site-header`, `.nav-*`, `.lang` y `.site-footer`.

## Goals / Non-Goals

**Goals:**

- Que todo lo de este lote funcione sin JavaScript, salvo plegar el menú.
- Que añadir una página nueva exija tocar un solo sitio: la tabla de rutas.
- Dejar comprobado en el runtime de Workers que conviven páginas estáticas y Route Handlers.

**Non-Goals:**

- Biblioteca de internacionalización, plurales o formatos de fecha.
- Detección de idioma por ubicación.
- Conservar el ancla (`#como`) al cambiar de idioma.

## Decisions

### D1 — Negociación de idioma: función pura

`src/i18n/negotiate.ts`:

- `parseAcceptLanguage(header)` → lista ordenada por peso, descartando `q=0` y entradas mal formadas.
- `negotiateLocale({ cookie, acceptLanguage })` → `Locale`. Orden: cookie válida, primera coincidencia por idioma base, `DEFAULT_LOCALE`.
- `LOCALE_COOKIE = "locale"` y `LOCALE_COOKIE_MAX_AGE` (un año).

*Nivel de prueba:* unitario.

### D2 — Redirección de la raíz

`src/app/route.ts`, `GET`, con `dynamic = "force-dynamic"`. Lee la cookie y `Accept-Language` de la petición, llama a `negotiateLocale` y responde 307 a `/es` o `/en` con `Cache-Control: private, no-store` y `Vary: Accept-Language, Cookie`.

*Alternativa:* `redirect()` desde una página `app/page.tsx`. Descartada: exigiría un layout raíz propio, y solo `[locale]/layout.tsx` puede poner `<html lang>`.

*Nivel de prueba:* integración (se llama al `GET` con un `Request` construido) y E2E para la entrada directa a `/en`.

### D3 — Tabla de rutas localizadas

`src/i18n/routes.ts`, sin dependencias:

```ts
type RouteId = "home" | "privacy" | "terms";
const SLUGS = { home: { es: "", en: "" }, privacy: { es: "privacidad", en: "privacy" }, terms: { es: "terminos", en: "terms" } };
```

- `pathFor(locale, routeId)` → `/es/privacidad`.
- `matchRoute(pathname)` → `{ locale, routeId } | null`.
- `equivalentPath(pathname, target)` → ruta equivalente, o la home de `target` si no hay coincidencia.
- `legalRouteFor(locale, slug)` → `"privacy" | "terms" | null`.
- `LEGAL_PARAMS` → las cuatro combinaciones válidas, para `generateStaticParams`.

*Nivel de prueba:* unitario.

### D4 — Cambio de idioma por un punto del servidor (ADR-0012)

`src/app/api/locale/route.ts`, `GET /api/locale?to=en&from=/es/privacidad`:

1. Si `to` no es un idioma admitido: 307 a `/`, sin cookie.
2. Calcula el destino con `equivalentPath(from, to)`. `from` solo se usa para buscar en la tabla; nunca se copia a la cabecera `Location`.
3. Responde 307 con `Set-Cookie: locale=<to>; Path=/; Max-Age=31536000; SameSite=Lax; HttpOnly` y `Secure` cuando la petición llega por HTTPS; `Cache-Control: private, no-store`.

El selector (`src/components/ui/language-switch.tsx`, de servidor) pinta el idioma activo como texto con `aria-current="true"` y el otro como enlace a ese punto, con `hreflang`, `lang` y `rel="nofollow"`. Recibe la ruta actual como propiedad.

| Opción | Sin JS | Duración de la cookie | Coste |
|---|---|---|---|
| **Punto del servidor (elegida)** | Funciona | Un año: la pone el servidor | Un salto de redirección al cambiar de idioma |
| Enlace directo + cookie escrita con JavaScript | Navega, pero no recuerda | Safari limita a 7 días las cookies escritas por script | Un componente de cliente más |
| Sin cookie: recordar solo por la URL | Funciona | — | No cumple «la elección persiste» al volver a `/` |

Los buscadores no dependen de este enlace: cada página declara sus alternos en la cabecera HTML (D7).

*Nivel de prueba:* integración para el handler; E2E para el recorrido completo, también sin JavaScript.

### D5 — Diccionarios

- `src/i18n/dictionaries/es.ts`: `export const es = { … }` es la fuente del tipo.
- `src/i18n/dictionaries/types.ts`: `Dictionary`, el tipo de `es` con las hojas ensanchadas a `string`.
- `src/i18n/dictionaries/en.ts`: `export const en: Dictionary = { … }`. Falta o sobra de una clave es error de tipos.
- `src/i18n/dictionaries/index.ts`: `getDictionary(locale)`.

Claves de este lote: `meta`, `skipLink`, `nav`, `language`, `agenda`, `footer`, `legal`, `notFound`, `placeholder`. Las de la home llegan en L3.

Los componentes reciben el trozo de diccionario que usan, no el idioma: así no importan `dictionaries/` y se prueban con textos de ejemplo.

*Prueba de paridad:* una prueba unitaria compila con la API de TypeScript dos archivos de `tests/fixtures/types/` (clave ausente y clave sobrante) y espera un diagnóstico que nombre la clave. Otra recorre los diccionarios reales y comprueba claves iguales y textos no vacíos.

*Alternativa:* JSON con un validador en ejecución. Descartada: el error llegaría al probar, no al escribir.

### D6 — Marco de página

`[locale]/layout.tsx` compone: enlace de salto → `SiteHeader` → `{children}` → `SiteFooter`. Cada página aporta su `<main id="contenido" tabIndex={-1}>`.

| Archivo | Tipo | Contenido |
|---|---|---|
| `components/sections/skip-link.tsx` | servidor | Enlace a `#contenido`, fuera de pantalla hasta recibir foco |
| `components/sections/site-header.tsx` | servidor | Cabecera fija (`sticky`), logo, `NavDisclosure` con anclas, selector y agenda |
| `components/ui/nav-disclosure.tsx` | **cliente** | Botón con `aria-expanded` y `aria-controls`; pliega el `<nav>` en estrecho; Escape devuelve el foco; se cierra al pulsar un enlace |
| `components/ui/language-switch.tsx` | servidor | D4 |
| `components/ui/agenda-link.tsx` | servidor | `ButtonLink` a `publicEnv.calendlyUrl`, nueva pestaña con aviso, atributo `data-agenda` para que L6 lo mejore |
| `components/sections/site-footer.tsx` | servidor | Tema oscuro: logo, correo, enlaces legales, selector, derechos |

Decisiones del menú:

- **Una sola navegación en el DOM.** El finalista duplica los enlaces en dos `<nav>`; aquí hay uno, que el CSS presenta en línea desde 900 px y como panel por debajo.
- **Plegado con una clase, no con `hidden`:** el reinicio de Tailwind aplica `display: none !important` a `[hidden]` y no se podría reabrir por CSS en ancho de escritorio. Cerrado y estrecho, el panel lleva `display: none`, que también lo saca del orden de foco.
- **Sin JavaScript:** un bloque `<noscript>` muestra el panel abierto y oculta el botón.
- **Sin animación de entrada** en este lote: el panel aparece. Cumple movimiento reducido por construcción.
- **Borde al desplazarse:** el finalista lo añade con JavaScript. Aquí la cabecera lleva siempre un borde inferior con el color de borde del tema.

`NavDisclosure` recibe los enlaces como `children` renderizados en el servidor: solo el botón y el estado son de cliente.

*Nivel de prueba:* integración para contenido, estados ARIA y cierre; E2E para foco real, anchos, sin JavaScript y axe.

### D7 — Metadatos

`src/i18n/metadata.ts`: `pageAlternates({ siteUrl, locale, routeId })` devuelve la URL canónica y los alternos (`es`, `en`, `x-default` → español) a partir de `pathFor`. Recibe `siteUrl` como argumento, porque `i18n/` no importa nada del proyecto; las páginas le pasan `publicEnv.siteUrl`. El layout fija `metadataBase`. Las páginas legales y las 404 añaden `robots: { index: false }`.

*Nivel de prueba:* unitario para la función; E2E para el HTML resultante.

### D8 — Páginas legales provisionales

`src/app/[locale]/[legal]/page.tsx` con `generateStaticParams` (las cuatro combinaciones de `LEGAL_PARAMS`) y `dynamicParams = false`. Usa `legalRouteFor`; un cruce de idioma y slug no está entre los parámetros generados y responde 404.

Contenido: `<main>` con título, un `Notice` informativo con el aviso de borrador y el correo de contacto. Componente `components/sections/legal-placeholder.tsx`.

### D9 — Páginas 404

- **Bajo un idioma:** `src/app/[locale]/[...rest]/page.tsx` llama a `notFound()` y `src/app/[locale]/not-found.tsx` pinta la página dentro del layout, con cabecera y pie.
- **`not-found.tsx` no recibe el idioma.** En lugar de un componente de cliente, pinta los dos mensajes, cada uno en un bloque con `lang` y `data-locale`, y el CSS oculta el que no coincide con `<html lang>` (`display: none`, que también lo retira del árbol de accesibilidad).
- **Cabecera y pie en la 404:** el layout sí conoce el idioma, así que el marco sale en el idioma correcto.
- **Fuera de los idiomas admitidos:** `src/app/global-not-found.tsx` (opción `experimental.globalNotFound`), con su propio `<html lang="es">`, los dos mensajes visibles y enlaces a `/es` y `/en`. No lleva cabecera ni pie.

*Alternativa:* `not-found.tsx` de cliente con `useParams()`. Descartada: añade JavaScript y texto de ambos idiomas al paquete para una página de error.

*Nivel de prueba:* E2E (estado HTTP, texto, enlaces, regiones).

### Dependencias

- `components/` importa `i18n` (tipos y `routes`) y `lib`. `app/` compone con `getDictionary`. Sin cambios en la tabla de CLAUDE.md.
- `"use client"`: solo `nav-disclosure.tsx` («menú», ya previsto en las convenciones).

## Risks / Trade-offs

- **`src/app/route.ts` junto a `[locale]` sin layout raíz, y Route Handlers dinámicos en OpenNext** → Es lo primero que se construye y se prueba en `preview` (tarea 2.5). Si falla, detener el lote y consultar; la alternativa es un Worker propio delante de `/`.
- **`[legal]` y `[...rest]` como hermanos, y qué página 404 se sirve al rechazar un parámetro no generado** → Se comprueba con E2E antes de construir el contenido. Si Next.js no sirve `not-found.tsx` en ese caso, `[legal]` valida en ejecución y llama a `notFound()`.
- **`globalNotFound` es experimental** → Si no funciona en el build de OpenNext, se deja la 404 por defecto de Next.js para rutas fuera de `/es` y `/en`, se anota como limitación y la spec se ajusta con el fundador.
- **`GET` que escribe una cookie** → Un precargador podría seguir el enlace y cambiar la preferencia. Mitigación: enlace `<a>` normal (sin precarga de Next.js) y `rel="nofollow"`. El efecto se limita al propio navegador y se corrige con un clic.
- **Las anclas de la cabecera no llevan a nada hasta L3** → Aceptado; L3 crea las secciones con esos identificadores.
- **Primer JavaScript de cliente** → Se mide; el componente no importa nada más que React.
- **Cambiar de idioma pierde el ancla** → Aceptado: el servidor no recibe el fragmento.

## Migration Plan

Nada desplegado. Para revertir, revertir el commit del lote.

## Cambios durante la implementación

Lo construido difiere de lo escrito arriba en estos puntos. Donde hay contradicción, vale esta sección.

| Punto | Previsto | Construido | Motivo |
|---|---|---|---|
| D2, D4 · Redirecciones | `Location` absoluta a partir de `request.url` | `Location` relativa (`/en`) | En el runtime de Workers en local, `request.url` llevaba otro host que el del navegador. Una ruta relativa vale siempre. |
| D4 · Página de origen | Parámetro `from` en el enlace | Cabecera `Referer`, solo si es del mismo sitio (por `request.url` o por `Host`) | El layout no conoce la ruta actual, y la 404 tampoco; con `Referer` el mismo enlace vale en cabecera, pie y 404. Si falta, se va a la home. |
| D4 · Selector | Recibe la ruta actual | Solo recibe el idioma | Consecuencia de lo anterior. |
| D5 · Nombres de idioma | Claves del diccionario | `LOCALE_NAMES` en `locales.ts` («Español», «English») | Cada opción se anuncia en su propio idioma; no se traduce. |
| D5 · Componentes y diccionario | Reciben solo su trozo | `SiteHeader` y `SiteFooter` reciben el diccionario entero; el resto, su trozo | Usan cuatro secciones cada uno. |
| D6 · Ancho de cambio | 900 px | Token `--breakpoint-nav` (56,25 rem) con variantes `nav:` y `max-nav:` | Un solo lugar para el valor. |
| D6 · Pie al fondo | — | `body` en columna con `main` creciendo | En páginas cortas quedaba una franja crema bajo el pie. |

| D6 · Identificadores del menú | En el componente de cliente | En `components/ui/nav-ids.ts` | Una constante exportada desde un módulo `"use client"` no se puede leer en el servidor. |
| D6 · Sin JavaScript | Bloque `<noscript><style>` | Regla `@media (scripting: none)` en `globals.css`, que además quita el `sticky` | El bloque era HTML no conforme y CSS en línea que la CSP de L9 habría tenido que permitir. Hallazgo de la revisión. |
| D6 · Cierre del menú | Escape y elegir enlace | Además se cierra si el foco sale hacia la página o si la ventana se ensancha | Abierto podía tapar el elemento enfocado. Hallazgo de la revisión. |
| D2 · Consulta de la URL | — | `/` conserva `?utm_source=…` al redirigir | Se perdía el origen de una campaña. Hallazgo de la revisión. |
| D4 · `Secure` | Si la petición llega por HTTPS | Siempre, salvo en `localhost`, `127.0.0.1` y `[::1]` | Tras el proxy, el protocolo de `request.url` no es fiable. Hallazgo de la revisión. |
| D7 · URL del sitio | `publicEnv.siteUrl` | Igual, pero en un build de producción sin la variable vale `https://confia.ing` | Canónica y alternos salían con `localhost`. Hallazgo de la revisión. |
| **D9 · Páginas 404** | Una por idioma, dentro del marco, más una global bilingüe | **Una sola, bilingüe** (`global-not-found.tsx`), con el logo y sin cabecera ni pie completos | La 404 de un layout bajo `[locale]` responde 404 pero Next.js entrega el HTML vacío y la pinta con JavaScript: violaba la regla de no depender de JavaScript para contenido. Solo `global-not-found` llega completa, y es estática: no conoce la ruta pedida. Hallazgo crítico de la revisión. |
| D8 · `[legal]` | `dynamicParams = false` | Igual que lo previsto | Un cruce de idioma y slug cae en la 404 global. |
| D9 · `[...rest]` y `[locale]/not-found.tsx` | Previstos | Eliminados | Consecuencia de la fila anterior. |

**Limitaciones aceptadas**

- Sin `Referer`, cambiar de idioma lleva a la home del idioma elegido, no a la página equivalente.
- Las anclas de la cabecera no llevan a ninguna sección hasta el lote L3.
- La página 404 no puede mostrar solo el idioma de la ruta ni el marco completo sin depender de JavaScript. Alternativa descartada: servir la página del idioma con estado 200.
- Con JavaScript activado pero sin cargar (red caída a media página), el menú móvil no se abre. Las mismas acciones siguen en el pie (idioma) y en el contenido.
- Navegadores sin scripts y anteriores a 2023 no entienden `scripting: none` y muestran el menú plegado.
- El año del pie se fija al construir las páginas estáticas: se actualiza con el primer despliegue de cada año.
- `#contenido`, `#donde-empezamos` y `#como` son los mismos en `/es` y `/en`.
- Cualquier sitio puede fijar el idioma de un visitante enlazando a `/api/locale`; el efecto es solo el idioma y se corrige con un clic.
