# analytics-events Specification

## Purpose
Define qué eventos anónimos acepta el servidor, qué datos admite en cada uno, cómo los sanea y dónde los guarda, de modo que la analítica no pueda contener datos personales aunque el navegador los envíe.

## Requirements

### Requirement: Lista cerrada de eventos
El sistema MUST aceptar únicamente estos ocho eventos: `page_view`, `cta_schedule_click`, `cta_contact_click`, `calendar_opened`, `meeting_scheduled`, `form_started`, `form_submitted` y `language_switched`.

#### Scenario: Evento de la lista (U, I · L7-2)
- **GIVEN** un evento `cta_schedule_click` con idioma, dispositivo y ruta válidos
- **WHEN** se envía a `POST /api/events`
- **THEN** responde 204 sin cuerpo
- **AND** el evento queda guardado

#### Scenario: Evento fuera de la lista (U, I · L7-2)
- **GIVEN** un evento con un nombre que no está en la lista
- **WHEN** se envía
- **THEN** responde 400
- **AND** no se guarda nada

### Requirement: Solo los datos previstos
De cada evento MUST guardarse como máximo: nombre, idioma, tipo de dispositivo, ruta, sitio de procedencia, `utm_source`, `utm_medium`, `utm_campaign` y, en los eventos de formulario, el modo. Cualquier otro campo MUST descartarse antes de guardar.

#### Scenario: Campos no previstos (U, I · L7-2)
- **GIVEN** un evento válido que además lleva `email`, `message` y `visitorId`
- **WHEN** se envía
- **THEN** se guarda sin esos campos
- **AND** responde 204

#### Scenario: El modo solo en eventos de formulario (U)
- **GIVEN** un evento `page_view` con `formMode`
- **WHEN** se normaliza
- **THEN** se guarda sin modo
- **AND** un `form_started` sin modo válido se rechaza

### Requirement: Valores acotados
Cada dato MUST pertenecer a un conjunto cerrado o cumplir un formato estricto: idioma `es` o `en`; dispositivo `mobile`, `tablet` o `desktop`; ruta de las conocidas del sitio; sitio de procedencia como nombre de host; `utm_*` solo con letras, números y `. _ ~ -`, hasta 40 caracteres. Un valor opcional que no cumple MUST guardarse como ausente; uno obligatorio que no cumple MUST rechazar el evento.

#### Scenario: Texto libre en un parámetro (U · L7-3)
- **GIVEN** un evento con `utmSource` igual a un correo electrónico o a una frase con espacios
- **WHEN** se normaliza
- **THEN** `utm_source` queda ausente
- **AND** el evento se guarda igualmente

#### Scenario: Ruta desconocida (U)
- **GIVEN** un evento con una ruta que no es de las del sitio, o con parámetros
- **WHEN** se normaliza
- **THEN** la ruta se guarda como «other», sin el texto recibido

#### Scenario: Procedencia (U)
- **GIVEN** un evento con una dirección completa, con ruta y parámetros, como sitio de procedencia
- **WHEN** se normaliza
- **THEN** se guarda solo el nombre de host en minúsculas, o nada si no es un host válido

#### Scenario: Idioma o dispositivo no admitidos (U, I)
- **GIVEN** un evento con idioma `fr` o dispositivo `watch`
- **WHEN** se envía
- **THEN** responde 400 y no se guarda

### Requirement: Punto de recepción protegido
`POST /api/events` MUST aceptar solo peticiones del propio sitio, con cuerpo JSON de tamaño limitado, MUST aplicar un límite de frecuencia por origen y no MUST poder guardarse en caché. Las peticiones de robots conocidos MUST aceptarse sin guardarse.

#### Scenario: Origen ajeno, tipo o tamaño incorrectos (I)
- **GIVEN** una petición desde otro origen, o que no es JSON, o que supera el tamaño máximo
- **WHEN** llega a `/api/events`
- **THEN** responde 403, 415 o 413 respectivamente
- **AND** no se guarda nada

#### Scenario: Límite de frecuencia (I)
- **GIVEN** más eventos que el límite desde un mismo origen en un minuto
- **WHEN** llega el siguiente
- **THEN** responde 429 y no se guarda

#### Scenario: Robot conocido (I)
- **GIVEN** una petición cuyo agente de usuario es el de un robot conocido
- **WHEN** envía un evento válido
- **THEN** responde 204
- **AND** no se guarda

#### Scenario: Sin caché (I)
- **GIVEN** cualquier respuesta de `/api/events`
- **WHEN** se leen sus cabeceras
- **THEN** lleva `Cache-Control: no-store`

### Requirement: Nada que identifique al visitante
El sistema no MUST guardar ni registrar la IP, el agente de usuario, un identificador de visitante o de sesión, ni ningún texto escrito por el visitante.

#### Scenario: La IP y el agente no se guardan (I · L7-3)
- **GIVEN** un evento aceptado, enviado con IP y agente de usuario
- **WHEN** se inspecciona lo guardado y lo registrado
- **THEN** ninguno de los dos aparece

#### Scenario: Esquema de la tabla (C · L7-3)
- **GIVEN** la migración aplicada en la base local
- **WHEN** se listan las columnas de `analytics_events`
- **THEN** son exactamente las previstas: ninguna para IP, agente, identificador de visitante ni texto libre

### Requirement: Tabla protegida
`analytics_events` MUST tener la seguridad por filas activada, sin políticas, y restricciones que repitan en la base las listas cerradas.

#### Scenario: Ilegible con la clave pública (C · L7-3)
- **GIVEN** la tabla con eventos
- **WHEN** se intenta leer o insertar con la publishable key
- **THEN** la base lo rechaza o no devuelve filas

#### Scenario: La base rechaza valores fuera de lista (C)
- **GIVEN** una inserción directa con un nombre de evento, idioma o dispositivo fuera de lista
- **WHEN** se ejecuta con la secret key
- **THEN** la base la rechaza

#### Scenario: El adaptador guarda un evento (C)
- **GIVEN** un evento normalizado
- **WHEN** el adaptador de Supabase lo guarda
- **THEN** la fila existe con sus valores y con fecha

### Requirement: La analítica no rompe nada
Un fallo al guardar un evento MUST registrarse sin datos del visitante y MUST responder de forma que el navegador no reintente ni muestre error.

#### Scenario: Almacén caído (I)
- **GIVEN** que el almacén de eventos falla
- **WHEN** llega un evento válido
- **THEN** responde 204
- **AND** el fallo queda registrado con un código, sin el contenido del evento

### Requirement: Consultas de conversión documentadas
El proyecto MUST documentar consultas SQL que den la conversión por idioma, dispositivo, canal y modo de formulario.

#### Scenario: Las consultas funcionan con datos de ejemplo (M · L7-5)
- **GIVEN** eventos de ejemplo en la base local
- **WHEN** se ejecutan las consultas de `docs/analytics.md`
- **THEN** devuelven vistas, clics, reservas y consultas enviadas por idioma, dispositivo, canal y modo
