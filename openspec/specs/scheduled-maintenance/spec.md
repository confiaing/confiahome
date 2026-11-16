# scheduled-maintenance Specification

## Purpose
Define la tarea diaria del Worker: mantener activa la base de datos y borrar los datos que superan el plazo de conservación declarado en la política de privacidad.

## Requirements

### Requirement: Latido diario
El Worker MUST ejecutar una vez al día una consulta mínima contra la base de datos, de modo que el proyecto de Supabase no se pause por inactividad.

#### Scenario: El disparo programado consulta la base (I · L9-8)
- **GIVEN** el disparo programado
- **WHEN** se ejecuta
- **THEN** hace una consulta mínima al almacén
- **AND** deja constancia del resultado sin datos de ninguna consulta

#### Scenario: El latido real (C · L9-8)
- **GIVEN** el adaptador de Supabase contra la base local
- **WHEN** se ejecuta el latido
- **THEN** responde que el almacén está disponible sin leer ninguna fila de datos personales

#### Scenario: Programado una vez al día (U)
- **GIVEN** la configuración del Worker
- **WHEN** se leen sus disparos
- **THEN** hay exactamente uno, diario

### Requirement: Borrado por conservación
La tarea diaria MUST borrar las consultas del formulario con más de 24 meses y los eventos anónimos con más de 13, usando los mismos plazos que declara la política de privacidad.

#### Scenario: Se borra lo vencido y solo lo vencido (I, C)
- **GIVEN** consultas y eventos de distintas fechas, unas anteriores al plazo y otras posteriores
- **WHEN** se ejecuta el borrado
- **THEN** desaparecen las anteriores al plazo
- **AND** las posteriores siguen intactas

#### Scenario: El límite exacto (U)
- **GIVEN** una fecha de ejecución
- **WHEN** se calcula la fecha de corte de cada tabla
- **THEN** es esa fecha menos 24 y 13 meses naturales respectivamente

#### Scenario: Los plazos son los de la política (U)
- **GIVEN** los plazos que usa el borrado
- **WHEN** se comparan con los del texto legal
- **THEN** son las mismas constantes

#### Scenario: Constancia sin datos personales (I)
- **GIVEN** un borrado ejecutado
- **WHEN** se lee lo registrado
- **THEN** dice cuántas filas se borraron de cada tabla
- **AND** no contiene nada de su contenido

### Requirement: La tarea nunca falla a medias ni en silencio
Un fallo en el latido o en un borrado MUST registrarse y no MUST impedir los demás trabajos ni lanzar una excepción sin capturar.

#### Scenario: Falla el latido (I · L9-8)
- **GIVEN** que la consulta del latido falla
- **WHEN** termina la tarea
- **THEN** el fallo queda registrado
- **AND** el borrado se intenta igualmente y no se lanza ninguna excepción

#### Scenario: Falla un borrado (I)
- **GIVEN** que el borrado de una tabla falla
- **WHEN** termina la tarea
- **THEN** el fallo queda registrado y el borrado de la otra tabla se ejecuta

### Requirement: El borrado no puede tocar producción desde desarrollo
Las pruebas del borrado MUST ejecutarse solo contra la base local, y el código MUST borrar únicamente por fecha de creación, nunca sin condición.

#### Scenario: Sin condición no se borra (U, I)
- **GIVEN** una fecha de corte ausente o no válida
- **WHEN** se pide el borrado
- **THEN** no se envía ninguna petición de borrado

#### Scenario: Solo en local (C)
- **GIVEN** las pruebas de contrato del borrado
- **WHEN** la dirección de la base no es local
- **THEN** no se ejecutan

### Requirement: Registros de la plataforma sin datos del visitante
La configuración del Worker no MUST conservar registros automáticos de cada petición que puedan incluir la IP o el agente de usuario. Los registros propios MUST seguir disponibles.

#### Scenario: Registros de invocación desactivados (U)
- **GIVEN** la configuración del Worker
- **WHEN** se lee su apartado de observabilidad
- **THEN** los registros de invocación están desactivados y los registros propios, activos
