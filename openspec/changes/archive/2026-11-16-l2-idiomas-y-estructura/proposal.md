# Proposal

Lote **L2 — Idiomas y estructura** de [BACKLOG.md](../../../BACKLOG.md). Historias: L2-1, L2-2, L2-3, L2-4, L2-5, L2-6 y L2-7.

## Why

El sitio responde en `/es` y `/en`, pero `/` no lleva a ningún sitio, no se puede cambiar de idioma, los textos viven dentro de un componente y falta el marco común: cabecera, pie y enlaces legales. L3 y L5 necesitan ese marco y los diccionarios.

## What Changes

- **Entrada por idioma:** `/` redirige a `/es` o `/en` según la cookie `locale`, luego el idioma del navegador y, por último, español. Una URL con idioma nunca redirige.
- **Cambio de idioma:** un selector ES/EN en cabecera y pie lleva a la página equivalente y recuerda la elección. Funciona sin JavaScript.
- **Diccionarios tipados** en `src/i18n/dictionaries/`: una clave que falte o sobre en un idioma rompe `typecheck`. Los textos provisionales de L0 pasan al diccionario.
- **Cabecera:** logo, anclas a las secciones, selector de idioma y la acción «Agenda 30 minutos»; menú desplegable en móvil, operable con teclado; enlace «Saltar al contenido».
- **Pie:** logo, `hola@confia.ing`, enlaces a privacidad y términos, selector de idioma y aviso de derechos.
- **Rutas legales provisionales:** `/es/privacidad`, `/en/privacy`, `/es/terminos` y `/en/terms`, con título y aviso de borrador.
- **Página 404** única y bilingüe, con enlace a la home de cada idioma (ver design.md, cambios durante la implementación).
- **Metadatos por idioma:** título, URL canónica y `hreflang` alternos con `x-default` en `/es`.

## Capabilities

### New Capabilities

- `locale-routing`: elección de idioma al entrar, cambio manual, persistencia y rutas equivalentes.
- `translations`: diccionarios ES/EN con paridad garantizada en compilación.
- `site-navigation`: cabecera, menú móvil, enlace de salto y pie.
- `legal-pages`: páginas de privacidad y términos por idioma.
- `not-found-page`: respuesta a rutas inexistentes.

### Modified Capabilities

Ninguna.

## Fuera de alcance

- Contenido de la home y sus secciones (L3). Las anclas de la cabecera apuntan a secciones que aún no existen.
- Calendly dentro de la página (L6): aquí la acción de agenda es el enlace directo.
- Control de versión ligera o completa en el pie (L4-9).
- Texto legal definitivo, SEO completo, `sitemap` e imagen para redes (L8).
- Evento de analítica del cambio de idioma (L7).
- Cabeceras de seguridad (L9).

## ADR que aplican

- [ADR-0004](../../../docs/architecture/adr/0004-internacionalizacion.md): rutas por idioma, diccionarios y detección sin middleware. Se aplica; este lote concreta cómo se guarda la cookie.
- [ADR-0001](../../../docs/architecture/adr/0001-nextjs-sobre-cloudflare-workers.md): servidor por defecto; `"use client"` solo en el menú móvil.
- [ADR-0007](../../../docs/architecture/adr/0007-tokens-de-diseno.md): solo roles de color.
- **ADR nuevo, 0012:** el cambio de idioma pasa por un punto del servidor que fija la cookie. No contradice ninguno anterior.

## Impact

- **Código nuevo:** `src/app/route.ts`, `src/app/api/locale/route.ts`, `src/app/[locale]/[legal]/`, páginas 404, `src/i18n/` (negociación, rutas, diccionarios), `src/components/sections/` (cabecera, pie), `src/components/ui/` (selector de idioma, menú).
- **Código modificado:** `[locale]/layout.tsx`, `[locale]/page.tsx`, `home-placeholder.tsx`.
- **Primer JavaScript de cliente propio** (menú móvil) y **primeras rutas dinámicas en el Worker** (`/` y `/api/locale`): se miden y se comprueban en `preview`.
- Sin dependencias nuevas.
