# translations Specification

## Purpose
Define dónde viven los textos de la interfaz y garantiza que español e inglés tienen siempre las mismas claves, de modo que ninguna página pueda publicarse con un texto sin traducir.

## Requirements

### Requirement: Paridad de claves entre idiomas
Los diccionarios de español e inglés MUST tener exactamente las mismas claves. Una clave ausente o sobrante en un idioma MUST hacer fallar la comprobación de tipos.

#### Scenario: Clave ausente (U · L2-3)
- **GIVEN** una clave presente en el diccionario español y ausente en el inglés
- **WHEN** se ejecuta la comprobación de tipos
- **THEN** falla nombrando la clave

#### Scenario: Clave sobrante (U)
- **GIVEN** una clave presente solo en el diccionario inglés
- **WHEN** se ejecuta la comprobación de tipos
- **THEN** falla nombrando la clave

#### Scenario: Los diccionarios reales están completos (U)
- **GIVEN** los diccionarios del proyecto
- **WHEN** se comparan sus claves en ejecución
- **THEN** coinciden y ningún texto está vacío

### Requirement: Textos legibles por tecnologías de apoyo en su idioma
Un texto mostrado en un idioma distinto al de la página MUST marcarse con su atributo de idioma.

#### Scenario: Opción del otro idioma (I)
- **GIVEN** el selector en una página en español
- **WHEN** se renderiza la opción EN
- **THEN** lleva `lang="en"`

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
