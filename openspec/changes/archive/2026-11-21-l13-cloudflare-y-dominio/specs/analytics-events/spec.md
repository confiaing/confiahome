# Eventos de analítica

## Purpose

Define qué eventos anónimos acepta el servidor, qué datos admite en cada uno, cómo los sanea y dónde los guarda, de modo que la analítica no pueda contener datos personales aunque el navegador los envíe.

## MODIFIED Requirements

### Requirement: Punto de recepción protegido
`POST /api/events` MUST aceptar solo peticiones del propio sitio, con cuerpo JSON de tamaño limitado, MUST aplicar un límite de frecuencia por origen y no MUST poder guardarse en caché. Las peticiones de robots conocidos MUST aceptarse sin guardarse. Además del límite del Worker, una regla de Cloudflare MUST cortar en el borde las ráfagas de una misma IP antes de que lleguen al Worker.

#### Scenario: Origen ajeno, tipo o tamaño incorrectos (I)
- **GIVEN** una petición desde otro origen, o que no es JSON, o que supera el tamaño máximo
- **WHEN** llega a `/api/events`
- **THEN** responde 403, 415 o 413 respectivamente
- **AND** no se guarda nada

#### Scenario: Límite de frecuencia (I)
- **GIVEN** más eventos que el límite desde un mismo origen en un minuto
- **WHEN** llega el siguiente
- **THEN** responde 429 y no se guarda

#### Scenario: Ráfaga cortada en el borde (M · L13-3)
- **GIVEN** la regla de frecuencia de Cloudflare para `POST /api/events`
- **WHEN** una misma IP envía en 10 segundos más peticiones que el umbral, con un evento fuera de la lista para no guardar nada
- **THEN** las siguientes reciben 429 de Cloudflare, no del Worker
- **AND** pasado el bloqueo, una petición vuelve a llegar al Worker
- **AND** el sitio y el resto de rutas siguen respondiendo durante el bloqueo

#### Scenario: Robot conocido (I)
- **GIVEN** una petición cuyo agente de usuario es el de un robot conocido
- **WHEN** envía un evento válido
- **THEN** responde 204
- **AND** no se guarda

#### Scenario: Sin caché (I)
- **GIVEN** cualquier respuesta de `/api/events`
- **WHEN** se leen sus cabeceras
- **THEN** lleva `Cache-Control: no-store`
