# Formulario de consulta

## Purpose

Define el formulario con el que un visitante envía una consulta desde la home: sus campos, sus dos modos de presentación, cómo comunica errores, confirmación y fallos, y qué ofrece cuando no puede funcionar.

## MODIFIED Requirements

### Requirement: Detalles de cada modo
El modo terminal MUST teclear su comando al entrar en pantalla, poner cada pregunta encima de su respuesta y sugerir en el mensaje cuatro ejemplos escritos en bucle; con movimiento reducido, todo aparece completo. El modo clásico MUST mostrar un panel JSON decorativo que se actualiza al escribir y nunca interpreta lo escrito como marcado.

#### Scenario: Sin tecleo con movimiento reducido (E · L5-10)
- **GIVEN** `prefers-reduced-motion: reduce`
- **WHEN** el modo terminal entra en pantalla
- **THEN** el comando aparece completo, sin tecleo animado

#### Scenario: La pregunta va encima de su respuesta (I, E)
- **GIVEN** el modo terminal, en español y en inglés
- **WHEN** se renderiza el campo del mensaje
- **THEN** la pregunta aparece encima del área de texto, no a su lado

#### Scenario: Ejemplos que se escriben en bucle (I)
- **GIVEN** el modo terminal con el mensaje vacío
- **WHEN** el formulario entra en pantalla
- **THEN** la sugerencia del mensaje va escribiendo y borrando los cuatro ejemplos de su idioma, uno tras otro
- **AND** con movimiento reducido muestra el primer ejemplo completo, sin animación

#### Scenario: El panel JSON no interpreta marcado (I · L5-10)
- **GIVEN** el modo clásico
- **WHEN** el visitante escribe `<b>x</b>` en el mensaje
- **THEN** el panel JSON lo muestra como texto, sin interpretarlo como marcado

#### Scenario: Elementos decorativos ocultos (I)
- **GIVEN** el comando del terminal y el panel JSON
- **WHEN** se consulta el árbol de accesibilidad
- **THEN** ninguno de los dos se anuncia
