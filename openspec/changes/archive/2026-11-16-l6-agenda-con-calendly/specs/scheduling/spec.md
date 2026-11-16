# Agenda de la conversación

## Purpose

Define cómo un visitante reserva la conversación de 30 minutos desde la home: cuándo se carga el calendario de Calendly, qué se ofrece si no carga, qué se muestra al completar la reserva y cómo se usa con teclado y tecnologías de apoyo.

## ADDED Requirements

### Requirement: El calendario se carga solo a petición
La home no MUST pedir ningún recurso de Calendly hasta que el visitante active una acción de agenda. Al activarla, el calendario MUST cargarse dentro del bloque «Agenda» de la propia página.

#### Scenario: Nada de Calendly al cargar la página (E · L6-1)
- **GIVEN** la home recién cargada en `/es` y en `/en`, recorrida hasta el final
- **WHEN** se inspeccionan las peticiones de red
- **THEN** ninguna va a `calendly.com` ni a sus subdominios
- **AND** el HTML no contiene ningún marco ni script de Calendly

#### Scenario: Una acción de agenda carga el calendario en su bloque (I, E · L6-1)
- **GIVEN** la home con los scripts activos
- **WHEN** el visitante activa la acción de agenda de la cabecera, del hero o del cierre
- **THEN** la página queda en la misma pestaña
- **AND** el bloque «Agenda» pasa a la vista y carga el calendario de Calendly

#### Scenario: El botón del bloque también lo carga (I)
- **GIVEN** el visitante llegó al bloque «Agenda» desplazándose
- **WHEN** activa el botón para ver los horarios
- **THEN** el calendario se carga en el bloque

#### Scenario: Abrir en otra pestaña sigue funcionando (I)
- **GIVEN** una acción de agenda
- **WHEN** se activa con Ctrl, Cmd, Mayús o el botón central
- **THEN** el navegador abre el enlace directo a Calendly y la página no carga el calendario

#### Scenario: Se carga una sola vez (I)
- **GIVEN** el calendario ya cargado
- **WHEN** se activa otra acción de agenda
- **THEN** la página lleva al bloque sin volver a pedir ni duplicar el calendario

### Requirement: Aviso del tercero antes de cargarlo
El bloque «Agenda» MUST decir, antes de la carga, que el calendario lo ofrece Calendly y que se abrirá dentro de la página.

#### Scenario: Aviso visible antes de cargar (I)
- **GIVEN** el bloque «Agenda» sin calendario cargado, en español y en inglés
- **WHEN** se lee su contenido
- **THEN** nombra a Calendly como proveedor del calendario

### Requirement: Idioma del calendario
El calendario es único y su idioma lo fija Calendly en el evento; la página MUST conocerlo por configuración. Cuando no coincide con el idioma activo, el bloque «Agenda» MUST avisarlo antes de cargarlo, y todo el texto propio de la página MUST estar en el idioma activo.

#### Scenario: Aviso cuando el idioma no coincide (I · L6-1)
- **GIVEN** un calendario configurado en inglés y el visitante en `/es`
- **WHEN** llega al bloque «Agenda»
- **THEN** una línea indica que el calendario se muestra en inglés
- **AND** el resto del bloque, sus estados y la confirmación están en español

#### Scenario: Sin aviso cuando coincide (I)
- **GIVEN** un calendario configurado en inglés y el visitante en `/en`
- **WHEN** llega al bloque «Agenda»
- **THEN** no se muestra ningún aviso de idioma

#### Scenario: Idioma del calendario configurable (U)
- **GIVEN** la configuración pública
- **WHEN** se indica que el calendario está en español, o no se indica nada, o se indica un valor no admitido
- **THEN** el idioma es español en el primer caso e inglés en los otros dos

#### Scenario: Dirección del calendario no válida (U)
- **GIVEN** una dirección configurada que no es `https://calendly.com/…`
- **WHEN** se prepara la carga del calendario
- **THEN** no se carga nada de esa dirección y se muestra la alternativa

### Requirement: Alternativa si el calendario no carga
Si el calendario no está disponible tras un tiempo de espera, o su script falla, el bloque MUST mostrar un mensaje con el enlace directo a Calendly y un acceso al formulario de consulta.

#### Scenario: Vence el tiempo de espera (I · L6-2)
- **GIVEN** que se pidió el calendario y Calendly no responde
- **WHEN** vence el tiempo de espera
- **THEN** se muestra un mensaje con un enlace directo a Calendly
- **AND** un enlace al formulario de consulta

#### Scenario: El script no se puede cargar (I, E · L6-2)
- **GIVEN** que las peticiones a Calendly están bloqueadas
- **WHEN** el visitante activa una acción de agenda
- **THEN** se muestra la misma alternativa, sin esperar al tiempo máximo

#### Scenario: El calendario llega tarde (I)
- **GIVEN** la alternativa ya mostrada
- **WHEN** el calendario termina de cargar
- **THEN** se muestra el calendario y se retira el mensaje

#### Scenario: Reintento (I)
- **GIVEN** la alternativa mostrada
- **WHEN** el visitante pide intentarlo de nuevo
- **THEN** el calendario se vuelve a pedir

### Requirement: Confirmación con próximos pasos
Cuando Calendly comunica que la reserva se completó, el bloque MUST mostrar una confirmación que explique qué ocurrirá en la conversación. La confirmación no MUST presentar la conversación como un diagnóstico ni prometer plazos o resultados.

#### Scenario: Reserva completada (I · L6-3)
- **GIVEN** el calendario cargado
- **WHEN** llega el mensaje `calendly.event_scheduled` desde `https://calendly.com`
- **THEN** se muestra la confirmación con los próximos pasos, en el idioma activo
- **AND** se anuncia a las tecnologías de apoyo

#### Scenario: Mensajes de otro origen (I)
- **GIVEN** el calendario cargado
- **WHEN** llega un mensaje `calendly.event_scheduled` desde un origen que no es Calendly
- **THEN** no se muestra la confirmación

#### Scenario: El texto no promete lo que no se incluye (U)
- **GIVEN** los textos de la confirmación en español y en inglés
- **WHEN** pasan las comprobaciones de contenido
- **THEN** no contienen «diagnóstico» como entregable de la llamada, cifras, plazos ni garantías

### Requirement: Agenda sin JavaScript
Sin scripts, cada acción de agenda MUST ser un enlace directo al calendario de Calendly, y el bloque «Agenda» no MUST ofrecer controles que no funcionen.

#### Scenario: Scripts desactivados (E)
- **GIVEN** la home con los scripts desactivados
- **WHEN** se inspeccionan las acciones de agenda y el bloque «Agenda»
- **THEN** cada acción es un enlace a Calendly que se abre en otra pestaña
- **AND** el botón para ver los horarios en la página no se muestra

### Requirement: Accesibilidad del bloque de agenda
El bloque MUST poder usarse con teclado, MUST llevar el foco a su título al abrirse desde una acción, MUST anunciar sus cambios de estado, y el marco del calendario MUST tener un título. Con movimiento reducido, el desplazamiento hasta el bloque MUST ser instantáneo.

#### Scenario: Foco al abrir (I, E · L6-4)
- **GIVEN** la home con los scripts activos
- **WHEN** se activa una acción de agenda con el teclado
- **THEN** el foco pasa al título del bloque «Agenda»
- **AND** la siguiente pulsación de Tab entra en su contenido

#### Scenario: Estados anunciados (I · L6-4)
- **GIVEN** el bloque «Agenda»
- **WHEN** pasa a cargando, a no disponible o a reserva completada
- **THEN** el cambio se comunica en una región viva: los fallos como alerta y el resto sin interrumpir

#### Scenario: Marco con título (I · L6-4)
- **GIVEN** el calendario cargado
- **WHEN** se inspecciona su marco
- **THEN** tiene un título en el idioma activo

#### Scenario: Movimiento reducido (E)
- **GIVEN** la preferencia de movimiento reducido
- **WHEN** se activa una acción de agenda
- **THEN** la página llega al bloque sin desplazamiento animado

#### Scenario: Sin infracciones y dentro de presupuesto (E)
- **GIVEN** el bloque en reposo, cargando, no disponible y con reserva completada, a 375 y 1280 px
- **WHEN** se analiza con axe y se miden JS inicial, LCP y CLS
- **THEN** no hay infracciones, no hay desplazamiento horizontal y las medidas siguen dentro de presupuesto
