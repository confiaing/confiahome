# Proposal

Lote **L8 — Legal y SEO** de [BACKLOG.md](../../../BACKLOG.md). Historias: L8-1 a L8-6, más una nueva, **L8-7 «Legible para agentes»**, pedida por el fundador.

## Why

El formulario enlaza a una política de privacidad que hoy es una página vacía. Y el sitio no se presenta a buscadores ni a asistentes de IA: sin descripción, vista previa, mapa del sitio ni datos estructurados.

## What Changes

- **Política de privacidad y términos**, borradores en ES y EN con base en la Ley 1581 de 2012: quién trata los datos, cuáles, para qué, cuánto tiempo, con qué proveedores (Cloudflare, Supabase, Calendly), derechos y canal de atención. Describen lo que el sitio hace de verdad.
- **Estado «borrador» en un solo interruptor:** sin revisión legal, las páginas muestran el aviso, no se indexan y no entran en el mapa del sitio.
- **Metadatos por idioma:** título y descripción propios, canónica, `hreflang` con `x-default`, y etiquetas para compartir en redes.
- **Imagen para redes** de 1200×630 por idioma, generada con la marca.
- **`sitemap.xml` y `robots.txt`.**
- **Datos estructurados** (JSON-LD): la organización, el sitio y los servicios que la página ya describe.
- **Legible para agentes (L8-7):** `robots.txt` permite por nombre a los rastreadores de IA y `/llms.txt` resume el sitio en texto plano, generado de los diccionarios.

## Lo que necesito que sepas antes de aprobar

1. **Datos del responsable.** La Ley 1581 pide identificar a quien trata los datos: razón social o nombre, identificación, domicilio y canal de atención. No los tengo y no los voy a inventar. El borrador los deja marcados como pendientes, a la vista.
2. **Los borradores no sustituyen al abogado.** El PRD exige validación legal antes del lanzamiento.
3. **`llms.txt` tiene poca evidencia a favor.** Los datos públicos que encontré (2026) indican que casi ningún asistente lo consulta. Cuesta poco y no perjudica; lo incluyo con prioridad baja. Lo que sí pesa ya está o entra aquí: contenido en el HTML sin JavaScript, `robots.txt` y datos estructurados.
4. **El mapa del sitio lista dos direcciones, no seis,** mientras las legales sean borrador: anunciar páginas que a la vez se pide no indexar es una señal contradictoria.

## Capabilities

### New Capabilities

- `legal-pages`: política de privacidad y términos, su estado de borrador y su coherencia con lo que el sitio hace.
- `search-and-agent-discovery`: metadatos, imagen para redes, mapa del sitio, `robots.txt`, datos estructurados y `llms.txt`.

### Modified Capabilities

Ninguna en `openspec/specs/`.

## Fuera de alcance

- Revisión legal y datos del responsable (fundador, antes de L10).
- Cabeceras de seguridad y CSP (L9). Alta en Search Console y comprobación con el dominio real (L10).
- Preguntas frecuentes, blog o páginas por servicio: contenido sin aprobar.

## ADR que aplican

[ADR-0004](../../../docs/architecture/adr/0004-internacionalizacion.md), [ADR-0005](../../../docs/architecture/adr/0005-analitica-sin-cookies.md), [ADR-0011](../../../docs/architecture/adr/0011-fuentes-y-archivos-de-marca-en-el-repositorio.md). Sin ADR nuevo.

## Impact

- **Código nuevo:** `src/i18n/legal/`, `src/lib/seo/`, `src/app/{sitemap.ts,robots.ts,llms.txt/}`, página legal, imagen para redes.
- **Código modificado:** metadatos de home y legales, diccionarios (`meta`).
- Sin dependencias nuevas. Todo es estático: no añade JavaScript al navegador.
