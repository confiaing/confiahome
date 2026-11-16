# Página de inicio

## Purpose

Define qué secciones tiene la home, en qué orden, con qué jerarquía y acciones, y cómo se alternan visualmente, para que un visitante entienda qué hace Confia.ing, para quién y cómo empezar.

## MODIFIED Requirements

### Requirement: Cierre con las dos vías de contacto
El cierre MUST repetir las dos acciones del hero con los mismos destinos y ofrecer dos bloques: uno de consulta, que muestra `hola@confia.ing`, y uno de agenda, con el enlace directo al calendario. Su título MUST partirse por frases: cada frase empieza en una línea nueva en cualquier ancho.

#### Scenario: Mismas acciones que el hero (I · L3-6)
- **GIVEN** el cierre
- **WHEN** se renderiza
- **THEN** repite los dos CTA del hero con los mismos destinos

#### Scenario: Bloques de contacto (I)
- **GIVEN** el cierre
- **WHEN** se renderiza
- **THEN** el bloque de consulta muestra `hola@confia.ing` como texto y enlace de correo
- **AND** el bloque de agenda ofrece el enlace directo al calendario, con aviso de nueva pestaña

#### Scenario: La acción de consulta lleva a su bloque (E)
- **GIVEN** la home
- **WHEN** se pulsa la acción de consulta del hero
- **THEN** el bloque de consulta queda visible bajo la cabecera

#### Scenario: Título partido por frases (I, E)
- **GIVEN** el título del cierre, en español y en inglés
- **WHEN** se muestra en móvil, tableta y ordenador
- **THEN** cada frase es un bloque propio y ninguna se desborda
- **AND** en ordenador cada frase cabe en una línea

### Requirement: Las cinco etapas, legibles sin interacción
«Cómo lo hacemos realidad» MUST mostrar las cinco etapas en orden, cada una con su nombre, qué se hace, qué recibe el cliente y el paso siguiente, todo presente en el HTML servido.

#### Scenario: Cinco etapas completas (I)
- **GIVEN** la sección
- **WHEN** se renderiza
- **THEN** hay cinco etapas en orden, cada una en su panel con su nombre como título: conversación inicial, diagnóstico, roadmap, piloto, y escala y transferencia
- **AND** cada una tiene los tres apartados con sus etiquetas

#### Scenario: La primera etapa no es un diagnóstico (I)
- **GIVEN** la etapa de la conversación inicial
- **WHEN** se lee
- **THEN** indica que dura 30 minutos y que no es un diagnóstico ni un compromiso

#### Scenario: Presente en el HTML servido (E)
- **GIVEN** la home
- **WHEN** se lee el HTML de la respuesta, sin ejecutar scripts
- **THEN** contiene los nombres de las cinco etapas
