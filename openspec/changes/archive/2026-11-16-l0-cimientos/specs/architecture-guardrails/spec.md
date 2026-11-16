# Guardas de arquitectura

## Purpose

Las reglas de arquitectura del proyecto se verifican de forma automática, para que una violación se detecte al ejecutar el lint y no dependa de la atención de quien revisa.

## ADDED Requirements

### Requirement: Dominio puro
El lint SHALL informar un error cuando un archivo del dominio importe cualquier paquete distinto de `zod` o un módulo fuera del propio dominio.

#### Scenario: Import prohibido en el dominio
- **GIVEN** un archivo de dominio que importa `next`, `react`, `@supabase/supabase-js` o `three`
- **WHEN** se le aplican las reglas del dominio
- **THEN** se informa un error en ese import

#### Scenario: Import permitido en el dominio
- **GIVEN** un archivo de dominio que importa `zod` y otro módulo del dominio
- **WHEN** se le aplican las reglas
- **THEN** no hay errores

### Requirement: Componentes aislados de adaptadores y secretos
El lint SHALL informar un error cuando un componente importe adaptadores o código exclusivo de servidor.

#### Scenario: Componente que importa un adaptador
- **GIVEN** un componente que importa un módulo de adaptadores o de `lib/server`
- **WHEN** se le aplican las reglas
- **THEN** se informa un error en ese import

### Requirement: Sin colores literales
El lint SHALL informar un error ante un color literal en el código fuente de la aplicación fuera del archivo de tokens.

#### Scenario: Color literal en un componente
- **GIVEN** un componente con `#FF6B4A` o `rgb(255, 107, 74)`
- **WHEN** se le aplican las reglas
- **THEN** se informa un error en esa línea

#### Scenario: Palabras clave admitidas
- **GIVEN** un componente que usa `transparent`, `currentColor` o `inherit`
- **WHEN** se le aplican las reglas
- **THEN** no hay errores

### Requirement: El lint del proyecto permanece en verde
Los archivos que demuestran las violaciones MUST quedar fuera del alcance normal del lint y del tipado.

#### Scenario: Lint del proyecto
- **GIVEN** los archivos de ejemplo de violaciones presentes en el repositorio
- **WHEN** se ejecuta el lint del proyecto
- **THEN** termina con código 0
