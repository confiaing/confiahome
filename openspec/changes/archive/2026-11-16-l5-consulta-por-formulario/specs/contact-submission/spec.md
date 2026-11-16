# Recepción de consultas

## Purpose

Define cómo el servidor recibe una consulta: qué acepta, qué rechaza y con qué respuesta, qué guarda, cómo se protege del spam y cómo avisa al equipo, sin perder nunca una consulta válida ni guardar más datos de los necesarios.

## ADDED Requirements

### Requirement: Datos de una consulta válida
Una consulta MUST llevar nombre, consentimiento y al menos un medio de contacto válido (correo o teléfono). Empresa y mensaje son opcionales. Las reglas MUST ser las mismas en el navegador y en el servidor.

#### Scenario: Con correo (U · L5-1)
- **GIVEN** nombre, correo válido, mensaje y consentimiento
- **WHEN** se envía
- **THEN** la consulta es aceptada

#### Scenario: Solo con teléfono (U · L5-1)
- **GIVEN** nombre, teléfono válido y consentimiento, sin correo
- **WHEN** se envía
- **THEN** es aceptada

#### Scenario: Sin medio de contacto (U · L5-1)
- **GIVEN** nombre y consentimiento, sin correo ni teléfono
- **WHEN** se envía
- **THEN** es rechazada con el error «correo o teléfono, al menos uno»

#### Scenario: Correo mal formado (U · L5-1)
- **GIVEN** un correo sin dominio
- **WHEN** se valida
- **THEN** es rechazado con un mensaje que explica el formato esperado

#### Scenario: Teléfono demasiado corto (U)
- **GIVEN** un teléfono con menos de siete dígitos
- **WHEN** se valida
- **THEN** es rechazado con un mensaje que lo explica

#### Scenario: Espacios y longitudes (U)
- **GIVEN** un nombre hecho solo de espacios, o un campo que supera su longitud máxima
- **WHEN** se valida
- **THEN** es rechazado con el error de ese campo
- **AND** los valores aceptados se guardan sin espacios sobrantes

### Requirement: Consentimiento registrado
Sin consentimiento explícito no MUST guardarse nada. Cada consulta guardada MUST registrar la fecha del consentimiento y la versión del aviso aceptado.

#### Scenario: Sin consentimiento (I · L5-2)
- **GIVEN** todos los campos válidos y la casilla sin marcar
- **WHEN** se envía
- **THEN** es rechazada
- **AND** no se guarda nada

#### Scenario: Fecha y versión (I · L5-2)
- **GIVEN** una consulta aceptada
- **WHEN** se guarda
- **THEN** registra fecha del consentimiento
- **AND** versión del aviso aceptado

### Requirement: Punto de recepción
`POST /api/contact` MUST aceptar solo JSON enviado desde el propio sitio, validar con el esquema común y responder 201 al aceptar. Un rechazo por datos MUST responder 422 con errores por campo en el idioma indicado. Ninguna respuesta MUST poder guardarse en caché.

#### Scenario: Consulta aceptada (I · L5-5)
- **GIVEN** un cuerpo válido con token de Turnstile válido
- **WHEN** se envía
- **THEN** responde 201
- **AND** el repositorio recibió exactamente una consulta

#### Scenario: Datos que el cliente no habría permitido (I · L5-5)
- **GIVEN** un cuerpo que el cliente no habría permitido (sin contacto)
- **WHEN** se envía directamente
- **THEN** responde 422 con errores por campo en el idioma indicado
- **AND** no se guarda nada

#### Scenario: Origen o tipo de contenido ajenos (I · L5-5)
- **GIVEN** una petición con `Origin` distinto del sitio o `Content-Type` que no es JSON
- **WHEN** llega
- **THEN** responde 4xx
- **AND** no se guarda nada

#### Scenario: Cuerpo ilegible o excesivo (I)
- **GIVEN** un cuerpo que no es JSON válido, o mayor que el límite
- **WHEN** llega
- **THEN** responde 400 o 413 y no se guarda nada

#### Scenario: Otros métodos (I)
- **GIVEN** una petición `GET` a `/api/contact`
- **WHEN** llega
- **THEN** responde 405

#### Scenario: Errores en inglés (I)
- **GIVEN** un cuerpo inválido con idioma `en`
- **WHEN** se envía
- **THEN** los mensajes de error llegan en inglés

### Requirement: Almacén protegido
Las consultas MUST guardarse en una tabla con seguridad por filas activada y sin políticas públicas, de modo que solo el servidor pueda leerla o escribirla. La base MUST rechazar por sí misma una fila sin correo ni teléfono.

#### Scenario: Cerrada a la clave pública (C · L5-6)
- **GIVEN** la migración aplicada en Supabase local
- **WHEN** se consulta la tabla con la publishable key
- **THEN** no devuelve filas
- **AND** rechaza inserciones

#### Scenario: Regla de contacto en la base (C · L5-6)
- **GIVEN** una inserción con la secret key sin correo ni teléfono
- **WHEN** se ejecuta
- **THEN** la base la rechaza por restricción

#### Scenario: Ida y vuelta por el adaptador (C)
- **GIVEN** una consulta válida
- **WHEN** el adaptador de Supabase la guarda
- **THEN** la fila existe con sus campos, estado «new», fecha y versión del consentimiento

### Requirement: Antispam en capas
Antes de guardar, el servidor MUST verificar el token de Turnstile, descartar en silencio los envíos con el campo trampa relleno y limitar la frecuencia por origen. La dirección IP no MUST guardarse ni registrarse.

#### Scenario: Token inválido (I · L5-7)
- **GIVEN** un token de Turnstile inválido
- **WHEN** se envía
- **THEN** responde 403
- **AND** no se guarda ni se notifica

#### Scenario: Campo trampa (I · L5-7)
- **GIVEN** el campo trampa relleno
- **WHEN** se envía
- **THEN** responde 201
- **AND** no se guarda ni se notifica

#### Scenario: Demasiados envíos (I · L5-7)
- **GIVEN** más envíos que el límite desde un mismo origen
- **WHEN** llega el siguiente
- **THEN** responde 429

#### Scenario: Sin IP (I · L5-7)
- **GIVEN** cualquier envío
- **WHEN** se guarda
- **THEN** la fila no contiene la dirección IP

#### Scenario: El verificador real habla con Turnstile (C)
- **GIVEN** las claves de prueba oficiales de Turnstile
- **WHEN** el adaptador verifica un token
- **THEN** acepta con la clave «siempre pasa» y rechaza con la clave «siempre falla»

### Requirement: Aviso al equipo
Cada consulta guardada MUST avisarse por correo en texto plano a la dirección configurada, con `Reply-To` del visitante cuando dejó correo. Un fallo del aviso no MUST perder la consulta ni cambiar la respuesta.

#### Scenario: Aviso enviado (I · L5-8)
- **GIVEN** una consulta guardada con correo
- **WHEN** se notifica
- **THEN** el aviso va a la dirección configurada, en texto plano, con `Reply-To` del visitante

#### Scenario: El aviso falla (I · L5-8)
- **GIVEN** que el envío del aviso falla
- **WHEN** termina la petición
- **THEN** la respuesta sigue siendo 201
- **AND** la consulta permanece guardada
- **AND** el fallo queda registrado sin datos personales

#### Scenario: Sin correo del visitante (I)
- **GIVEN** una consulta solo con teléfono
- **WHEN** se notifica
- **THEN** el aviso no lleva `Reply-To` y muestra el teléfono

#### Scenario: Contenido que no rompe el correo (U)
- **GIVEN** un nombre o un mensaje con saltos de línea y texto con forma de cabecera
- **WHEN** se compone el aviso
- **THEN** ninguna línea del visitante queda como cabecera del correo

### Requirement: El servidor falla de forma clara
Si el almacén no está disponible, el servidor MUST responder 503 sin dar la consulta por recibida. Ningún registro de errores MUST contener datos personales del visitante.

#### Scenario: Almacén caído (I · L5-9)
- **GIVEN** que el repositorio no está disponible
- **WHEN** se envía
- **THEN** responde 503
- **AND** no se notifica

#### Scenario: Registros sin datos personales (I)
- **GIVEN** un fallo del almacén o del aviso
- **WHEN** se registra
- **THEN** el registro no contiene nombre, correo, teléfono, mensaje ni IP
