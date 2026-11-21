# Lanzamiento a producción

## Purpose

Define qué debe cumplirse antes de desplegar el sitio, cómo se protege la base de datos de producción durante el lanzamiento y qué se verifica una vez publicado, de modo que «está en producción» signifique que las dos vías de contacto funcionan de verdad.

## MODIFIED Requirements

### Requirement: Verificación tras el despliegue
Tras desplegar MUST comprobarse en el dominio real que las páginas responden, que llevan las cabeceras de seguridad, que el dominio solo se sirve por HTTPS y sin `www`, que una consulta de prueba se guarda y se avisa, y que la tarea diaria está programada.

#### Scenario: Páginas y cabeceras (M · L10-3)
- **GIVEN** el sitio desplegado
- **WHEN** se piden `/es`, `/en`, una página legal, `robots.txt`, `sitemap.xml` y `llms.txt` por HTTPS
- **THEN** responden 200
- **AND** las páginas HTML llevan política de contenido, HSTS y `nosniff`

#### Scenario: HTTP lleva a HTTPS (U · L13-1)
- **GIVEN** el verificador y un sitio que responde a `http://` con 301 hacia la misma ruta y los mismos parámetros en `https://`
- **WHEN** comprueba la zona
- **THEN** la comprobación pasa
- **AND** falla si la respuesta por HTTP es 200, o si la redirección pierde la ruta o los parámetros

#### Scenario: `www` lleva al dominio (U · L13-2)
- **GIVEN** el verificador
- **WHEN** pide `https://www.<dominio>/es?verificacion=1` y `http://www.<dominio>/es`
- **THEN** exige por HTTPS un 301 hacia `https://<dominio>/es?verificacion=1`, con la misma ruta y los mismos parámetros
- **AND** por HTTP, que llegue a `https://<dominio>/es` en dos redirecciones 301 como máximo
- **AND** cuenta como fallo que `www` no resuelva o no responda, con la cadena de saltos en el detalle

#### Scenario: Solo para el dominio público (U)
- **GIVEN** una dirección local, `www` o un subdominio como `staging.<dominio>`
- **WHEN** el verificador se ejecuta contra ella
- **THEN** no comprueba `www` ni HTTP

#### Scenario: La zona real (M · L13-1, L13-2)
- **GIVEN** la configuración de Cloudflare aplicada
- **WHEN** se ejecuta `verify:site` contra `https://confia.ing`
- **THEN** todas las comprobaciones, también las de la zona, terminan en verde

#### Scenario: Flujo B real (M · L10-3)
- **GIVEN** el sitio en producción
- **WHEN** se envía una consulta de prueba desde el formulario
- **THEN** se ve la confirmación
- **AND** la fila existe en `contact_requests` y el aviso llega al buzón

#### Scenario: Flujo A real (M · L10-3)
- **GIVEN** el sitio en producción
- **WHEN** se abre la agenda
- **THEN** el calendario de Calendly carga dentro de la página sin infracciones de la política de contenido

#### Scenario: Antispam real (M)
- **GIVEN** el sitio en producción
- **WHEN** se envía una consulta sin token de verificación
- **THEN** el servidor la rechaza y no se guarda

#### Scenario: Datos de prueba retirados (M)
- **GIVEN** las consultas y eventos creados al verificar
- **WHEN** termina la verificación
- **THEN** el fundador decide si se borran de la base de producción o se conservan
- **AND** la decisión queda anotada

#### Scenario: Tarea diaria programada (M)
- **GIVEN** el Worker desplegado
- **WHEN** se consulta su configuración
- **THEN** tiene el disparo diario
- **AND** tras su primera ejecución queda constancia del latido en los registros

### Requirement: Vigilancia diaria de producción
El sitio en producción MUST verificarse cada día de forma automática, sin intervención de nadie y sin crear datos, con las mismas comprobaciones que tras un despliegue. Un fallo MUST dejar una ejecución en rojo que GitHub notifica.

#### Scenario: Disparo diario y a demanda (U)
- **GIVEN** el workflow de vigilancia
- **WHEN** se lee
- **THEN** se dispara cada día y a demanda, nunca por un push
- **AND** ejecuta el verificador contra `https://confia.ing`

#### Scenario: Solo lectura (U)
- **GIVEN** el workflow de vigilancia
- **WHEN** se lee
- **THEN** tiene permisos de solo lectura, no usa secretos y no despliega ni escribe en ninguna base

#### Scenario: Primera ejecución real (M)
- **GIVEN** el workflow en `main`
- **WHEN** se lanza a demanda
- **THEN** termina en verde con todas las comprobaciones del verificador
- **AND** el enlace a la ejecución queda anotado

#### Scenario: Un fallo se ve (M)
- **GIVEN** una ejecución programada en rojo
- **WHEN** termina
- **THEN** GitHub envía el aviso de fallo a la cuenta que modificó por última vez el `cron` del workflow, si tiene activadas las notificaciones de Actions
- **AND** `docs/operations.md` dice quién lo recibe y qué comprobar primero

## ADDED Requirements

### Requirement: Configuración de la zona documentada
La guía de operación MUST describir cada ajuste de Cloudflare del que depende el sitio fuera del repositorio, dónde se cambia y qué comprobación lo vigila, para poder rehacerlo o revisarlo sin depender de la memoria de nadie.

#### Scenario: Inventario de la zona (M · L13-5)
- **GIVEN** la guía de operación
- **WHEN** la lee quien atiende el sitio
- **THEN** encuentra «Always Use HTTPS», el registro y la regla de `www`, la regla de frecuencia de `/api/events` y los dominios del widget de Turnstile
- **AND** para cada uno, dónde está en el panel y cómo se comprueba
