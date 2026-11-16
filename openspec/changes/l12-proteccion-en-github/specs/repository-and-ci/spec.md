# Repositorio e integración continua

## Purpose

Define qué se publica en el repositorio de GitHub y qué comprobaciones automáticas deben pasar antes de que un cambio llegue a la rama principal.

## MODIFIED Requirements

### Requirement: Rama principal protegida
La rama principal MUST exigir que las comprobaciones pasen antes de aceptar un cambio. Un cambio MUST llegar por pull request con los cuatro trabajos de la CI en verde y la rama al día con `main`; no MUST poder forzarse su historial ni borrarse. La regla MUST aplicarse también a los administradores, por decisión del fundador.

#### Scenario: Protección activa (M)
- **GIVEN** el repositorio en GitHub
- **WHEN** se consulta la protección de la rama principal
- **THEN** exige las comprobaciones de la integración continua
- **AND** exige `quality`, `contract`, `e2e` y `e2e-preview`, pull request y rama al día
- **AND** prohíbe forzar el historial y borrar la rama

#### Scenario: Un push directo se rechaza (M)
- **GIVEN** la protección activa
- **WHEN** se intenta empujar un commit directamente a `main`
- **THEN** GitHub lo rechaza, también si quien empuja es administrador

#### Scenario: Un pull request en rojo no se funde (M)
- **GIVEN** un pull request con alguno de los cuatro trabajos en rojo
- **WHEN** se intenta fundir
- **THEN** GitHub no lo permite

## ADDED Requirements

### Requirement: Dependencias vigiladas
Las dependencias de npm y las acciones de GitHub MUST revisarse cada semana: las actualizaciones llegan como pull requests que pasan la CI, y una vulnerabilidad alta o crítica conocida MUST dejar una ejecución en rojo.

#### Scenario: Actualizaciones semanales (U)
- **GIVEN** la configuración de Dependabot
- **WHEN** se lee
- **THEN** vigila `npm` y `github-actions` en la raíz, una vez por semana
- **AND** agrupa las actualizaciones menores y de parche de npm en un solo pull request

#### Scenario: Auditoría semanal sin secretos (U)
- **GIVEN** el workflow de auditoría
- **WHEN** se lee
- **THEN** se dispara cada semana y en cada pull request que cambia `package.json` o `package-lock.json`
- **AND** ejecuta `npm audit` con nivel `high`, con permisos de solo lectura y sin secretos

#### Scenario: Primera auditoría (M)
- **GIVEN** el workflow de auditoría en `main`
- **WHEN** se ejecuta a demanda
- **THEN** el resultado queda anotado; si hay vulnerabilidades altas o críticas, se corrigen o se anotan como aceptadas con su motivo
