# Spec Delta

## Purpose

La aplicación sirve un documento HTML válido en cada ruta de idioma, tanto en el servidor de desarrollo como en el runtime de Cloudflare Workers, de modo que los lotes siguientes construyan sobre una base que ya funciona de extremo a extremo.

## ADDED Requirements

### Requirement: Rutas por idioma
La aplicación SHALL responder en `/es` y `/en` con un documento HTML cuyo atributo `lang` coincide con el idioma de la ruta.

#### Scenario: Español en desarrollo
- **GIVEN** el proyecto recién instalado y el servidor de desarrollo en marcha
- **WHEN** se solicita `/es`
- **THEN** responde 200 con `lang="es"`

#### Scenario: Inglés en desarrollo
- **GIVEN** el servidor de desarrollo en marcha
- **WHEN** se solicita `/en`
- **THEN** responde 200 con `lang="en"`

#### Scenario: Idioma no admitido
- **GIVEN** el servidor en marcha
- **WHEN** se solicita `/fr`
- **THEN** responde 404

### Requirement: Paridad con el runtime de Workers
La aplicación SHALL servir las mismas rutas al ejecutarse en el runtime de Cloudflare Workers.

#### Scenario: Vista previa en Workers
- **GIVEN** el build de producción
- **WHEN** se ejecuta la vista previa en el runtime de Workers y se solicita `/es`
- **THEN** responde 200 con `lang="es"`

### Requirement: Pruebas ejecutables en los tres niveles
El proyecto SHALL ofrecer comandos que ejecuten pruebas unitarias, de integración y E2E, y cada nivel MUST contar con al menos una prueba.

#### Scenario: Suites en verde
- **GIVEN** una prueba de humo en cada nivel
- **WHEN** se ejecutan el comando de pruebas y el de E2E
- **THEN** ambos terminan con código 0 e informan al menos una prueba ejecutada por nivel

#### Scenario: Sin red en unitario e integración
- **GIVEN** las pruebas unitarias y de integración
- **WHEN** se ejecutan sin conexión a red
- **THEN** terminan con código 0

### Requirement: Base de datos local disponible
El proyecto SHALL poder levantar una base de datos local para desarrollo y pruebas de contrato sin tocar la de producción.

#### Scenario: Supabase local
- **GIVEN** Docker en ejecución
- **WHEN** se levanta la base de datos local
- **THEN** queda disponible y no hay migraciones pendientes
