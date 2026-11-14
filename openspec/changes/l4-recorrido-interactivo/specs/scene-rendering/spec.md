# Escena del recorrido

## Purpose

Define la imagen que acompaña al recorrido —un camino de cinco terrazas que se construye etapa a etapa—, sus dos versiones (3D y ligera), cuándo se sirve cada una y cómo el visitante puede cambiarla, sin que la página dependa de la versión 3D para leerse.

## ADDED Requirements

### Requirement: Un solo modelo para las dos versiones
La escena MUST describirse con un único modelo determinista: un camino de cinco tramos, los bloques de cada tramo y su estado (construido o disperso) según la etapa. Las versiones 3D y ligera MUST derivarse de él.

#### Scenario: Estado en la etapa 3 (U · L4-8)
- **GIVEN** el modelo de la escena y la etapa 3
- **WHEN** se calcula el estado
- **THEN** los tramos 1 a 3 están construidos
- **AND** los 4 y 5 dispersos

#### Scenario: Determinista (U)
- **GIVEN** el modelo
- **WHEN** se genera dos veces
- **THEN** el resultado es idéntico

#### Scenario: Extremos (U)
- **GIVEN** el modelo antes de la etapa 1 y en la etapa 5
- **WHEN** se calcula el estado
- **THEN** antes de la 1 todos los tramos están dispersos y en la 5 todos construidos

### Requirement: Versión ligera en el HTML
El hero, el recorrido y el cierre MUST incluir en el HTML servido la escena como ilustración SVG decorativa, con colores tomados de los roles de la escena. En el recorrido, la ilustración MUST reflejar la etapa seleccionada.

#### Scenario: Ilustración en las tres ranuras (E · L4-7)
- **GIVEN** el modo ligero
- **WHEN** carga la home
- **THEN** no se solicita el archivo de Three.js
- **AND** cada ranura muestra el SVG de la escena

#### Scenario: Presente sin JavaScript (E)
- **GIVEN** JavaScript desactivado
- **WHEN** carga la home
- **THEN** las tres ilustraciones son visibles

#### Scenario: Sigue a la etapa (E)
- **GIVEN** el modo ligero y el recorrido
- **WHEN** se selecciona la etapa 3
- **THEN** la ilustración muestra construidos los tramos 1 a 3 y atenuados los 4 y 5

#### Scenario: Decorativa y por roles (I)
- **GIVEN** la ilustración
- **WHEN** se inspecciona
- **THEN** está oculta a las tecnologías de apoyo
- **AND** ninguno de sus colores es un valor literal

### Requirement: Elección automática de versión
La versión MUST decidirse así: ligera si no hay WebGL; si no, la que el visitante eligió antes; si no eligió, ligera cuando haya ahorro de datos, conexión 2G o 3G, 2 GB de memoria o menos, 2 núcleos o menos, o movimiento reducido; en otro caso, completa. La decisión MUST incluir el motivo.

#### Scenario: Sin WebGL (U · L4-7)
- **GIVEN** un entorno sin WebGL
- **WHEN** se decide el modo
- **THEN** es «ligero»

#### Scenario: Condiciones de equipo o red (U · L4-7)
- **GIVEN** `saveData` activo, conexión `3g`, memoria ≤ 2 GB o `prefers-reduced-motion`
- **WHEN** se decide el modo
- **THEN** es «ligero»
- **AND** el motivo queda disponible para mostrarlo

#### Scenario: La elección del visitante manda sobre lo automático (U)
- **GIVEN** WebGL disponible, conexión lenta y la elección guardada «completa»
- **WHEN** se decide el modo
- **THEN** es «completo»

#### Scenario: Sin WebGL, la elección «completa» no se puede cumplir (U)
- **GIVEN** un entorno sin WebGL y la elección guardada «completa»
- **WHEN** se decide el modo
- **THEN** es «ligero», con el motivo «WebGL no disponible»

#### Scenario: Equipo capaz (U)
- **GIVEN** WebGL disponible y ninguna condición de equipo o red
- **WHEN** se decide el modo
- **THEN** es «completo»

### Requirement: La escena 3D no retrasa la lectura
En versión completa, la librería 3D MUST solicitarse después del evento `load` y no MUST formar parte del JS inicial. La ilustración ligera MUST verse hasta que la escena esté lista.

#### Scenario: Carga diferida (E · L4-8)
- **GIVEN** el modo completo
- **WHEN** la página termina de cargar
- **THEN** Three.js se solicita después del evento `load`
- **AND** no hay errores de consola

#### Scenario: Fuera del Worker (C)
- **GIVEN** el build del Worker
- **WHEN** se inspecciona su código
- **THEN** no contiene la librería 3D

#### Scenario: Fuera del JS inicial (E)
- **GIVEN** el HTML de `/es`
- **WHEN** se listan sus scripts iniciales
- **THEN** ninguno contiene la librería 3D

#### Scenario: Un solo lienzo en la ranura visible (E)
- **GIVEN** la escena activa
- **WHEN** el visitante se desplaza del hero al recorrido y al cierre
- **THEN** hay un único lienzo en la página, dentro de la ranura que está a la vista

### Requirement: La escena 3D sigue a la etapa y al desplazamiento
En versión completa, al seleccionar una etapa el camino MUST construirse hasta su terraza. La cámara MUST acompañar el desplazamiento de la página sin bloquearlo ni alterarlo.

#### Scenario: Sigue a la etapa (E)
- **GIVEN** la escena activa en el recorrido
- **WHEN** se selecciona la etapa 4
- **THEN** la escena recibe la etapa 4 como destino

#### Scenario: El desplazamiento es del visitante (E · L4-6)
- **GIVEN** el modo completo
- **WHEN** el visitante desplaza la página por el recorrido
- **THEN** la cámara acompaña el avance
- **AND** el desplazamiento nativo nunca se bloquea ni se secuestra

### Requirement: La escena 3D no consume recursos sin verse
El bucle de dibujo MUST detenerse cuando la pestaña del navegador se oculta o cuando ninguna ranura está a la vista, y MUST liberarse al pasar a versión ligera.

#### Scenario: Pestaña oculta (E · L4-8)
- **GIVEN** la escena activa
- **WHEN** la pestaña del navegador se oculta
- **THEN** se detiene el bucle de render

#### Scenario: Fuera de pantalla (E)
- **GIVEN** la escena activa
- **WHEN** ninguna ranura está a la vista
- **THEN** se detiene el bucle de render

### Requirement: La escena falla hacia la versión ligera
Si la librería no se puede cargar, la escena no arranca o se pierde el contexto gráfico, la página MUST pasar a versión ligera y comunicarlo.

#### Scenario: Falla la carga (E · L4-8)
- **GIVEN** que falla la carga de Three.js
- **WHEN** se detecta
- **THEN** la página pasa a modo ligero
- **AND** lo comunica en el pie

#### Scenario: Se pierde el contexto gráfico (E)
- **GIVEN** la escena activa
- **WHEN** el navegador pierde el contexto WebGL
- **THEN** la página pasa a modo ligero y lo comunica

### Requirement: Control de versión del visitante
En las páginas con escena, el pie MUST ofrecer un control para elegir versión ligera o completa, que indica la activa, aplica el cambio al instante, recuerda la elección y explica el motivo cuando la versión ligera es automática o forzosa. Solo MUST guardarse la elección, sin ningún dato del visitante.

#### Scenario: Pasar a ligera (E · L4-9)
- **GIVEN** el modo completo
- **WHEN** el visitante elige «Versión ligera»
- **THEN** la escena pasa a SVG al instante
- **AND** la preferencia se recuerda al recargar

#### Scenario: Sin WebGL (I · L4-9)
- **GIVEN** un navegador sin WebGL
- **WHEN** elige «Versión completa»
- **THEN** permanece en ligera
- **AND** se explica el motivo

#### Scenario: Motivo de la versión automática (I)
- **GIVEN** la versión ligera activada por ahorro de datos
- **WHEN** se lee el control, en español y en inglés
- **THEN** indica que es automática y por qué

#### Scenario: Solo donde hay escena (E)
- **GIVEN** una página legal
- **WHEN** se mira el pie
- **THEN** no aparece el control de versión

#### Scenario: Lo que se guarda (E)
- **GIVEN** una elección de versión
- **WHEN** se inspecciona el almacenamiento del navegador
- **THEN** hay una sola entrada, con el valor «ligera» o «completa»

#### Scenario: Control accesible (I)
- **GIVEN** el control de versión
- **WHEN** se usa con teclado y se analiza con axe
- **THEN** cada opción expone si está activa, el motivo se anuncia sin interrumpir y no hay infracciones
