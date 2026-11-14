# ADR-0004: Idiomas por ruta, diccionarios tipados y detección sin middleware

**Estado:** Aceptada · **Fecha:** 2026-11-13

## Contexto

ES y EN completos desde el lanzamiento, SEO por idioma, detección inicial por navegador, elección manual persistente y español por defecto (README, decisiones de Fase 1).

## Decisión

- Rutas `/es/...` y `/en/...` con el segmento `[locale]`, pre-generadas para ambos idiomas. Slugs legales localizados: `/es/privacidad`, `/en/privacy`, `/es/terminos`, `/en/terms`.
- Textos en diccionarios TypeScript (`src/i18n/dictionaries/es.ts`, `en.ts`) con un tipo común: una clave que falte en un idioma rompe la compilación.
- `/` es un Route Handler que redirige (302) según: cookie `locale` → cabecera `Accept-Language` → `es`.
- El selector de idioma guarda la cookie `locale` (preferencia funcional, no de rastreo) y navega a la ruta equivalente.
- Cada página emite `lang`, `hreflang` alternos y `x-default` apuntando a `/es`.

## Opciones consideradas

- **`next-intl`:** completo, pero depende de middleware, cuyo soporte en OpenNext para Next.js reciente no está confirmado, y añade peso para dos idiomas y tres páginas.
- **Un solo dominio con idioma por cookie:** peor SEO, sin URLs compartibles por idioma.
- **Detección por geolocalización:** el idioma del navegador expresa mejor la preferencia; un visitante en Colombia con navegador en inglés quiere inglés.

## Consecuencias

- Sin dependencia de i18n ni de middleware.
- Los formatos de fecha o plurales, si aparecen, usan `Intl` nativo.
- Un visitante que entra directo a `/en` nunca es redirigido: la URL manda sobre la detección.
