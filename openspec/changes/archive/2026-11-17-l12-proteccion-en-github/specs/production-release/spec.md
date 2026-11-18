# Lanzamiento a producción

## Purpose

Define qué debe cumplirse antes de desplegar el sitio, cómo se protege la base de datos de producción durante el lanzamiento y qué se verifica una vez publicado, de modo que «está en producción» signifique que las dos vías de contacto funcionan de verdad.

## ADDED Requirements

### Requirement: Vigilancia diaria de producción
El sitio en producción MUST verificarse cada día de forma automática, sin intervención de nadie y sin crear datos, con las mismas comprobaciones que tras un despliegue. Un fallo MUST dejar una ejecución en rojo que GitHub notifica.

#### Scenario: Disparo diario y a demanda (U)
- **GIVEN** el workflow de vigilancia
- **WHEN** se lee
- **THEN** se dispara cada día y a demanda, nunca por un push
- **AND** ejecuta el verificador contra `https://confia.ing`

#### Scenario: Solo lectura (U)
- **GIVEN** el workflow de vigilancia
- **WHEN** se lee
- **THEN** tiene permisos de solo lectura, no usa secretos y no despliega ni escribe en ninguna base

#### Scenario: Primera ejecución real (M)
- **GIVEN** el workflow en `main`
- **WHEN** se lanza a demanda
- **THEN** termina en verde con todas las comprobaciones del verificador
- **AND** el enlace a la ejecución queda anotado

#### Scenario: Un fallo se ve (M)
- **GIVEN** una ejecución en rojo
- **WHEN** termina
- **THEN** GitHub envía el aviso de fallo a quien tenga activadas las notificaciones de Actions
- **AND** `docs/operations.md` dice qué comprobar primero
