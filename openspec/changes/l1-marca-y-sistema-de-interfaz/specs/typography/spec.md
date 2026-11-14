# Spec Delta

## Purpose

Define las familias tipográficas de la interfaz, de dónde se sirven sus archivos y cómo se evita que el diseño salte mientras cargan, tanto en español como en inglés.

## ADDED Requirements

### Requirement: Fuentes servidas desde el propio dominio
Las páginas MUST cargar sus fuentes desde el mismo origen que la página y no MUST hacer ninguna petición a servicios de fuentes de terceros.

#### Scenario: Ninguna petición a terceros (E · L1-3)
- **GIVEN** la home cargada en `/es` y en `/en`
- **WHEN** se inspeccionan las peticiones de red
- **THEN** todas las fuentes se sirven desde el propio origen
- **AND** ninguna petición va a `fonts.googleapis.com` ni a `fonts.gstatic.com`

### Requirement: Tres familias con respaldo declarado
La interfaz MUST usar Fraunces para títulos, Figtree para texto y DM Mono para etiquetas, cada una con una pila de respaldo, expuestas como `--font-display`, `--font-body` y `--font-mono`.

#### Scenario: Cada papel tiene su familia (E)
- **GIVEN** la home cargada
- **WHEN** se lee la familia calculada del título, del párrafo y de una etiqueta
- **THEN** son Fraunces, Figtree y DM Mono respectivamente, seguidas de su respaldo

#### Scenario: Las variables tipográficas existen en los tokens (U)
- **GIVEN** el archivo de tokens
- **WHEN** se leen `--font-display`, `--font-body` y `--font-mono`
- **THEN** cada una nombra su familia y al menos una fuente de respaldo del sistema

### Requirement: Cobertura de español e inglés
Las fuentes MUST contener los caracteres acentuados y los signos de apertura del español, de modo que ningún carácter de los textos caiga en la fuente de respaldo.

#### Scenario: Acentos y signos con la fuente declarada (E · L1-3)
- **GIVEN** el texto «Capacitación · Diagnóstico · ¿Dónde?»
- **WHEN** se renderiza con la familia de títulos y con la de texto
- **THEN** el navegador informa de que la fuente declarada está cargada y cubre todos sus caracteres

### Requirement: Sin salto de diseño al cargar las fuentes
La carga de las fuentes no MUST producir un desplazamiento de diseño perceptible: el texto se muestra de inmediato con un respaldo de métricas ajustadas.

#### Scenario: Desplazamiento acumulado dentro del presupuesto (E · L1-3)
- **GIVEN** la home cargada en móvil simulado con la red limitada
- **WHEN** terminan de cargar las fuentes
- **THEN** el desplazamiento acumulado de diseño (CLS) es menor que 0,1

#### Scenario: Solo se precargan las fuentes del primer pantallazo (E)
- **GIVEN** el HTML de `/es`
- **WHEN** se cuentan las fuentes precargadas
- **THEN** son como máximo dos: la de títulos y la de texto

### Requirement: Licencias documentadas
Cada familia MUST tener licencia abierta, y su texto de licencia MUST estar en el repositorio junto a los archivos de fuente.

#### Scenario: Licencia junto a cada familia (U)
- **GIVEN** la carpeta de fuentes
- **WHEN** se listan sus archivos
- **THEN** hay un archivo de licencia SIL OFL por cada una de las tres familias

#### Scenario: La guía de marca nombra las licencias (M · L1-6)
- **GIVEN** `docs/brand/README.md`
- **WHEN** se revisa la sección de tipografía
- **THEN** indica familia, uso, pesos y licencia de cada una
