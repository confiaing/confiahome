# Lanzamiento a producción

## Purpose

Define qué debe cumplirse antes de desplegar el sitio, cómo se protege la base de datos de producción durante el lanzamiento y qué se verifica una vez publicado, de modo que «está en producción» signifique que las dos vías de contacto funcionan de verdad.

## MODIFIED Requirements

### Requirement: Verificación tras el despliegue
Tras desplegar MUST comprobarse en el dominio real que las páginas responden, que llevan las cabeceras de seguridad, que una consulta de prueba se guarda y se avisa, y que la tarea diaria está programada.

#### Scenario: Páginas y cabeceras (M · L10-3)
- **GIVEN** el sitio desplegado
- **WHEN** se piden `/es`, `/en`, una página legal, `robots.txt`, `sitemap.xml` y `llms.txt` por HTTPS
- **THEN** responden 200
- **AND** las páginas HTML llevan política de contenido, HSTS y `nosniff`

#### Scenario: Flujo B real (M · L10-3)
- **GIVEN** el sitio en producción
- **WHEN** se envía una consulta de prueba desde el formulario
- **THEN** se ve la confirmación
- **AND** la fila existe en `contact_requests` y el aviso llega al buzón

#### Scenario: Flujo A real (M · L10-3)
- **GIVEN** el sitio en producción
- **WHEN** se abre la agenda
- **THEN** el calendario de Calendly carga dentro de la página sin infracciones de la política de contenido

#### Scenario: Antispam real (M)
- **GIVEN** el sitio en producción
- **WHEN** se envía una consulta sin token de verificación
- **THEN** el servidor la rechaza y no se guarda

#### Scenario: Datos de prueba retirados (M)
- **GIVEN** las consultas y eventos creados al verificar
- **WHEN** termina la verificación
- **THEN** el fundador decide si se borran de la base de producción o se conservan
- **AND** la decisión queda anotada

#### Scenario: Tarea diaria programada (M)
- **GIVEN** el Worker desplegado
- **WHEN** se consulta su configuración
- **THEN** tiene el disparo diario
- **AND** tras su primera ejecución queda constancia del latido en los registros
