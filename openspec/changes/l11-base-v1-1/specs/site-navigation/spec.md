# Navegación y marco del sitio

## Purpose

Define el marco común de todas las páginas —enlace de salto, cabecera, menú móvil y pie— y garantiza que se puede recorrer con teclado, sin JavaScript y en ambos idiomas.

## MODIFIED Requirements

### Requirement: La acción de agenda funciona sin JavaScript
La acción «Agenda 30 minutos» MUST ser, en el HTML inicial, un enlace directo al calendario que abre en otra pestaña y lo anuncia, y no MUST presentar la llamada como un diagnóstico. Con JavaScript, lo que hace al pulsarla lo rige la capacidad `scheduling`.

#### Scenario: Enlace directo (I)
- **GIVEN** la acción de agenda
- **WHEN** se renderiza
- **THEN** es un enlace a la URL pública del calendario, con `rel="noopener noreferrer"` y aviso de nueva pestaña

### Requirement: Enlace para saltar al contenido
El primer elemento enfocable de la home y de cada página legal MUST ser un enlace que lleva al contenido principal, visible al recibir el foco. La página no encontrada tiene su propio marco, definido en `not-found-page`.

#### Scenario: Primer tabulador (E · L2-4)
- **GIVEN** la página cargada
- **WHEN** se pulsa Tab una vez
- **THEN** el foco está en «Saltar al contenido» y el enlace es visible

#### Scenario: Activarlo lleva al contenido (E)
- **GIVEN** el foco en «Saltar al contenido»
- **WHEN** se pulsa Enter
- **THEN** el foco pasa al contenido principal

### Requirement: Cabecera con marca, navegación, idioma y agenda
En la home y en las páginas legales, la cabecera MUST mostrar el logo como enlace a la home del idioma activo, las anclas a «Dónde empezamos» y «Cómo lo hacemos realidad», el selector de idioma y la acción «Agenda 30 minutos», y MUST permanecer visible al desplazarse.

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

### Requirement: Marco accesible en todas las páginas
La home y cada página legal MUST tener una sola cabecera, un solo contenido principal y un solo pie como regiones, sin infracciones de axe, en ambos idiomas y en los dos anchos de referencia.

#### Scenario: Regiones únicas (E)
- **GIVEN** `/es`, `/en/privacy` y `/es/terminos`
- **WHEN** se inspeccionan sus regiones
- **THEN** hay exactamente un `banner`, un `main` y un `contentinfo`

#### Scenario: Sin infracciones (E)
- **GIVEN** `/es` y `/en` en 375 px y 1280 px, con el menú cerrado y abierto
- **WHEN** se analizan con axe
- **THEN** no hay infracciones
