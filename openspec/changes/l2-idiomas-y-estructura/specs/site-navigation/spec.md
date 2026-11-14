# Spec Delta

## Purpose

Define el marco común de todas las páginas —enlace de salto, cabecera, menú móvil y pie— y garantiza que se puede recorrer con teclado, sin JavaScript y en ambos idiomas.

## ADDED Requirements

### Requirement: Enlace para saltar al contenido
El primer elemento enfocable de cada página MUST ser un enlace que lleva al contenido principal, visible al recibir el foco.

#### Scenario: Primer tabulador (E · L2-4)
- **GIVEN** la página cargada
- **WHEN** se pulsa Tab una vez
- **THEN** el foco está en «Saltar al contenido» y el enlace es visible

#### Scenario: Activarlo lleva al contenido (E)
- **GIVEN** el foco en «Saltar al contenido»
- **WHEN** se pulsa Enter
- **THEN** el foco pasa al contenido principal

### Requirement: Cabecera con marca, navegación, idioma y agenda
La cabecera MUST mostrar el logo como enlace a la home del idioma activo, las anclas a «Dónde empezamos» y «Cómo lo hacemos realidad», el selector de idioma y la acción «Agenda 30 minutos», y MUST permanecer visible al desplazarse.

#### Scenario: Contenido de la cabecera (I)
- **GIVEN** la cabecera en español y en inglés
- **WHEN** se renderiza
- **THEN** el logo enlaza a `/es` o `/en`
- **AND** hay una navegación con nombre accesible, con las dos anclas y la acción de agenda en el idioma activo

#### Scenario: La acción de agenda es alcanzable en cualquier ancho (E · L2-4)
- **GIVEN** un ancho de 375 px y otro de 1280 px
- **WHEN** se mira la cabecera
- **THEN** la acción de agenda está visible o dentro del menú desplegable

#### Scenario: Las anclas funcionan desde una página legal (I)
- **GIVEN** la cabecera en `/es/privacidad`
- **WHEN** se renderiza
- **THEN** las anclas apuntan a la home (`/es#donde-empezamos`), no a la página actual

### Requirement: La acción de agenda funciona sin JavaScript
La acción «Agenda 30 minutos» MUST ser un enlace directo al calendario que abre en otra pestaña y lo anuncia, y no MUST presentar la llamada como un diagnóstico.

#### Scenario: Enlace directo (I)
- **GIVEN** la acción de agenda
- **WHEN** se renderiza
- **THEN** es un enlace a la URL pública del calendario, con `rel="noopener noreferrer"` y aviso de nueva pestaña

### Requirement: Menú desplegable en pantallas estrechas
En pantallas estrechas la navegación MUST plegarse tras un botón que expone su estado, se abre y cierra con teclado, se cierra con Escape devolviendo el foco al botón, y se cierra al elegir un enlace.

#### Scenario: Abrir y cerrar con Escape (E · L2-4)
- **GIVEN** un ancho de 375 px
- **WHEN** se abre el menú y se pulsa Escape
- **THEN** el menú se cierra
- **AND** el foco vuelve al botón de menú

#### Scenario: Estado expuesto (I)
- **GIVEN** el botón de menú
- **WHEN** se abre y se cierra
- **THEN** `aria-expanded` pasa a `true` y vuelve a `false`, y `aria-controls` señala la navegación

#### Scenario: Cerrado, sus enlaces no reciben foco (E)
- **GIVEN** el menú cerrado en 375 px
- **WHEN** se recorre la página con Tab
- **THEN** ningún enlace del menú recibe el foco

#### Scenario: Elegir un enlace lo cierra (I)
- **GIVEN** el menú abierto
- **WHEN** se elige un ancla
- **THEN** el menú se cierra

#### Scenario: Sin JavaScript (E)
- **GIVEN** JavaScript desactivado y un ancho de 375 px
- **WHEN** se carga la página
- **THEN** las anclas, el selector de idioma y la acción de agenda están visibles
- **AND** la cabecera no se queda fija al desplazarse

#### Scenario: El foco sale del menú (I)
- **GIVEN** el menú abierto
- **WHEN** el foco pasa a un elemento del resto de la página
- **THEN** el menú se cierra

#### Scenario: La ventana se ensancha (E)
- **GIVEN** el menú abierto en 375 px
- **WHEN** la ventana pasa a 1280 px y vuelve a 375 px
- **THEN** el menú está cerrado

#### Scenario: Movimiento reducido (E)
- **GIVEN** la preferencia de movimiento reducido
- **WHEN** se abre el menú
- **THEN** aparece sin desplazarse

### Requirement: Pie con contacto, legales e idioma
El pie MUST mostrar el logo, la dirección `hola@confia.ing` como texto y como enlace de correo, los enlaces a privacidad y términos del idioma activo, el selector de idioma y el aviso de derechos con la marca «Confia.ing».

#### Scenario: Pie en inglés (I · L2-5)
- **GIVEN** el pie en `/en`
- **WHEN** se renderiza
- **THEN** muestra `hola@confia.ing` como texto
- **AND** los enlaces legales apuntan a `/en/privacy` y `/en/terms`

#### Scenario: Pie en español (I)
- **GIVEN** el pie en `/es`
- **WHEN** se renderiza
- **THEN** los enlaces legales apuntan a `/es/privacidad` y `/es/terminos`

### Requirement: Marco accesible en todas las páginas
Cada página MUST tener una sola cabecera, un solo contenido principal y un solo pie como regiones, sin infracciones de axe, en ambos idiomas y en los dos anchos de referencia.

#### Scenario: Regiones únicas (E)
- **GIVEN** `/es`, `/en/privacy` y `/es/terminos`
- **WHEN** se inspeccionan sus regiones
- **THEN** hay exactamente un `banner`, un `main` y un `contentinfo`

#### Scenario: Sin infracciones (E)
- **GIVEN** `/es` y `/en` en 375 px y 1280 px, con el menú cerrado y abierto
- **WHEN** se analizan con axe
- **THEN** no hay infracciones

### Requirement: El marco no rompe los presupuestos
El marco MUST mantener el JS inicial de `/es` dentro de 200 kB comprimido y no MUST producir desplazamiento de diseño perceptible.

#### Scenario: Presupuestos (E)
- **GIVEN** `/es` con cabecera y pie
- **WHEN** se miden el JS inicial y el CLS en móvil simulado
- **THEN** el JS es ≤ 200 kB comprimido y el CLS es menor que 0,1
