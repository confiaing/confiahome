# Componentes de interfaz

## Purpose

Define los componentes base de interfaz —botón, enlace, campo, casilla, tarjeta y aviso—, sus estados y su comportamiento con teclado y tecnologías de apoyo, para que las secciones y el formulario se construyan sobre piezas ya accesibles.

## MODIFIED Requirements

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
- **GIVEN** la home, que usa los componentes base
- **WHEN** se mide el JS inicial de `/es`
- **THEN** sigue dentro del presupuesto de 200 kB comprimido

#### Scenario: Textos en ambos idiomas (I)
- **GIVEN** un componente con sus textos en español y en inglés
- **WHEN** se renderiza en cada idioma
- **THEN** todos los textos visibles son los recibidos; el componente no contiene texto propio
