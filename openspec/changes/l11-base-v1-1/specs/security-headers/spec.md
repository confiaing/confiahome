# Cabeceras de seguridad

## Purpose

Define las cabeceras de seguridad que acompañan a cada respuesta del sitio y la política de contenido que limita qué puede cargar y ejecutar una página, de modo que un fallo de inyección no pueda ejecutar código ni sacar datos.

## MODIFIED Requirements

### Requirement: HTTPS persistente
`Strict-Transport-Security` MUST fijar al menos un año e incluir los subdominios, confirmado por el fundador en L10. No MUST pedir la precarga en los navegadores mientras el fundador no lo confirme.

#### Scenario: Valor de HSTS (U)
- **GIVEN** la cabecera
- **WHEN** se lee
- **THEN** su `max-age` es de al menos 31536000
- **AND** lleva `includeSubDomains`
- **AND** no lleva `preload`

### Requirement: Cabeceras en todas las respuestas
Toda respuesta del sitio MUST incluir `Strict-Transport-Security`, `X-Content-Type-Options: nosniff` y `Referrer-Policy`. Las que pasan por el Worker MUST incluir además `Permissions-Policy`. Toda respuesta HTML MUST incluir una política de contenido con `frame-ancestors 'none'`. Una respuesta 304 no MUST llevar política de contenido: el navegador conserva la de la página que ya tiene guardada.

#### Scenario: Respuesta HTML (I, E · L9-5)
- **GIVEN** cualquier página del sitio, incluida la 404
- **WHEN** se leen las cabeceras de su respuesta
- **THEN** incluye CSP, HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy` y `Permissions-Policy`
- **AND** la CSP contiene `frame-ancestors 'none'`

#### Scenario: Respuestas que no son HTML (I, E)
- **GIVEN** una respuesta de la API, un archivo estático o `robots.txt`
- **WHEN** se leen sus cabeceras
- **THEN** incluye HSTS y `X-Content-Type-Options: nosniff`

#### Scenario: Respuesta 304 (U)
- **GIVEN** una petición condicional cuya página no ha cambiado
- **WHEN** el Worker responde 304
- **THEN** la respuesta lleva HSTS, `nosniff`, `Referrer-Policy` y `Permissions-Policy`
- **AND** no lleva política de contenido

#### Scenario: Recargar la página no la rompe (E · runtime de Workers)
- **GIVEN** una página ya visitada y guardada por el navegador
- **WHEN** se recarga
- **THEN** se ve con sus estilos y sus scripts funcionan

#### Scenario: Cabeceras que el servidor no debe anunciar (I)
- **GIVEN** cualquier respuesta
- **WHEN** se leen sus cabeceras
- **THEN** no revela la tecnología del servidor con `X-Powered-By`
