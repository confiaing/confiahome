# Repositorio e integración continua

## Purpose

Define qué se publica en el repositorio de GitHub y qué comprobaciones automáticas deben pasar antes de que un cambio llegue a la rama principal.

## MODIFIED Requirements

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
