# Spec Delta

## Purpose

El proyecto decide de forma explícita si usa servicios reales o dobles en memoria, y valida su configuración, de modo que el desarrollo y las pruebas nunca escriban en producción por accidente.

## ADDED Requirements

### Requirement: Selección de servicios
El servidor SHALL resolver sus dependencias según la variable `SERVICES`, con `memory` como valor por defecto.

#### Scenario: Valor ausente
- **GIVEN** que `SERVICES` no está definida
- **WHEN** se resuelven las dependencias
- **THEN** se usan los adaptadores en memoria

#### Scenario: Memoria sin secretos
- **GIVEN** `SERVICES=memory` y ningún secreto definido
- **WHEN** se cargan las variables del servidor
- **THEN** no hay error

#### Scenario: Valor desconocido
- **GIVEN** `SERVICES=otro`
- **WHEN** se cargan las variables
- **THEN** se lanza un error que indica los valores admitidos

### Requirement: Validación de secretos
Con servicios reales, el servidor SHALL rechazar una configuración incompleta en su primer uso, nombrando lo que falta sin revelar ningún valor.

#### Scenario: Secreto ausente
- **GIVEN** `SERVICES=real` y que falta `SUPABASE_SECRET_KEY`
- **WHEN** se cargan las variables del servidor
- **THEN** se lanza un error que nombra `SUPABASE_SECRET_KEY`
- **AND** el mensaje no contiene el valor de ninguna variable

#### Scenario: Configuración completa
- **GIVEN** `SERVICES=real` y todas las variables obligatorias presentes
- **WHEN** se cargan
- **THEN** se obtiene la configuración sin valores vacíos

### Requirement: Los secretos no llegan al navegador
El código destinado al navegador MUST NOT poder leer variables secretas.

#### Scenario: Variables públicas
- **GIVEN** el módulo de configuración pública
- **WHEN** se inspeccionan sus claves
- **THEN** todas empiezan por `NEXT_PUBLIC_`
