# security-headers Specification

## Purpose
Define las cabeceras de seguridad que acompañan a cada respuesta del sitio y la política de contenido que limita qué puede cargar y ejecutar una página, de modo que un fallo de inyección no pueda ejecutar código ni sacar datos.

## Requirements

### Requirement: Cabeceras en todas las respuestas
Toda respuesta del sitio MUST incluir `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy` y `Permissions-Policy`. Toda respuesta HTML MUST incluir además una política de contenido con `frame-ancestors 'none'`.

#### Scenario: Respuesta HTML (I, E · L9-5)
- **GIVEN** cualquier página del sitio, incluida la 404
- **WHEN** se leen las cabeceras de su respuesta
- **THEN** incluye CSP, HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy` y `Permissions-Policy`
- **AND** la CSP contiene `frame-ancestors 'none'`

#### Scenario: Respuestas que no son HTML (I, E)
- **GIVEN** una respuesta de la API, un archivo estático o `robots.txt`
- **WHEN** se leen sus cabeceras
- **THEN** incluye HSTS y `X-Content-Type-Options: nosniff`

#### Scenario: Cabeceras que el servidor no debe anunciar (I)
- **GIVEN** cualquier respuesta
- **WHEN** se leen sus cabeceras
- **THEN** no revela la tecnología del servidor con `X-Powered-By`

### Requirement: Política de contenido sin scripts en línea libres
La política de contenido no MUST permitir `'unsafe-inline'` ni `'unsafe-eval'` en `script-src`. Los scripts del HTML MUST autorizarse con un código aleatorio de un solo uso por respuesta, que el Worker pone en cada script y en la política.

#### Scenario: Sin comodines (U, I · L9-5)
- **GIVEN** la política de cualquier página
- **WHEN** se analiza `script-src`
- **THEN** no contiene `'unsafe-inline'`, `'unsafe-eval'`, `*` ni esquemas completos como `https:`

#### Scenario: Cada script del HTML lleva la autorización de esa respuesta (I, E)
- **GIVEN** el HTML de cualquier página servido por el Worker
- **WHEN** se compara con la política de esa misma respuesta
- **THEN** todos sus scripts llevan el código de un solo uso que la política autoriza

#### Scenario: El código cambia en cada respuesta y no se adivina (U, E)
- **GIVEN** dos respuestas de la misma página
- **WHEN** se comparan sus códigos
- **THEN** son distintos
- **AND** cada uno tiene al menos 128 bits de aleatoriedad

#### Scenario: Un script insertado sin el código no se ejecuta (E)
- **GIVEN** una página cargada con la política
- **WHEN** un script en línea sin el código se inserta en el documento
- **THEN** el navegador no lo ejecuta

### Requirement: Solo los terceros declarados
La política MUST limitar scripts, marcos y conexiones al propio sitio y a los terceros que la página usa: Calendly, Turnstile y Cloudflare Insights. MUST fijar `default-src 'self'`, `base-uri 'self'`, `form-action 'self'` y `object-src 'none'`.

#### Scenario: Orígenes admitidos (U · L9-5)
- **GIVEN** la política
- **WHEN** se listan los orígenes externos de todas sus directivas
- **THEN** son solo los de Calendly, Turnstile y Cloudflare Insights, cada uno en la directiva que le corresponde

#### Scenario: Un tercero no declarado se bloquea (E)
- **GIVEN** una página cargada con la política
- **WHEN** un script intenta cargar código o un marco de un origen no declarado
- **THEN** el navegador lo bloquea

### Requirement: La página funciona entera con la política
Con la política aplicada, todas las funciones del sitio MUST seguir funcionando y el navegador no MUST registrar ninguna infracción durante su uso normal.

#### Scenario: Uso completo sin infracciones (E · L9-5)
- **GIVEN** el sitio servido en el runtime de Workers con sus cabeceras
- **WHEN** se carga la home en ambas versiones de la escena, se recorren las etapas, se envía el formulario, se abre la agenda y se visitan las páginas legales
- **THEN** todo funciona
- **AND** la consola no registra ninguna infracción de la política

#### Scenario: Calendly y Turnstile caben (E)
- **GIVEN** la agenda y la verificación antispam, simuladas en sus direcciones reales
- **WHEN** se cargan
- **THEN** sus scripts y marcos no se bloquean

### Requirement: Compatibilidad con el cambio de idioma
`Referrer-Policy` MUST permitir que una navegación dentro del sitio lleve la ruta de origen, y no MUST enviar la ruta ni los parámetros a otros sitios.

#### Scenario: Cambio de idioma con la política de referente (E · L9-5)
- **GIVEN** una página legal en español
- **WHEN** se cambia de idioma
- **THEN** se llega a la página legal equivalente en inglés

#### Scenario: Hacia fuera, solo el origen (U)
- **GIVEN** la cabecera `Referrer-Policy`
- **WHEN** se lee
- **THEN** es `strict-origin-when-cross-origin`

### Requirement: HTTPS persistente
`Strict-Transport-Security` MUST fijar al menos un año. No MUST incluir subdominios ni precarga mientras el fundador no lo confirme.

#### Scenario: Valor de HSTS (U)
- **GIVEN** la cabecera
- **WHEN** se lee
- **THEN** su `max-age` es de al menos 31536000
- **AND** no lleva `includeSubDomains` ni `preload`
