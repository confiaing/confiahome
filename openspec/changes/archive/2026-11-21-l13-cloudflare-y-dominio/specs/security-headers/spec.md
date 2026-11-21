# Cabeceras de seguridad

## Purpose

Define las cabeceras de seguridad que acompañan a cada respuesta del sitio y la política de contenido que limita qué puede cargar y ejecutar una página, de modo que un fallo de inyección no pueda ejecutar código ni sacar datos.

## MODIFIED Requirements

### Requirement: HTTPS persistente
`Strict-Transport-Security` MUST fijar al menos un año e incluir los subdominios, confirmado por el fundador en L10. No MUST pedir la precarga en los navegadores mientras el fundador no lo confirme. Ninguna dirección del dominio ni de sus subdominios MUST servir contenido por HTTP: MUST redirigir con 301 a HTTPS.

#### Scenario: Valor de HSTS (U)
- **GIVEN** la cabecera
- **WHEN** se lee
- **THEN** su `max-age` es de al menos 31536000
- **AND** lleva `includeSubDomains`
- **AND** no lleva `preload`

#### Scenario: HTTP no sirve contenido (M · L13-1)
- **GIVEN** la zona de Cloudflare con «Always Use HTTPS» activado
- **WHEN** se pide `http://confia.ing/es` o `http://www.confia.ing/es`
- **THEN** la respuesta es un 301 hacia HTTPS, sin cuerpo de la página
