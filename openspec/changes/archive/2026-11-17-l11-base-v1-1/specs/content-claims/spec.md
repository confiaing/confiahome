# Afirmaciones del contenido

## Purpose

Fija los límites de lo que el sitio puede afirmar sobre Confia.ing, en español y en inglés, para que ningún texto prometa lo que la empresa no puede demostrar ni presente como propio lo que es experiencia previa del equipo.

## MODIFIED Requirements

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
- **THEN** son solo los 30 minutos de la conversación, el número de cada etapa en su etiqueta y «3D» como nombre de la escena
