# Páginas legales

## Purpose

Define las páginas de privacidad y términos de cada idioma y sus direcciones, su contenido, cómo se señala que son borradores pendientes de revisión legal y cómo se mantiene su coherencia con lo que el sitio hace realmente con los datos.

## REMOVED Requirements

### Requirement: Aviso de borrador
**Reason**: Duplicaba «Borrador señalado y no indexado» (L8), que exige lo mismo y además el mapa del sitio y un único interruptor.
**Migration**: La dirección de contacto que solo pedía esta exigencia pasa a «Borrador señalado y no indexado».

## MODIFIED Requirements

### Requirement: Borrador señalado y no indexado
Mientras los textos no tengan revisión legal, cada página legal MUST mostrar al principio un aviso visible de borrador que ofrezca `hola@confia.ing` para consultas, MUST pedir a los buscadores que no la indexen y no MUST aparecer en el mapa del sitio. El cambio a «vigente» MUST hacerse en un único punto.

#### Scenario: Aviso de borrador (I · L8-1, L8-2)
- **GIVEN** cualquiera de las cuatro páginas legales
- **WHEN** se renderiza
- **THEN** muestra, antes del texto, el aviso de borrador pendiente de revisión legal
- **AND** el aviso ofrece `hola@confia.ing` en su idioma

#### Scenario: No se indexan (I)
- **GIVEN** el estado «borrador»
- **WHEN** se leen los metadatos de una página legal
- **THEN** piden no indexar y sí seguir enlaces

#### Scenario: No indexable en la página servida (E)
- **GIVEN** `/es/privacidad`
- **WHEN** se lee su cabecera HTML
- **THEN** declara `noindex`

#### Scenario: Un solo interruptor (U)
- **GIVEN** el estado legal cambiado a «vigente»
- **WHEN** se generan el aviso, los metadatos y el mapa del sitio
- **THEN** desaparece el aviso, las páginas se pueden indexar y entran en el mapa del sitio
