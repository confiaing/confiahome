# Design

## Context

- Las cuatro rutas legales existen (`[locale]/[legal]/page.tsx`) con `LegalPlaceholder`: título y aviso de borrador, `robots: noindex`.
- `pageAlternates()` ya da canónica y `hreflang`; la home solo declara título.
- `publicEnv.siteUrl` cae en `https://confia.ing` en producción y en `localhost` en desarrollo.
- La marca se genera con `scripts/build-brand-assets.ts` (fontkit + sharp) a `public/brand/` (ADR-0011).
- Guardas de contenido en `tests/support/claims.ts`.
- Constantes del sistema que la política debe reflejar: campos de `src/domain/contact/schema.ts`, `CONSENT_VERSION`, cookie `locale`, `localStorage["confia-modo"]`, ocho eventos anónimos, GPC/DNT.
- Conservación propuesta en la arquitectura: 24 meses para consultas y 13 para eventos. El borrado periódico llega en L9.

Investigación del 2026-11-14 sobre agentes de IA (fuentes de terceros, no documentación oficial): los rastreadores de IA leen `robots.txt` de forma habitual; `llms.txt` apenas recibe peticiones (un estudio habla de un 97 % de archivos sin ninguna). Nombres en uso: `GPTBot`, `OAI-SearchBot`, `ChatGPT-User`, `ClaudeBot`, `Claude-SearchBot`, `Claude-User`, `PerplexityBot`, `Perplexity-User`, y el token `Google-Extended`.

## Goals / Non-Goals

**Goals**

- Textos legales fieles al sistema, con sus huecos a la vista.
- Presentación completa a buscadores, redes y agentes sin añadir JavaScript.

**Non-Goals**

- Asesoría legal. Contenido nuevo de marketing. CSP.

## Decisions

### D1 — Textos legales como datos tipados: `src/i18n/legal/`

`types.ts`: `LegalDocument = { title; updated; version; intro; sections: { id; heading; blocks: Block[] }[] }`, con `Block = { p: string } | { list: string[] }`. `es.ts` y `en.ts` exportan `privacy` y `terms`. El tipo del inglés se deriva del español en lo estructural (mismos `id` de sección), y una prueba compara número de bloques y de elementos.

Fuera de `dictionaries/`: son textos largos que solo usan dos páginas de servidor; así no viajan con los diccionarios a ningún componente cliente.

Marcas dentro del texto, resueltas al renderizar: `{email}` (enlace al correo), `{pending:clave}` (dato del responsable). No se usa HTML en los textos.

*Alternativa:* Markdown o MDX. Descartada: dependencia nueva y pérdida del tipado que obliga a que ambos idiomas tengan lo mismo.

### D2 — Estado legal en un punto: `src/i18n/legal/status.ts`

`LEGAL_STATUS: "draft" | "in-force"` y `LEGAL_ENTITY = { name, id, address }` con valores `null` hasta que el fundador los aporte. De `LEGAL_STATUS` salen el aviso, `robots` de las páginas legales y su presencia en el mapa. Un dato `null` se pinta como «[pendiente: …]» con estilo propio.

La `version` de la política es `CONSENT_VERSION`; una prueba lo exige (el dominio no importa `i18n`, así que se compara desde la prueba).

### D3 — Página: `LegalDocument`

`src/components/sections/legal-document.tsx` (servidor) sustituye a `LegalPlaceholder`: `h1`, aviso de borrador (`Notice`, no vivo), fecha del borrador, y por sección un `h2` con `id` y sus bloques. Medida de lectura de unos 68 caracteres. Sin índice interactivo.

### D4 — Contenido de la política (resumen)

Responsable (con pendientes) · Datos: los del formulario; datos de la reserva los trata Calendly como responsable propio de su servicio; eventos anónimos sin IP ni identificador · Finalidades: responder la consulta y coordinar la conversación; medir el uso de forma agregada · Autorización: la casilla del formulario · Conservación: 24 meses las consultas, 13 los eventos · Proveedores: Cloudflare (alojamiento, antispam, correo de aviso, visitas), Supabase (base de datos), Calendly (agenda, solo al pedirlo) · Transferencia internacional: los proveedores operan fuera de Colombia · Derechos: conocer, actualizar, rectificar, suprimir, revocar; queja ante la SIC · Canal: el correo · Cookies: sin cookies de seguimiento propias; cookie `locale`; preferencia de versión; Calendly y Turnstile pueden usar las suyas al cargarse; respeto de GPC y DNT.

Lo que la política dice del borrado a 24 y 13 meses se redacta como compromiso de conservación máxima; el mecanismo automático llega en L9 y queda anotado como dependencia.

### D5 — Metadatos: `src/lib/seo/metadata.ts`

`pageMetadata({ locale, routeId, title, description })` devuelve el `Metadata` de Next: `alternates`, `openGraph` (`type: website`, `siteName`, `locale` `es_CO`/`en_US`, `alternateLocale`, imagen con tamaño y `alt`), `twitter` (`summary_large_image`) y `robots` según D2. Diccionarios: `meta.homeDescription`, `meta.ogAlt`, `meta.privacyDescription`, `meta.termsDescription`.

### D6 — Imagen para redes

`scripts/lib/og-image.ts`, llamado desde `build-brand-assets.ts`: SVG con fondo crema, logo y la frase del hero en Fraunces convertida a trazos (fontkit), exportado con sharp a `public/brand/og-es.png` y `og-en.png`, 1200×630. Colores leídos de `tokens.css`. Estático: no usa `next/og` (evita su peso en el Worker).

### D7 — `sitemap.ts` y `robots.ts`

Metadata routes de Next, estáticas. `sitemap`: páginas indexables según D2, con `alternates.languages`. `robots`: grupo general (`allow: /`, `disallow: /api/`), un grupo que nombra a los rastreadores de IA con `allow: /`, y `sitemap` absoluto. La lista de rastreadores vive en `src/lib/seo/ai-crawlers.ts` con la fecha de revisión.

### D8 — JSON-LD: `src/lib/seo/structured-data.ts`

`homeStructuredData(locale, dictionary, siteUrl)` devuelve un `@graph`: `Organization` (`name`, `url`, `logo`, `email`, `contactPoint` con `availableLanguage`), `WebSite` (`inLanguage`, `publisher`) y un `Service` por cada servicio de `home.offer` (`name`, `description`, `provider`). Los textos pasan por `stripEmphasis`. Componente de servidor `JsonLd` que serializa escapando `<` como `<`.

Sin `address`, `telephone`, `sameAs`, `aggregateRating`, `areaServed` ni `priceRange`: nada de eso está aprobado.

### D9 — `/llms.txt`

`src/app/llms.txt/route.ts`, `force-static`, `text/plain; charset=utf-8`. `src/lib/seo/llms.ts` compone Markdown desde los diccionarios: `# Confia.ing`, cita con el resumen, y por idioma: qué ofrece (servicios), cómo trabaja (cinco etapas con qué recibe el cliente), cómo contactar (agenda y formulario, con la conversación descrita como exploratoria) y enlaces a las páginas. Un solo archivo con español e inglés.

### Dependencias

Ninguna nueva.

## Risks / Trade-offs

- **Borrador legal publicado.** → Aviso visible, `noindex` y fuera del mapa; el consentimiento del formulario enlaza a él, así que debe existir.
- **Datos del responsable ausentes.** → Marcados; lanzar sin ellos es decisión del fundador y su abogado, y queda en la lista de L10.
- **La política promete conservación máxima sin borrado automático aún.** → Dependencia explícita con L9.
- **`llms.txt` de utilidad dudosa.** → Coste mínimo y generado; si se quiere, se quita sin tocar nada más.
- **Lista de rastreadores que envejece.** → Un archivo con fecha; el grupo general ya los permite a todos.
- **`og:image` cacheada por las redes.** → Nombre de archivo estable; si cambia la imagen, se versiona el nombre.

## Migration Plan

Sin datos. Las imágenes se generan con `npm run brand:assets` y se guardan en el repositorio.

## Cambios durante la implementación

- **Ubicación del código de SEO:** `src/lib/server/seo/`, no `src/lib/seo/`. `lib/` es segura para el cliente y no puede importar `i18n`; estos módulos necesitan los diccionarios y solo corren en el servidor.
- **Plazos de conservación como constantes del dominio** (`retention.ts` en `contact/` y `analytics/`). Los textos legales los escriben en cifras y una prueba exige que coincidan; L9 usará las mismas constantes para el borrado.
- **Sin componente `JsonLd`:** la home incluye el `<script>` directamente con `serializeJsonLd`.
- **Datos pendientes** con claves `legal.pending.*` en los diccionarios y marca `<mark data-pending>`.
- **`llms.txt`** se compone sin texto nuevo: usa títulos y frases que ya están en los diccionarios.
- **Imagen para redes:** la frase del hero con su palabra resaltada, el logo y una barra de acento; PNG con paleta, de 21 a 26 kB.
- **El contador de visitas respeta «No rastrear».** `WebAnalytics` pasa a ser una hoja cliente que no pide el script de Cloudflare con Global Privacy Control o Do Not Track. Cambia código del lote L7: la política lo promete y antes no se cumplía.
- **Google como proveedor.** El aviso de cada consulta termina en un buzón de Gmail; la política lo nombra y lo cubre en la conservación.
- **Guarda del interruptor:** `publicationBlockers()` impide dar por vigentes unos textos sin datos del responsable o que aún dicen «borrador».
- **La página muestra la versión** del texto, la misma que se guarda con cada consulta.
