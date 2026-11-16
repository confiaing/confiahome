# search-and-agent-discovery Specification

## Purpose
Define cómo se presenta el sitio a buscadores, redes sociales y asistentes de IA: metadatos por idioma, imagen para compartir, mapa del sitio, reglas de rastreo, datos estructurados y resumen en texto plano, sin afirmar nada que la página no diga.

## Requirements

### Requirement: Metadatos por idioma
Cada página MUST tener título y descripción en su idioma, dirección canónica propia y alternativas `hreflang` para español, inglés y `x-default`.

#### Scenario: Home en español y en inglés (I · L8-3)
- **GIVEN** `/es` y `/en`
- **WHEN** se leen sus metadatos
- **THEN** cada una tiene título y descripción en su idioma, distintos entre sí
- **AND** canónica propia y `hreflang` para `es`, `en` y `x-default`

#### Scenario: Descripciones útiles y honestas (U)
- **GIVEN** las descripciones en ambos idiomas
- **WHEN** se validan
- **THEN** tienen entre 70 y 160 caracteres
- **AND** pasan las comprobaciones de contenido: sin cifras, clientes, plazos ni garantías

### Requirement: Vista previa al compartir
Cada página MUST declarar las etiquetas Open Graph y de tarjeta necesarias para una vista previa completa, con una imagen de 1200×630 en su idioma que exista en el sitio.

#### Scenario: Etiquetas para redes (I · L8-6)
- **GIVEN** `/es` y `/en`
- **WHEN** se leen sus metadatos
- **THEN** declaran título, descripción, dirección, tipo, nombre del sitio, idioma y su alternativo, y `og:image` con ancho, alto y texto alternativo
- **AND** una tarjeta de imagen grande

#### Scenario: La imagen existe y mide lo que declara (U, E · L8-6)
- **GIVEN** la imagen declarada para cada idioma
- **WHEN** se solicita
- **THEN** responde 200 como PNG de 1200×630 y pesa menos de 300 kB

#### Scenario: La imagen se regenera sin diferencias (U)
- **GIVEN** las imágenes guardadas en el repositorio
- **WHEN** se vuelve a ejecutar su generación
- **THEN** el resultado tiene las mismas dimensiones y los colores de la paleta

### Requirement: Mapa del sitio
`/sitemap.xml` MUST listar las páginas indexables con sus alternativas de idioma, usando la dirección pública del sitio.

#### Scenario: Con las legales en borrador (I · L8-4)
- **GIVEN** el estado legal «borrador»
- **WHEN** se solicita `/sitemap.xml`
- **THEN** lista `/es` y `/en`, cada una con sus alternativas `es`, `en` y `x-default`
- **AND** no lista las páginas legales

#### Scenario: Con las legales vigentes (U · L8-4)
- **GIVEN** el estado legal «vigente»
- **WHEN** se genera el mapa
- **THEN** lista las seis rutas públicas con sus alternativas

### Requirement: Reglas de rastreo
`/robots.txt` MUST permitir el rastreo del sitio, excluir las rutas de la API y referenciar el mapa del sitio. MUST permitir de forma explícita a los rastreadores de IA conocidos.

#### Scenario: Rastreo permitido (I · L8-4)
- **GIVEN** `/robots.txt`
- **WHEN** se solicita
- **THEN** permite todo salvo `/api/`
- **AND** referencia la dirección absoluta del mapa del sitio

#### Scenario: Rastreadores de IA nombrados (I · L8-7)
- **GIVEN** `/robots.txt`
- **WHEN** se lee
- **THEN** contiene una regla que permite por nombre a los rastreadores de OpenAI, Anthropic, Perplexity y Google para IA
- **AND** ninguno queda bloqueado

### Requirement: Datos estructurados
La home MUST incluir JSON-LD válido que describa la organización, el sitio y los servicios, usando solo textos que la página ya muestra. No MUST incluir valoraciones, premios, direcciones, precios ni ningún dato no aprobado.

#### Scenario: Organización y sitio (I · L8-5)
- **GIVEN** la home en cada idioma
- **WHEN** se extrae su JSON-LD
- **THEN** es JSON válido con una organización —nombre, dirección web, logo, correo e idiomas de atención— y un sitio web con su idioma

#### Scenario: Servicios tal como están en la página (I)
- **GIVEN** el JSON-LD de la home
- **WHEN** se leen los servicios
- **THEN** sus nombres y descripciones son los de la sección de servicios, en el idioma de la página

#### Scenario: Nada que no esté aprobado (U)
- **GIVEN** el JSON-LD en ambos idiomas
- **WHEN** se recorren sus propiedades
- **THEN** no hay valoraciones, reseñas, premios, precios, dirección postal, teléfono ni perfiles sociales
- **AND** sus textos pasan las comprobaciones de contenido

#### Scenario: Texto que no rompe el marcado (U)
- **GIVEN** un texto con `</script>` o `<` en un campo
- **WHEN** se serializa el JSON-LD
- **THEN** el marcado de la página no se cierra ni se altera

### Requirement: Resumen en texto plano para agentes
`/llms.txt` MUST ofrecer un resumen del sitio en Markdown —qué es Confia.ing, qué ofrece, las cinco etapas y cómo contactar— generado de los mismos textos de la página, con enlaces a las páginas en ambos idiomas.

#### Scenario: Contenido del resumen (I · L8-7)
- **GIVEN** `/llms.txt`
- **WHEN** se solicita
- **THEN** responde 200 como texto plano, con un título, un resumen, los servicios, las cinco etapas en orden y las dos vías de contacto
- **AND** en español y en inglés

#### Scenario: Sale de los textos de la página (U)
- **GIVEN** el resumen generado
- **WHEN** se compara con los diccionarios
- **THEN** cada nombre de servicio y de etapa es el del diccionario
- **AND** pasa las comprobaciones de contenido

#### Scenario: La llamada no es un diagnóstico (U)
- **GIVEN** el resumen
- **WHEN** se lee cómo describe la conversación de 30 minutos
- **THEN** la presenta como exploratoria, igual que la página

### Requirement: Todo estático y sin coste para el visitante
Metadatos, mapa, reglas, datos estructurados, imagen y resumen MUST generarse al construir, sin añadir JavaScript al navegador ni peticiones a terceros.

#### Scenario: Dentro de presupuesto (E)
- **GIVEN** la home con los metadatos y el JSON-LD
- **WHEN** se miden JS inicial, LCP y CLS
- **THEN** siguen dentro de presupuesto y el JS inicial no crece

#### Scenario: Dirección pública correcta (U)
- **GIVEN** un build de producción sin la variable de dirección del sitio
- **WHEN** se generan canónicas, mapa, reglas y datos estructurados
- **THEN** usan `https://confia.ing` y nunca `localhost`
