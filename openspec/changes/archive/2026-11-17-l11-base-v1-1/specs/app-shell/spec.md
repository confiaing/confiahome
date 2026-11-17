# Armazón de la aplicación

## Purpose

La aplicación sirve un documento HTML válido en cada ruta de idioma, tanto en el servidor de desarrollo como en el runtime de Cloudflare Workers, de modo que los lotes siguientes construyan sobre una base que ya funciona de extremo a extremo.

## MODIFIED Requirements

### Requirement: Paridad con el runtime de Workers
La aplicación SHALL servir las mismas rutas al ejecutarse en el runtime de Cloudflare Workers. Las páginas generadas en el build SHALL servirse desde ese build, sin volver a generarse en cada visita.

#### Scenario: Vista previa en Workers
- **GIVEN** el build de producción
- **WHEN** se ejecuta la vista previa en el runtime de Workers y se solicita `/es`
- **THEN** responde 200 con `lang="es"`

#### Scenario: Páginas servidas desde el build (M)
- **GIVEN** el sitio desplegado
- **WHEN** se pide `/es` varias veces seguidas
- **THEN** todas responden 200
- **AND** la respuesta indica que viene de la caché del build
