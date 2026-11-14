# Página 404

## Purpose

Define qué ve quien llega a una dirección que no existe, para que pueda volver a la home en su idioma en lugar de quedarse en una página de error genérica.

## ADDED Requirements

### Requirement: Página 404 bilingüe
Cualquier dirección inexistente MUST responder 404 con una página que muestra el mensaje en español y en inglés, cada uno marcado con su idioma y con un enlace a la home de ese idioma, y un enlace de marca a `/`.

#### Scenario: Ruta inexistente bajo un idioma (E · L2-6)
- **GIVEN** una ruta inexistente bajo `/en/`
- **WHEN** se solicita
- **THEN** responde 404 con texto en inglés
- **AND** un enlace a `/en`

#### Scenario: Ambos idiomas, marcados (E)
- **GIVEN** `/en/no-existe` y `/fr`
- **WHEN** se abren
- **THEN** hay un solo título principal y dos mensajes, uno con `lang="es"` y enlace a `/es` y otro con `lang="en"` y enlace a `/en`
- **AND** no hay infracciones de axe

#### Scenario: Cualquier forma de ruta inexistente (E)
- **GIVEN** `/es/a/b/c`, `/es/privacy`, `/fr` y `/cualquier-cosa`
- **WHEN** se solicitan
- **THEN** responden 404 con la misma página

### Requirement: La página 404 no depende de JavaScript
El mensaje y los enlaces de la página 404 MUST estar en el HTML servido.

#### Scenario: HTML completo (E)
- **GIVEN** una ruta inexistente
- **WHEN** se lee el HTML de la respuesta, sin ejecutar scripts
- **THEN** contiene los dos mensajes y los enlaces a `/es` y `/en`

#### Scenario: Con los scripts desactivados (E)
- **GIVEN** el navegador con JavaScript desactivado
- **WHEN** se abre una ruta inexistente
- **THEN** el mensaje y el enlace para volver son visibles

### Requirement: La página 404 no se indexa
Las páginas 404 no MUST poder indexarse.

#### Scenario: noindex (E)
- **GIVEN** una ruta inexistente
- **WHEN** se lee su cabecera HTML
- **THEN** declara `noindex` una sola vez
