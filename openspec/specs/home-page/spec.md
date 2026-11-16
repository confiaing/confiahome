# home-page Specification

## Purpose
Define qué secciones tiene la home, en qué orden, con qué jerarquía y acciones, y cómo se alternan visualmente, para que un visitante entienda qué hace Confia.ing, para quién y cómo empezar.

## Requirements

### Requirement: Secciones de la home y su orden
La home MUST presentar, en este orden, hero, «Dónde empezamos», «Cómo lo hacemos realidad», «Lo que ofrecemos», «Por qué confiar» y cierre, cada una como región con su título, con un único título principal en la página y sin saltos de nivel de encabezado.

#### Scenario: Orden y títulos (I)
- **GIVEN** la home en español y en inglés
- **WHEN** se listan sus secciones
- **THEN** aparecen las seis en el orden indicado, cada una nombrada por su título
- **AND** hay un solo `h1` y ningún salto de nivel de encabezado

#### Scenario: Las anclas de la cabecera llegan a su sección (E)
- **GIVEN** la home
- **WHEN** se pulsa «Dónde empezamos» y luego «Cómo lo hacemos realidad» en la cabecera
- **THEN** cada una lleva a su sección, cuyo título queda visible bajo la cabecera fija

#### Scenario: Sin infracciones de accesibilidad (E)
- **GIVEN** la home en `/es` y `/en`, a 375 px y 1280 px
- **WHEN** se analiza con axe
- **THEN** no hay infracciones

### Requirement: Hero con dos acciones distinguibles
El hero MUST mostrar antetítulo, título, texto, una acción principal para agendar y una secundaria para consultar, con estilos distintos, una nota que describe la conversación y los tres pilares.

#### Scenario: Título y acciones (I · L3-1)
- **GIVEN** el hero
- **WHEN** se renderiza
- **THEN** hay un único `h1`
- **AND** dos CTA con estilos distintos (primario y secundario)

#### Scenario: Conversación exploratoria (I · L3-1)
- **GIVEN** el texto bajo los CTA
- **WHEN** se lee
- **THEN** describe la conversación como exploratoria, sin costo ni compromiso
- **AND** no contiene la palabra «diagnóstico»

#### Scenario: Sin JavaScript (E · L3-1)
- **GIVEN** JavaScript desactivado
- **WHEN** carga la página
- **THEN** el título, el texto y los dos CTA son visibles
- **AND** el CTA de agenda enlaza directamente a Calendly
- **AND** el de consulta lleva a un bloque que muestra `hola@confia.ing`

#### Scenario: Tres pilares (I)
- **GIVEN** el hero
- **WHEN** se renderiza
- **THEN** lista estrategia, capacitación y automatización, en ese orden

### Requirement: Dónde empezamos
La sección MUST presentar cuatro fricciones de trabajo reconocibles y cuatro preguntas que Confia.ing responde con el cliente, sin nombrar sectores ni tecnologías concretas como punto de partida.

#### Scenario: Fricciones y preguntas (I · L3-2)
- **GIVEN** la sección
- **WHEN** se renderiza
- **THEN** muestra cuatro fricciones y cuatro preguntas
- **AND** ninguna menciona un sector o industria

#### Scenario: Listas numeradas (I)
- **GIVEN** la sección
- **WHEN** se inspecciona su estructura
- **THEN** fricciones y preguntas son listas ordenadas de cuatro elementos

### Requirement: Las cinco etapas, legibles sin interacción
«Cómo lo hacemos realidad» MUST mostrar las cinco etapas en orden, cada una con su nombre, qué se hace, qué recibe el cliente y el paso siguiente, todo presente en el HTML servido.

#### Scenario: Cinco etapas completas (I)
- **GIVEN** la sección
- **WHEN** se renderiza
- **THEN** hay cinco etapas en una lista ordenada: conversación inicial, diagnóstico, roadmap, piloto, y escala y transferencia
- **AND** cada una tiene los tres apartados con sus etiquetas

#### Scenario: La primera etapa no es un diagnóstico (I)
- **GIVEN** la etapa de la conversación inicial
- **WHEN** se lee
- **THEN** indica que dura 30 minutos y que no es un diagnóstico ni un compromiso

#### Scenario: Presente en el HTML servido (E)
- **GIVEN** la home
- **WHEN** se lee el HTML de la respuesta, sin ejecutar scripts
- **THEN** contiene los nombres de las cinco etapas

### Requirement: Servicios con jerarquía
«Lo que ofrecemos» MUST dar a «Transformación de IA» una tarjeta propia, mayor y visualmente dominante, seguida de los otros cuatro servicios en el orden del PRD: capacitación en IA, AI-SDLC, software a la medida, y soluciones generativas y agentivas.

#### Scenario: Servicio principal y subordinados (I · L3-3)
- **GIVEN** la sección
- **WHEN** se renderiza
- **THEN** «Transformación de IA» ocupa una tarjeta propia de mayor tamaño
- **AND** los otros cuatro servicios aparecen después, en el orden del PRD §5

#### Scenario: Dominio visual medido (E)
- **GIVEN** la sección a 1280 px
- **WHEN** se miden las tarjetas
- **THEN** la del servicio principal tiene más área que cualquiera de las otras y su título es de mayor tamaño

### Requirement: Credibilidad atribuida al equipo
«Por qué confiar» MUST mostrar las cuatro evidencias de experiencia del PRD §7, una nota que las atribuye a quienes integran el equipo, los tres principios (mantenible, seguro, medible) y el mensaje de seguridad.

#### Scenario: Evidencias y atribución (I · L3-4)
- **GIVEN** la sección
- **WHEN** se lee
- **THEN** contiene las cuatro evidencias del PRD §7
- **AND** la nota «Experiencia previa de quienes integran el equipo»
- **AND** ningún nombre de empresa, logo, cifra de impacto ni testimonio

#### Scenario: Principios (I)
- **GIVEN** la sección
- **WHEN** se renderiza
- **THEN** lista los tres principios en orden

### Requirement: Cierre con las dos vías de contacto
El cierre MUST repetir las dos acciones del hero con los mismos destinos y ofrecer dos bloques: uno de consulta, que muestra `hola@confia.ing`, y uno de agenda, con el enlace directo al calendario.

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

### Requirement: Ritmo de secciones
Las secciones MUST alternar fondo crema y banda de color: salvia en «Dónde empezamos», coral claro en «Lo que ofrecemos» e índigo claro en el cierre. Una banda no MUST tocar los bordes de la ventana y MUST tener esquinas redondeadas. Las preguntas van en una tarjeta mantequilla y el servicio principal en una tarjeta índigo.

#### Scenario: Alternancia (E · L3-8)
- **GIVEN** la home
- **WHEN** se recorren sus secciones en orden
- **THEN** alternan fondo crema y banda de color: salvia, crema, coral claro, crema, índigo claro

#### Scenario: Forma de la banda (E · L3-8)
- **GIVEN** una banda de color a 375 px y a 1280 px
- **WHEN** se mide
- **THEN** no toca los bordes de la ventana
- **AND** tiene esquinas redondeadas

#### Scenario: Tarjetas de tema propio (E)
- **GIVEN** la home
- **WHEN** se leen los fondos de la tarjeta de preguntas y de la del servicio principal
- **THEN** son mantequilla e índigo 900

### Requirement: La home se lee en móvil y sin esperar
La home MUST poder leerse a 375 px sin desplazamiento horizontal, con acciones de al menos 44 px de alto, y MUST mostrar su contenido principal sin depender de animaciones ni de JavaScript.

#### Scenario: Sin desbordamiento horizontal (E)
- **GIVEN** la home a 375 px en español y en inglés
- **WHEN** se mide el ancho del documento
- **THEN** no supera el de la ventana

#### Scenario: Presupuestos (E)
- **GIVEN** `/es` en móvil simulado con red limitada
- **WHEN** se miden LCP, CLS y JS inicial
- **THEN** LCP < 2,5 s, CLS < 0,1 y JS ≤ 200 kB comprimido

#### Scenario: Movimiento reducido (E)
- **GIVEN** la preferencia de movimiento reducido
- **WHEN** se carga y se recorre la home
- **THEN** ningún elemento se desplaza ni escala
