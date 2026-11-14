# Navegación del recorrido

## Purpose

Define cómo el visitante elige y lee cada una de las cinco etapas del recorrido, con ratón, teclado, lector de pantalla o sin JavaScript, sin que ninguna etapa quede fuera de su alcance.

## ADDED Requirements

### Requirement: Una etapa a la vez
El recorrido MUST mostrar una etapa seleccionada con su nombre, su etiqueta y sus tres apartados (qué hacemos, qué recibes, siguiente paso), y MUST permitir elegir cualquiera de las cinco.

#### Scenario: Elegir la etapa 3 (I · L4-1)
- **GIVEN** el recorrido
- **WHEN** se selecciona la etapa 3
- **THEN** se muestra «Roadmap» con sus tres partes: qué hacemos, qué recibes y siguiente paso

#### Scenario: La etapa 1 no es un diagnóstico (I · L4-1)
- **GIVEN** la etapa 1
- **WHEN** se lee
- **THEN** dice que es una conversación de 30 minutos
- **AND** que no es un diagnóstico ni un compromiso

#### Scenario: Estado inicial (I)
- **GIVEN** el recorrido recién cargado, en español y en inglés
- **WHEN** se inspecciona
- **THEN** la etapa 1 está seleccionada y solo su panel es visible

### Requirement: Patrón de pestañas accesible
La selección de etapa MUST seguir el patrón de pestañas: una lista de pestañas con nombre, cada pestaña con su estado y el panel que controla, y un solo punto de tabulación en la lista. Las flechas MUST mover y seleccionar de forma circular; Inicio y Fin, ir a la primera y a la última.

#### Scenario: Flecha derecha (I · L4-2)
- **GIVEN** el foco en la pestaña 1
- **WHEN** se pulsa Flecha derecha
- **THEN** se selecciona la pestaña 2
- **AND** recibe el foco

#### Scenario: Circular (I · L4-2)
- **GIVEN** el foco en la pestaña 5
- **WHEN** se pulsa Flecha derecha
- **THEN** se selecciona la 1

#### Scenario: Inicio y Fin (I · L4-2)
- **GIVEN** cualquier pestaña
- **WHEN** se pulsa Fin
- **THEN** se selecciona la 5
- **AND** al pulsar Inicio, la 1

#### Scenario: Flecha izquierda, arriba y abajo (I)
- **GIVEN** el foco en la pestaña 1
- **WHEN** se pulsa Flecha izquierda o Flecha arriba
- **THEN** se selecciona la 5
- **AND** Flecha abajo equivale a Flecha derecha

#### Scenario: Atributos y axe (I, E · L4-2)
- **GIVEN** el recorrido
- **WHEN** lo analiza axe
- **THEN** no hay infracciones
- **AND** cada pestaña expone `aria-selected` y `aria-controls`

#### Scenario: Un solo punto de tabulación (E)
- **GIVEN** el foco antes del recorrido
- **WHEN** se pulsa Tab dos veces
- **THEN** el foco pasa por la pestaña seleccionada y luego a su panel, sin recorrer las otras cuatro

#### Scenario: Elegir no mueve la página (E)
- **GIVEN** una pestaña parcialmente fuera de la ventana
- **WHEN** se elige con ratón o con teclado
- **THEN** la página no se desplaza

#### Scenario: Orientación anunciada (E)
- **GIVEN** la lista de pestañas
- **WHEN** se lee a 1280 px y a 375 px
- **THEN** anuncia orientación vertical y horizontal respectivamente

#### Scenario: Posición anunciada (I)
- **GIVEN** una pestaña
- **WHEN** se lee su nombre accesible
- **THEN** incluye el número y el nombre de la etapa

### Requirement: Las etapas no dependen de JavaScript
Con JavaScript desactivado MUST verse el contenido de las cinco etapas en orden. Con JavaScript activado pero sin llegar a ejecutarse, cada etapa MUST seguir alcanzable desde su pestaña.

#### Scenario: Sin JavaScript (E · L4-3)
- **GIVEN** JavaScript desactivado
- **WHEN** carga la home
- **THEN** el contenido de las cinco etapas es visible y legible en orden

#### Scenario: Teclado sin el script (E)
- **GIVEN** JavaScript activado pero el código de la página sin ejecutarse
- **WHEN** se recorren las pestañas con Tab y se pulsa Enter en la cuarta
- **THEN** se muestra la etapa 4

#### Scenario: La dirección cambia después de cargar (I, E)
- **GIVEN** el recorrido cargado con una etapa elegida
- **WHEN** cambia el ancla de la dirección a otra etapa
- **THEN** se muestra esa etapa

#### Scenario: Enlace directo a una etapa (E)
- **GIVEN** la dirección de la home con el ancla de la etapa 4
- **WHEN** carga la página
- **THEN** la etapa 4 es la que se muestra

#### Scenario: Presente en el HTML servido (E)
- **GIVEN** la home
- **WHEN** se lee el HTML de la respuesta
- **THEN** contiene el texto de las cinco etapas

### Requirement: Cambio de etapa sin movimiento cuando se pide
Con la preferencia de movimiento reducido, el cambio de panel MUST ser instantáneo.

#### Scenario: Movimiento reducido (E · L4-4)
- **GIVEN** `prefers-reduced-motion: reduce`
- **WHEN** se cambia de etapa
- **THEN** el panel cambia sin transición
- **AND** la escena se muestra en versión ligera

### Requirement: Recorrido usable en móvil
A 375 px el recorrido MUST usarse sin desplazamiento horizontal de la página, con pestañas de al menos 44 × 44 px.

#### Scenario: Móvil (E · L4-5)
- **GIVEN** un ancho de 375 px
- **WHEN** se recorre la home
- **THEN** no hay desplazamiento horizontal
- **AND** todo control táctil mide al menos 44×44 px

#### Scenario: Las cinco pestañas son alcanzables en 375 px (E)
- **GIVEN** un ancho de 375 px, en español y en inglés
- **WHEN** se recorren las pestañas con el dedo o con las flechas
- **THEN** la pestaña seleccionada queda siempre a la vista

### Requirement: El recorrido no rompe los presupuestos
El recorrido no MUST producir salto de diseño al activarse y MUST mantener el JS inicial dentro del presupuesto.

#### Scenario: Sin salto al hidratar (E)
- **GIVEN** la home en móvil simulado con red limitada
- **WHEN** termina de cargar
- **THEN** el CLS es menor que 0,1 y el JS inicial es ≤ 200 kB comprimido
