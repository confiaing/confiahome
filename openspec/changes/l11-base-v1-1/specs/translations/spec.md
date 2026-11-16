# Traducciones

## Purpose

Define dónde viven los textos de la interfaz y garantiza que español e inglés tienen siempre las mismas claves, de modo que ninguna página pueda publicarse con un texto sin traducir.

## REMOVED Requirements

### Requirement: Todo texto visible sale de los diccionarios
**Reason**: Sus escenarios se refieren a la página provisional de L2, que ya no existe.
**Migration**: La sustituye «Los textos visibles salen de los diccionarios», sobre las páginas reales.

## ADDED Requirements

### Requirement: Los textos visibles salen de los diccionarios
Los componentes no MUST contener texto visible propio, salvo el nombre de marca, la dirección de correo y el código «404» de la página no encontrada. La home, las páginas legales y la 404 MUST tomar sus textos del diccionario de su idioma.

#### Scenario: La home en ambos idiomas (I)
- **GIVEN** las secciones de la home
- **WHEN** se renderizan en español y en inglés
- **THEN** cada texto visible coincide con el del diccionario de ese idioma

#### Scenario: Ningún texto en español en la versión inglesa (E)
- **GIVEN** `/en` y `/en/privacy`
- **WHEN** se lee el texto visible de la página
- **THEN** no aparece ninguna de las frases del diccionario español que difieren de las inglesas
