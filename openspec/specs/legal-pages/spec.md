# legal-pages Specification

## Purpose
Define las páginas de privacidad y términos de cada idioma y sus direcciones, para que el pie y el formulario puedan enlazarlas desde el primer día aunque su texto definitivo llegue más tarde.

## Requirements

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

### Requirement: Política de privacidad en ambos idiomas
`/es/privacidad` y `/en/privacy` MUST mostrar una política que cubra: responsable del tratamiento, datos que se tratan, finalidades, base del tratamiento, conservación, encargados y proveedores, transferencias, derechos del titular y cómo ejercerlos, canal de atención, y cookies y tecnologías similares.

#### Scenario: Secciones presentes (I · L8-1)
- **GIVEN** la política de privacidad en español y en inglés
- **WHEN** se renderiza
- **THEN** contiene un encabezado por cada uno de esos temas, en el mismo orden en ambos idiomas
- **AND** el canal de atención muestra el correo de contacto como enlace

#### Scenario: Mismas secciones en los dos idiomas (U)
- **GIVEN** los textos legales en español y en inglés
- **WHEN** se comparan sus estructuras
- **THEN** tienen las mismas secciones y el mismo número de párrafos y de elementos de lista en cada una

### Requirement: Términos en ambos idiomas
`/es/terminos` y `/en/terms` MUST mostrar unos términos que cubran: objeto del sitio, naturaleza informativa del contenido, alcance de la conversación inicial, propiedad intelectual, servicios de terceros, limitación de responsabilidad, ley aplicable y contacto.

#### Scenario: Secciones presentes (I · L8-2)
- **GIVEN** los términos en español y en inglés
- **WHEN** se renderizan
- **THEN** contienen un encabezado por cada uno de esos temas

### Requirement: Borrador señalado y no indexado
Mientras los textos no tengan revisión legal, cada página legal MUST mostrar al principio un aviso visible de borrador, MUST pedir a los buscadores que no la indexen y no MUST aparecer en el mapa del sitio. El cambio a «vigente» MUST hacerse en un único punto.

#### Scenario: Aviso de borrador (I · L8-1, L8-2)
- **GIVEN** cualquiera de las cuatro páginas legales
- **WHEN** se renderiza
- **THEN** muestra, antes del texto, el aviso de borrador pendiente de revisión legal

#### Scenario: No se indexan (I)
- **GIVEN** el estado «borrador»
- **WHEN** se leen los metadatos de una página legal
- **THEN** piden no indexar y sí seguir enlaces

#### Scenario: Un solo interruptor (U)
- **GIVEN** el estado legal cambiado a «vigente»
- **WHEN** se generan el aviso, los metadatos y el mapa del sitio
- **THEN** desaparece el aviso, las páginas se pueden indexar y entran en el mapa del sitio

### Requirement: Datos pendientes a la vista, nunca inventados
Los datos que solo el responsable puede aportar —razón social, identificación, domicilio— MUST aparecer marcados como pendientes mientras no existan, y los textos no MUST contener nombres de personas, identificaciones, direcciones ni fechas de vigencia inventados.

#### Scenario: Pendientes señalados (I)
- **GIVEN** la política de privacidad sin datos del responsable configurados
- **WHEN** se renderiza
- **THEN** cada dato ausente se muestra con una marca de «pendiente» que se distingue del texto

#### Scenario: Sin afirmaciones no aprobadas (U)
- **GIVEN** los textos legales en ambos idiomas
- **WHEN** pasan las comprobaciones de contenido
- **THEN** no afirman certificaciones, cumplimiento garantizado, clientes ni plazos de respuesta

### Requirement: La política describe lo que el sitio hace
La política MUST coincidir con el comportamiento real del sitio: los datos del formulario y su conservación, los eventos anónimos y lo que no guardan, la ausencia de cookies propias de seguimiento, las preferencias que sí se guardan en el navegador, el respeto de la señal de no rastreo y los terceros que intervienen.

#### Scenario: Datos y plazos coherentes con el sistema (U)
- **GIVEN** la política y las constantes del sistema
- **WHEN** se comparan
- **THEN** los campos del formulario nombrados son los del esquema de la consulta
- **AND** los plazos de conservación son los definidos para consultas y para eventos

#### Scenario: Proveedores nombrados (I)
- **GIVEN** la política
- **WHEN** se lee la sección de proveedores
- **THEN** nombra a Cloudflare, Supabase y Calendly, con para qué interviene cada uno, y dice que Calendly solo se carga cuando el visitante lo pide

#### Scenario: Almacenamiento en el navegador (I)
- **GIVEN** la política
- **WHEN** se lee la sección de cookies
- **THEN** enumera la cookie de idioma y la preferencia de versión de la página, y afirma que no hay cookies de seguimiento propias

#### Scenario: La versión del consentimiento corresponde al texto (U)
- **GIVEN** la versión que se guarda con cada consulta
- **WHEN** se compara con la versión declarada en la política
- **THEN** son la misma

### Requirement: Páginas legales accesibles y legibles
Las páginas legales MUST ser HTML servido completo, con una jerarquía de encabezados correcta, legibles sin JavaScript, sin infracciones de accesibilidad y sin desplazamiento horizontal en móvil.

#### Scenario: Estructura y accesibilidad (I, E)
- **GIVEN** las cuatro páginas legales a 375 y 1280 px
- **WHEN** se analizan
- **THEN** tienen un único título principal, secciones con encabezados de segundo nivel y ninguna infracción de axe

#### Scenario: Sin JavaScript (E)
- **GIVEN** los scripts desactivados
- **WHEN** se abre una página legal
- **THEN** el texto completo está en la página
