# Páginas legales

## Purpose

Define las páginas de privacidad y términos de cada idioma y sus direcciones, para que el pie y el formulario puedan enlazarlas desde el primer día aunque su texto definitivo llegue más tarde.

## ADDED Requirements

### Requirement: Páginas legales por idioma
El sitio MUST servir la política de privacidad en `/es/privacidad` y `/en/privacy`, y los términos en `/es/terminos` y `/en/terms`, cada una con un único título principal en su idioma, dentro del marco común.

#### Scenario: Las cuatro rutas responden (E · L2-7)
- **GIVEN** `/es/privacidad`, `/en/privacy`, `/es/terminos` y `/en/terms`
- **WHEN** se solicitan
- **THEN** responden 200 con título en su idioma y aviso de borrador

#### Scenario: Título de la pestaña (E)
- **GIVEN** `/en/privacy`
- **WHEN** se lee el título del documento
- **THEN** nombra la página en inglés y la marca

### Requirement: Slug e idioma no se cruzan
Una dirección que combine un idioma con el slug del otro MUST responder 404.

#### Scenario: Cruce de idioma y slug (E · L2-7)
- **GIVEN** `/es/privacy` y `/en/terminos`
- **WHEN** se solicitan
- **THEN** responden 404

### Requirement: Aviso de borrador
Mientras el texto legal no esté revisado, cada página legal MUST mostrar un aviso visible de que es un borrador pendiente de revisión, MUST ofrecer `hola@confia.ing` para consultas y no MUST poder indexarse.

#### Scenario: Aviso visible (I)
- **GIVEN** una página legal en español y en inglés
- **WHEN** se renderiza
- **THEN** muestra el aviso de borrador y la dirección de contacto en su idioma

#### Scenario: No indexable (E)
- **GIVEN** `/es/privacidad`
- **WHEN** se lee su cabecera HTML
- **THEN** declara `noindex`
