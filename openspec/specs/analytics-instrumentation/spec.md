# analytics-instrumentation Specification

## Purpose
Define qué acciones del visitante se miden en la home, con qué datos de contexto y bajo qué condiciones, y cómo se cuentan las visitas, sin cookies ni identificadores.

## Requirements

### Requirement: Visitas con Cloudflare Web Analytics
Las páginas MUST incluir el script de Cloudflare Web Analytics solo cuando hay un token configurado, y no MUST crear cookies.

#### Scenario: Sin token (I · L7-1)
- **GIVEN** el token de Web Analytics vacío
- **WHEN** se renderiza una página
- **THEN** no se incluye el script ni se pide nada a Cloudflare Insights

#### Scenario: Con token (I, E · L7-1)
- **GIVEN** el token presente
- **WHEN** se renderiza una página
- **THEN** se incluye el script con ese token, cargado sin bloquear el contenido
- **AND** tras cargar y usar la página no existe ninguna cookie

### Requirement: Contexto de cada evento
Cada evento MUST llevar el idioma de la página, el tipo de dispositivo, la ruta, el sitio de procedencia si es externo y los parámetros `utm_*` de la visita. No MUST llevar nada escrito por el visitante.

#### Scenario: Visita de campaña desde móvil (I · L7-4)
- **GIVEN** una visita a `/en?utm_source=linkedin` en una pantalla de móvil
- **WHEN** se pulsa la acción de consulta
- **THEN** se envía `cta_contact_click` con idioma `en`, dispositivo `mobile`, ruta `/en` y `utm_source=linkedin`

#### Scenario: Procedencia propia (I)
- **GIVEN** una visita que llega desde otra página del mismo sitio
- **WHEN** se envía un evento
- **THEN** no lleva sitio de procedencia

#### Scenario: Tipo de dispositivo (U)
- **GIVEN** anchos de pantalla de móvil, tableta y escritorio
- **WHEN** se clasifica cada uno
- **THEN** resulta `mobile`, `tablet` y `desktop`, con los mismos cortes que usa el diseño

### Requirement: Qué se mide y cuándo
La página MUST enviar: `page_view` una vez por carga; `cta_schedule_click` y `cta_contact_click` al activar cada acción; `calendar_opened` y `meeting_scheduled` cuando el bloque de agenda lo comunica; `form_started` la primera vez que se escribe en el formulario; `form_submitted` cuando el servidor acepta la consulta; y `language_switched` al cambiar de idioma.

#### Scenario: Vista de página (I, E)
- **GIVEN** la home recién cargada
- **WHEN** termina de cargar
- **THEN** se envía un único `page_view`

#### Scenario: Acciones de contacto (I · L7-4)
- **GIVEN** las acciones de agendar y de consultar del hero, la cabecera y el cierre
- **WHEN** se activa cada una
- **THEN** se envía `cta_schedule_click` o `cta_contact_click`, uno por activación

#### Scenario: Agenda (I)
- **GIVEN** el bloque de agenda
- **WHEN** abre el calendario y, después, Calendly comunica una reserva
- **THEN** se envían `calendar_opened` y `meeting_scheduled`, una vez cada uno

#### Scenario: Formulario iniciado una sola vez (I · L7-4)
- **GIVEN** el formulario en modo terminal
- **WHEN** se escribe en un campo, y luego en otros
- **THEN** se envía `form_started` una sola vez, con modo `terminal`

#### Scenario: Formulario enviado sin contenido (I · L7-4)
- **GIVEN** un envío que el servidor acepta
- **WHEN** termina
- **THEN** se envía `form_submitted` con el modo usado
- **AND** el evento no contiene ningún valor de los campos

#### Scenario: Envío rechazado (I)
- **GIVEN** un envío con errores, o que el servidor rechaza
- **WHEN** termina
- **THEN** no se envía `form_submitted`

#### Scenario: Cambio de idioma (I, E)
- **GIVEN** el selector de idioma
- **WHEN** se elige el otro idioma
- **THEN** se envía `language_switched` antes de salir de la página

### Requirement: Respeto de la preferencia de no rastreo
Si el navegador declara Global Privacy Control o Do Not Track, la página no MUST enviar eventos propios.

#### Scenario: Preferencia activa (I, E)
- **GIVEN** un navegador con Global Privacy Control o Do Not Track activado
- **WHEN** se carga la página y se usan sus acciones
- **THEN** no se envía ninguna petición a `/api/events`

### Requirement: La medición no afecta a la página
El envío de eventos no MUST bloquear la navegación ni la interacción, y un fallo no MUST mostrarse al visitante ni impedir ninguna acción. La medición no MUST guardar nada en el navegador.

#### Scenario: El servidor de eventos falla (I, E)
- **GIVEN** que `/api/events` responde con error o no responde
- **WHEN** el visitante usa las acciones, el formulario y la agenda
- **THEN** todo funciona igual y no aparece ningún error

#### Scenario: Nada en el navegador (E)
- **GIVEN** una visita completa con varios eventos
- **WHEN** se inspeccionan cookies y almacenamiento
- **THEN** no hay ninguna cookie y el almacenamiento solo contiene las preferencias funcionales ya existentes

#### Scenario: Sin JavaScript (E)
- **GIVEN** los scripts desactivados
- **WHEN** se usa la página
- **THEN** todo el contenido y las acciones funcionan; simplemente no se mide

#### Scenario: Dentro de presupuesto (E)
- **GIVEN** la home con la medición activa
- **WHEN** se miden JS inicial, LCP y CLS
- **THEN** siguen dentro de presupuesto
