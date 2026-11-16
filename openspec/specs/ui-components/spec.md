# ui-components Specification

## Purpose
Define los componentes base de interfaz —botón, enlace, campo, casilla, tarjeta y aviso—, sus estados y su comportamiento con teclado y tecnologías de apoyo, para que las secciones y el formulario se construyan sobre piezas ya accesibles.

## Requirements

### Requirement: Botón con variantes y estados
El botón MUST ofrecer las variantes primaria y secundaria y un tamaño reducido, con estados de reposo, hover, foco, activo y deshabilitado, y un área táctil de al menos 44 px de alto. La misma apariencia MUST estar disponible para un enlace.

#### Scenario: Foco visible por teclado (I, E · L1-5)
- **GIVEN** un botón primario
- **WHEN** recibe foco por teclado
- **THEN** muestra un anillo de foco visible con contraste ≥ 3:1 respecto al fondo

#### Scenario: Botón deshabilitado (I · L1-5)
- **GIVEN** un botón deshabilitado
- **WHEN** se pulsa con ratón o con teclado
- **THEN** no dispara su acción

#### Scenario: Activación por teclado (I)
- **GIVEN** un botón con una acción
- **WHEN** se activa con Enter o con Espacio
- **THEN** la acción se dispara una vez

#### Scenario: Botón que navega (I)
- **GIVEN** la apariencia de botón aplicada a un destino
- **WHEN** se renderiza
- **THEN** es un enlace con su `href`, no un botón

### Requirement: Enlace de texto
El enlace MUST distinguirse del texto que lo rodea sin depender solo del color, y un enlace que abre otra pestaña MUST indicarlo y proteger la página de origen.

#### Scenario: Distinguible sin color (I)
- **GIVEN** un enlace dentro de un párrafo
- **WHEN** se renderiza
- **THEN** está subrayado

#### Scenario: Enlace externo (I)
- **GIVEN** un enlace marcado como externo
- **WHEN** se renderiza
- **THEN** abre en otra pestaña con `rel="noopener noreferrer"`
- **AND** su nombre accesible incluye el aviso de nueva pestaña que recibe

### Requirement: Campo de formulario
El campo MUST asociar etiqueta, ayuda y mensaje de error con su control, admitir línea única y texto largo, y comunicar el estado de error y el de obligatorio a las tecnologías de apoyo.

#### Scenario: Campo con error (I · L1-5)
- **GIVEN** un campo con error
- **WHEN** se renderiza
- **THEN** tiene `aria-invalid="true"`
- **AND** su mensaje está asociado por `aria-describedby`

#### Scenario: Etiqueta asociada (I)
- **GIVEN** un campo con etiqueta y texto de ayuda
- **WHEN** se busca el control por el texto de su etiqueta
- **THEN** se encuentra, y la ayuda forma parte de su descripción

#### Scenario: Campo sin error (I)
- **GIVEN** un campo sin error
- **WHEN** se renderiza
- **THEN** no tiene `aria-invalid` y no muestra mensaje de error

#### Scenario: Campo obligatorio (I)
- **GIVEN** un campo obligatorio
- **WHEN** se renderiza
- **THEN** el control está marcado como requerido

### Requirement: Casilla
La casilla MUST ser un control nativo con su etiqueta asociada, operable con teclado, y MUST admitir contenido con enlaces en la etiqueta y un mensaje de error asociado.

#### Scenario: Se marca con teclado (I)
- **GIVEN** una casilla con foco
- **WHEN** se pulsa Espacio
- **THEN** cambia de estado

#### Scenario: Casilla con error (I)
- **GIVEN** una casilla con error
- **WHEN** se renderiza
- **THEN** tiene `aria-invalid="true"` y su mensaje está asociado por `aria-describedby`

### Requirement: Tarjeta
La tarjeta MUST ser un contenedor sin semántica propia que tome fondo y texto del tema en el que está, y MUST poder fijar su propio tema.

#### Scenario: Tarjeta con tema propio (I)
- **GIVEN** una tarjeta con el tema oscuro dentro de una página de tema base
- **WHEN** se renderiza
- **THEN** lleva la clase del tema oscuro y su contenido usa los roles de ese tema

### Requirement: Aviso
El aviso MUST comunicar su tipo —error, éxito o información— con texto o icono además del color, y MUST anunciarse a las tecnologías de apoyo: los errores de inmediato y el resto sin interrumpir.

#### Scenario: Aviso de error (I)
- **GIVEN** un aviso de error
- **WHEN** se renderiza
- **THEN** tiene `role="alert"`

#### Scenario: Aviso de éxito (I)
- **GIVEN** un aviso de éxito
- **WHEN** se renderiza
- **THEN** tiene `role="status"` y un icono decorativo oculto a las tecnologías de apoyo

### Requirement: Accesibilidad y movimiento de los componentes base
Los componentes base no MUST presentar infracciones de axe en ninguno de sus estados, MUST renderizarse en el servidor sin JavaScript propio, y con movimiento reducido activado no MUST desplazarse ni escalarse.

#### Scenario: Sin infracciones en ningún estado (I)
- **GIVEN** cada componente en reposo, deshabilitado, con error y con éxito
- **WHEN** se analiza con axe
- **THEN** no hay infracciones

#### Scenario: Movimiento reducido (E)
- **GIVEN** la preferencia de movimiento reducido activada
- **WHEN** se pulsa un botón o se pasa el puntero por él
- **THEN** no hay desplazamiento ni escalado; solo cambia el color

#### Scenario: Sin JavaScript añadido (E)
- **GIVEN** la home provisional con logo y botón
- **WHEN** se mide el JS inicial de `/es`
- **THEN** sigue dentro del presupuesto de 200 kB comprimido

#### Scenario: Textos en ambos idiomas (I)
- **GIVEN** un componente con sus textos en español y en inglés
- **WHEN** se renderiza en cada idioma
- **THEN** todos los textos visibles son los recibidos; el componente no contiene texto propio
