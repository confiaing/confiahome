# Flujo de desarrollo

## Purpose

Define lo que todo cambio del repositorio cumple antes de llegar a `main`: contra qué especificaciones se escribe, qué guía sigue el agente, qué revisión pasa en local y qué configuración de OpenSpec lo gobierna.

## ADDED Requirements

### Requirement: Especificaciones vigentes archivadas
`openspec/specs/` MUST contener las capacidades vigentes del sitio, y ningún cambio de un lote cerrado MUST quedar abierto en `openspec/changes/`.

#### Scenario: Sin cambios de la v1 abiertos (U)
- **GIVEN** la carpeta `openspec/changes/`
- **WHEN** se listan sus cambios, sin contar `archive/`
- **THEN** ninguno es de L0 a L10

#### Scenario: Capacidades vigentes presentes (U)
- **GIVEN** la carpeta `openspec/specs/`
- **WHEN** se listan sus capacidades
- **THEN** están todas las que declararon los cambios L0 a L10
- **AND** cada una tiene su `spec.md` con `## Purpose` y al menos un `### Requirement:`

#### Scenario: Archivo sin contradicciones (M)
- **GIVEN** las exigencias de L0 a L10 antes de archivar
- **WHEN** se comparan entre sí y con el código actual
- **THEN** las contradichas, duplicadas u obsoletas se corrigen con un delta de este cambio, aprobado por el fundador
- **AND** la revisión y sus resultados quedan anotados en `tasks.md`

### Requirement: Guía del agente al día
`CLAUDE.md` MUST describir el estado actual del proyecto y el flujo de la v1.1: trabajo por rama y pull request, `push` solo con la orden del fundador y revisión de código en local antes de cada `push`.

#### Scenario: Revisión local exigida (U)
- **GIVEN** `CLAUDE.md`
- **WHEN** se lee la sección «Cómo trabajas»
- **THEN** exige la revisión de código en local antes de cada `push`
- **AND** enlaza la decisión D1 del README

#### Scenario: Estado de la v1.1 (U)
- **GIVEN** `CLAUDE.md`
- **WHEN** se lee el estado del proyecto
- **THEN** dice que la v1 está en producción y nombra los lotes L11 a L16
- **AND** no dice que la v1 se sube completa al final

### Requirement: Skill de revisión versionado
El skill de revisión de código que eligió el fundador MUST estar en `.claude/skills/` del repositorio, para que cualquier sesión de Claude Code lo tenga sin instalar nada.

#### Scenario: Skill presente (U)
- **GIVEN** el repositorio
- **WHEN** se busca `.claude/skills/aitmpl-code-reviewer/SKILL.md`
- **THEN** existe y declara `name: aitmpl-code-reviewer`, un nombre que no comparte con ningún skill de los plugins instalados
- **AND** su procedencia (repositorio, commit y huellas) está anotada junto a él

#### Scenario: Contenido revisado antes de instalar (M)
- **GIVEN** el skill descargado de aitmpl.com
- **WHEN** se lee antes de copiarlo al repositorio
- **THEN** no ejecuta comandos de red ni pide subir, desplegar o tocar secretos
- **AND** la revisión queda anotada en `tasks.md`

### Requirement: Configuración de OpenSpec válida
`openspec/config.yaml` MUST leerse sin avisos y describir el plan vigente.

#### Scenario: Reglas legibles (U)
- **GIVEN** `openspec/config.yaml`
- **WHEN** se lee como YAML
- **THEN** cada regla de `rules` es un texto, no un par clave-valor

#### Scenario: Sin avisos en la CLI (M)
- **GIVEN** la configuración corregida
- **WHEN** se ejecuta `openspec instructions specs` sobre un cambio
- **THEN** la salida no contiene avisos sobre las reglas

#### Scenario: Plan vigente en el contexto (U)
- **GIVEN** el campo `context` de la configuración
- **WHEN** se lee
- **THEN** nombra los lotes hasta L16 y los ADR hasta el último existente
- **AND** ninguna regla dice que la v1 se sube completa al final
