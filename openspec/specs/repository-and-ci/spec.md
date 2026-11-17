# repository-and-ci Specification

## Purpose
Define qué se publica en el repositorio de GitHub y qué comprobaciones automáticas deben pasar antes de que un cambio llegue a la rama principal.

## Requirements

### Requirement: Lo que se sube no contiene secretos ni datos personales
Antes del primer envío a GitHub MUST revisarse todo lo que se va a publicar, incluido el historial, y no MUST contener claves, archivos de entorno ni datos personales.

#### Scenario: Revisión antes de subir (M · L10-4)
- **GIVEN** el repositorio local antes del primer envío
- **WHEN** se revisan los archivos versionados y el historial completo
- **THEN** no hay claves, archivos `.env` con valores ni datos personales
- **AND** el resultado de la revisión queda anotado

#### Scenario: Archivos de entorno ignorados (U)
- **GIVEN** las reglas de exclusión del repositorio
- **WHEN** se comprueban los archivos de entorno con secretos
- **THEN** todos están excluidos y solo la plantilla de ejemplo está versionada

### Requirement: Comprobaciones automáticas en cada cambio
Cada cambio propuesto a la rama principal MUST ejecutar la puerta de cierre del proyecto: lint, tipos, pruebas unitarias y de integración, E2E, E2E contra el runtime de Workers, build del Worker y presupuesto de JavaScript. MUST ejecutar además las pruebas de contrato contra una base local, que no forman parte de la puerta local porque necesitan Docker.

#### Scenario: La puerta de cierre en CI (M · L10-4)
- **GIVEN** un cambio propuesto
- **WHEN** se ejecuta la integración continua
- **THEN** corre los mismos comandos que la puerta de cierre de `CLAUDE.md` y el contrato
- **AND** falla si alguno falla

#### Scenario: CI sin secretos de producción (U)
- **GIVEN** la definición de la integración continua
- **WHEN** se revisa
- **THEN** no usa ningún secreto de producción ni despliega

#### Scenario: La puerta y la CI no divergen (U)
- **GIVEN** la lista de comandos de la puerta de cierre y la de la integración continua
- **WHEN** se comparan
- **THEN** cada comando de la puerta está en la CI
- **AND** la CI ejecuta también el contrato

### Requirement: Rama principal protegida
La rama principal MUST exigir que las comprobaciones pasen antes de aceptar un cambio.

#### Scenario: Protección activa (M)
- **GIVEN** el repositorio en GitHub
- **WHEN** se consulta la protección de la rama principal
- **THEN** exige las comprobaciones de la integración continua

### Requirement: README de un proyecto desplegado
El README MUST describir lo que está desplegado, cómo ejecutarlo en local y dónde está la guía de operación, sin instrucciones de fases ya cerradas.

#### Scenario: README final (M · L10-5)
- **GIVEN** el README
- **WHEN** lo lee alguien nuevo
- **THEN** describe lo desplegado, cómo ejecutarlo en local y cómo operarlo
- **AND** todos sus enlaces internos existen
