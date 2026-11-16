# content-claims Specification

## Purpose
Fija los límites de lo que el sitio puede afirmar sobre Confia.ing, en español y en inglés, para que ningún texto prometa lo que la empresa no puede demostrar ni presente como propio lo que es experiencia previa del equipo.

## Requirements

### Requirement: Sin afirmaciones de certificación ni garantía
Los textos del sitio no MUST afirmar certificaciones, cumplimiento normativo ni garantías. El mensaje de seguridad MUST hablar de riesgos que se consideran.

#### Scenario: Mensaje de seguridad (I · L3-5)
- **GIVEN** el texto de seguridad
- **WHEN** se lee en ES y EN
- **THEN** habla de riesgos considerados
- **AND** no contiene «certificado», «cumple», «garantiza» ni sus equivalentes en inglés

#### Scenario: Ningún texto del sitio lo afirma (U)
- **GIVEN** todos los textos de ambos diccionarios
- **WHEN** se buscan las familias de palabras de certificación, cumplimiento y garantía
- **THEN** no aparece ninguna

### Requirement: La llamada de 30 minutos no es un diagnóstico
Ningún texto MUST presentar la conversación de 30 minutos como un diagnóstico. La palabra solo puede acompañarla para negarlo o para nombrar el paso siguiente.

#### Scenario: Acciones y nota de agenda (U)
- **GIVEN** los textos de las acciones de agenda y su nota, en ambos idiomas
- **WHEN** se leen
- **THEN** ninguno contiene «diagnóstico» ni «assessment»

#### Scenario: Etapa de conversación (U)
- **GIVEN** la descripción de la primera etapa, en ambos idiomas
- **WHEN** se lee
- **THEN** dice expresamente que no es un diagnóstico

### Requirement: Sin clientes, cifras, precios ni testimonios
Los textos no MUST contener nombres de clientes, cifras de impacto, porcentajes, precios, plazos de respuesta ni testimonios. La única cifra de experiencia admitida es la del PRD §7.

#### Scenario: Sin cifras de impacto ni precios (U)
- **GIVEN** todos los textos de ambos diccionarios
- **WHEN** se buscan porcentajes, símbolos de moneda y multiplicadores
- **THEN** no aparece ninguno

#### Scenario: Sin clientes, prueba social ni plazos (U)
- **GIVEN** todos los textos de ambos diccionarios
- **WHEN** se buscan menciones a clientes, testimonios, casos de éxito, sellos o normas, y plazos de respuesta o de resultado
- **THEN** no aparece ninguna

#### Scenario: Cifras admitidas (U)
- **GIVEN** todos los textos de ambos diccionarios
- **WHEN** se listan los números que contienen
- **THEN** son solo los 30 minutos de la conversación y el número de cada etapa en su etiqueta

### Requirement: Experiencia atribuida al equipo
Toda evidencia de experiencia MUST presentarse junto a una nota visible que la atribuye a quienes integran el equipo y a trabajo previo.

#### Scenario: Nota junto a las evidencias (I)
- **GIVEN** la lista de evidencias, en ambos idiomas
- **WHEN** se renderiza
- **THEN** la nota de atribución está en la misma sección, después de la lista

### Requirement: Inglés redactado, no copiado
Cada texto MUST tener versión inglesa distinta de la española, salvo los nombres propios y términos sin traducción, que constan en una lista explícita.

#### Scenario: Paridad sin copias (U · L3-7)
- **GIVEN** los diccionarios
- **WHEN** se comparan
- **THEN** toda clave de `es` tiene valor no vacío en `en`
- **AND** ninguno es idéntico al español salvo nombres propios

#### Scenario: Revisión de la redacción inglesa (M · L3-7)
- **GIVEN** el documento con el texto ES y EN lado a lado
- **WHEN** el fundador lo revisa
- **THEN** la traducción es natural, no literal, y mantiene los mismos límites
