# Spec Delta

## Purpose

Define cómo aparece la marca Confia.ing en la interfaz y qué archivos de logo e iconos se publican, para que el concepto elegido se use igual en la página, en la pestaña del navegador y fuera del sitio.

## ADDED Requirements

### Requirement: Logo con el concepto elegido
El logo de la interfaz MUST mostrar el símbolo de cinco tramos con el último en color de acento y un punto en la abertura, y el nombre «conf», «IA» y «.ing», con «IA» en mayúscula y el punto en color de acento, e «ing» en cursiva.

#### Scenario: Símbolo y nombre (I · L1-4, L1-8)
- **GIVEN** el componente `Logo`
- **WHEN** se renderiza
- **THEN** muestra el símbolo de cinco tramos con el punto
- **AND** el nombre con «IA» resaltada

#### Scenario: Solo el símbolo (I)
- **GIVEN** el componente `Logo` en su variante de símbolo
- **WHEN** se renderiza
- **THEN** muestra el símbolo sin el nombre

### Requirement: Nombre accesible del logo
El logo MUST exponer a las tecnologías de apoyo un único nombre accesible, el que recibe, y MUST ocultarles sus partes decorativas.

#### Scenario: Un solo nombre accesible (I · L1-4, L1-8)
- **GIVEN** el componente `Logo` con el nombre «Confia.ing»
- **WHEN** se consulta el árbol de accesibilidad
- **THEN** hay una sola imagen con ese nombre
- **AND** los trazos y las partes del nombre no se anuncian por separado

#### Scenario: Sin infracciones de accesibilidad (I)
- **GIVEN** el logo dentro de un enlace
- **WHEN** se analiza con axe
- **THEN** no hay infracciones

### Requirement: El logo sigue el tema
Los colores del logo MUST salir de los roles semánticos, de modo que se adapte a fondo claro y oscuro sin variantes de código.

#### Scenario: Sin colores propios (I)
- **GIVEN** el componente `Logo` renderizado
- **WHEN** se inspeccionan sus trazos y su texto
- **THEN** sus colores se refieren a roles semánticos o a `currentColor`

### Requirement: Archivos de marca publicados
El sitio MUST publicar en `public/brand/` el logo principal, el compacto y el símbolo, cada uno para fondo claro y para fondo oscuro, y el favicon reducido de arco continuo con punto en SVG y en PNG de 32 px.

#### Scenario: Archivos presentes (U · L1-4)
- **GIVEN** los archivos de `public/brand/`
- **WHEN** se listan
- **THEN** incluyen principal, compacto y símbolo en versión clara y oscura
- **AND** el favicon reducido en SVG y en 32 px

#### Scenario: Archivos autónomos (U)
- **GIVEN** cada SVG de `public/brand/`
- **WHEN** se analiza su contenido
- **THEN** no contiene elementos de texto ni referencias a fuentes o recursos externos
- **AND** todos sus colores pertenecen a la paleta

#### Scenario: Los archivos se regeneran sin diferencias (U)
- **GIVEN** los SVG guardados en el repositorio
- **WHEN** se vuelve a ejecutar su generación
- **THEN** el resultado es idéntico al guardado

### Requirement: Icono del sitio
Cada página MUST declarar el favicon reducido como icono del sitio, y `/favicon.ico` MUST responder con un icono válido.

#### Scenario: Icono declarado y disponible (E)
- **GIVEN** la home en `/es` y en `/en`
- **WHEN** se leen los iconos declarados y se piden
- **THEN** hay un icono SVG y uno para dispositivos Apple que responden 200
- **AND** `/favicon.ico` responde 200

#### Scenario: Legible a 16 px (M · L1-4)
- **GIVEN** el favicon reducido mostrado a 16 px sobre fondo claro y oscuro
- **WHEN** se revisa
- **THEN** el arco y el punto se distinguen; la captura queda en la guía de marca

### Requirement: Guía de marca
`docs/brand/` MUST documentar la paleta con HEX, RGB y roles, las tipografías con su licencia, las versiones del logo con sus usos y ejemplos de la marca en móvil y en escritorio.

#### Scenario: Guía completa (M · L1-6)
- **GIVEN** `docs/brand/`
- **WHEN** se revisa
- **THEN** documenta paleta con HEX y roles, tipografías con licencia, versiones del logo y ejemplos en móvil y escritorio

#### Scenario: La guía coincide con los tokens (U)
- **GIVEN** la tabla de paleta de la guía
- **WHEN** se compara con los primitivos del archivo de tokens
- **THEN** nombres y valores HEX son los mismos
