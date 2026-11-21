# production-release Specification

## Purpose
Define qué debe cumplirse antes de desplegar el sitio, cómo se protege la base de datos de producción durante el lanzamiento y qué se verifica una vez publicado, de modo que «está en producción» signifique que las dos vías de contacto funcionan de verdad.

## Requirements

### Requirement: Nada sale de la máquina sin la orden del fundador
Cada acción que escriba en producción o publique algo —migrar la base, cargar secretos, desplegar, enviar una consulta de prueba, subir a GitHub— MUST ejecutarse solo tras la orden expresa del fundador para esa acción.

#### Scenario: Acción externa (M)
- **GIVEN** una acción que modifica la base de producción, el Worker, el dominio o el repositorio remoto
- **WHEN** va a ejecutarse
- **THEN** se ha mostrado antes qué hace y contra qué
- **AND** el fundador la ha ordenado en la conversación

### Requirement: Comprobación previa del build
El proyecto MUST ofrecer una comprobación que falle cuando el build no sirve para producción: sin dirección pública, sin clave pública de Turnstile, con claves de prueba, o con un estado legal incoherente.

#### Scenario: Falta lo que producción exige (U · L10-1)
- **GIVEN** un entorno de build sin la clave pública de Turnstile o sin la dirección pública del sitio
- **WHEN** se ejecuta la comprobación previa
- **THEN** falla y nombra lo que falta, sin mostrar ningún valor

#### Scenario: Claves de prueba (U)
- **GIVEN** la clave pública oficial de pruebas de Turnstile en el entorno de build
- **WHEN** se ejecuta la comprobación previa
- **THEN** falla: esa clave acepta a cualquiera

#### Scenario: Dirección local (U)
- **GIVEN** una dirección pública que apunta a `localhost` o que no es HTTPS
- **WHEN** se ejecuta la comprobación previa
- **THEN** falla

#### Scenario: Estado legal coherente (U)
- **GIVEN** el estado legal «vigente» con datos del responsable ausentes
- **WHEN** se ejecuta la comprobación previa
- **THEN** falla
- **AND** con el estado «borrador» pasa, avisando de que se lanza con textos en borrador

#### Scenario: Todo en orden (U)
- **GIVEN** un entorno de build completo
- **WHEN** se ejecuta la comprobación previa
- **THEN** pasa y lista qué comprobó, sin valores

### Requirement: La base de producción queda como la local
Las migraciones del repositorio MUST aplicarse a la base de producción en orden y sin errores, y la base MUST quedar cerrada a la clave pública.

#### Scenario: Migraciones aplicadas (M · L10-2)
- **GIVEN** las migraciones del repositorio
- **WHEN** se aplican a `confiahomeDB`
- **THEN** terminan sin errores
- **AND** existen `contact_requests` y `analytics_events` con sus restricciones

#### Scenario: Cerrada a la clave pública (M · L10-2)
- **GIVEN** la base de producción migrada
- **WHEN** se intenta leer o insertar en ambas tablas con la publishable key
- **THEN** no devuelve filas y rechaza la inserción

### Requirement: Secretos solo en el Worker
Los secretos de producción MUST cargarse como secretos del Worker, escritos por el fundador, y no MUST aparecer en el repositorio, en el build, en los registros ni en la conversación.

#### Scenario: Carga de secretos (M · L10-1)
- **GIVEN** los comandos de carga preparados
- **WHEN** el fundador escribe cada valor en su terminal
- **THEN** el Worker lista los nombres de los secretos esperados
- **AND** ningún valor se ha mostrado ni guardado fuera

#### Scenario: El build no los lleva (U)
- **GIVEN** el Worker construido para desplegar
- **WHEN** se comprueba su contenido
- **THEN** no incrusta ningún secreto

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

### Requirement: Vuelta atrás documentada
El proyecto MUST documentar cómo volver a la versión anterior del Worker y qué hacer si una migración falla.

#### Scenario: Guía de operación (M · L10-5)
- **GIVEN** la guía de operación
- **WHEN** la lee quien deba atender el sitio
- **THEN** explica cómo desplegar, cómo volver atrás, cómo leer y responder consultas, cómo rotar una clave y cómo atender una petición de borrado de datos

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

### Requirement: Configuración de la zona documentada
La guía de operación MUST describir cada ajuste de Cloudflare del que depende el sitio fuera del repositorio, dónde se cambia y qué comprobación lo vigila, para poder rehacerlo o revisarlo sin depender de la memoria de nadie.

#### Scenario: Inventario de la zona (M · L13-5)
- **GIVEN** la guía de operación
- **WHEN** la lee quien atiende el sitio
- **THEN** encuentra «Always Use HTTPS», el registro y la regla de `www`, la regla de frecuencia de `/api/events` y los dominios del widget de Turnstile
- **AND** para cada uno, dónde está en el panel y cómo se comprueba
