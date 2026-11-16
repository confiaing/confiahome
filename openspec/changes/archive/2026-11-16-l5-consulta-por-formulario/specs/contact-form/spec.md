# Formulario de consulta

## Purpose

Define el formulario con el que un visitante envía una consulta desde la home: sus campos, sus dos modos de presentación, cómo comunica errores, confirmación y fallos, y qué ofrece cuando no puede funcionar.

## ADDED Requirements

### Requirement: Campos y consentimiento
El formulario MUST pedir nombre, empresa, correo, teléfono y mensaje, indicar que hace falta correo o teléfono, y llevar una casilla de consentimiento no preseleccionada cuyo texto enlaza a la política de privacidad del idioma activo.

#### Scenario: Casilla de consentimiento (I · L5-2)
- **GIVEN** el formulario recién cargado
- **WHEN** se inspecciona la casilla
- **THEN** no está marcada
- **AND** su texto enlaza a la política de privacidad

#### Scenario: Campos etiquetados (I)
- **GIVEN** el formulario en cada modo, en español y en inglés
- **WHEN** se buscan los campos por su etiqueta
- **THEN** existen los cinco, con tipo y autocompletado apropiados, y la indicación «correo o teléfono, al menos uno» asociada a ambos

### Requirement: Dos modos sobre los mismos datos
El formulario MUST ofrecer un modo terminal, que es el inicial, y un modo clásico, con un control que indica el activo. Cambiar de modo MUST conservar lo escrito, y ambos MUST aplicar las mismas reglas y mostrar los mismos errores.

#### Scenario: Modo inicial (I · L5-10)
- **GIVEN** el formulario
- **WHEN** carga
- **THEN** está en modo terminal
- **AND** ofrece cambiar a modo clásico

#### Scenario: Cambiar conserva lo escrito (I · L5-10)
- **GIVEN** texto escrito en modo terminal
- **WHEN** se cambia a modo clásico
- **THEN** los mismos valores aparecen en sus campos

#### Scenario: Mismos errores (I · L5-10)
- **GIVEN** un envío sin contacto
- **WHEN** se hace en cada modo
- **THEN** ambos muestran el mismo error

#### Scenario: El control indica el modo activo (I)
- **GIVEN** el control de modo
- **WHEN** se cambia de modo con teclado
- **THEN** la opción activa lo expone y la nota explicativa cambia

### Requirement: Detalles de cada modo
El modo terminal MUST teclear su comando al entrar en pantalla, o mostrarlo completo con movimiento reducido. El modo clásico MUST mostrar un panel decorativo con la consulta en formato JSON que se actualiza al escribir y nunca interpreta lo escrito como marcado.

#### Scenario: Sin tecleo con movimiento reducido (E · L5-10)
- **GIVEN** `prefers-reduced-motion: reduce`
- **WHEN** el modo terminal entra en pantalla
- **THEN** el comando aparece completo, sin tecleo animado

#### Scenario: El panel JSON no interpreta marcado (I · L5-10)
- **GIVEN** el modo clásico
- **WHEN** el visitante escribe `<b>x</b>` en el mensaje
- **THEN** el panel JSON lo muestra como texto, sin interpretarlo como marcado

#### Scenario: Elementos decorativos ocultos (I)
- **GIVEN** el comando del terminal y el panel JSON
- **WHEN** se consulta el árbol de accesibilidad
- **THEN** ninguno de los dos se anuncia

### Requirement: Errores accesibles
Al enviar con errores, cada error MUST mostrarse junto a su campo y asociado a él, el foco MUST ir al primer campo con error, lo escrito MUST conservarse y el error de un campo MUST desaparecer cuando el visitante lo corrige.

#### Scenario: Dos campos inválidos (I · L5-3)
- **GIVEN** un envío con dos campos inválidos
- **WHEN** se muestran los errores
- **THEN** cada uno aparece junto a su campo
- **AND** el foco va al primero
- **AND** lo ya escrito se conserva

#### Scenario: Corregir quita el error (I · L5-3)
- **GIVEN** un error visible
- **WHEN** el visitante corrige el campo
- **THEN** el error desaparece

#### Scenario: Errores del servidor (I)
- **GIVEN** una respuesta 422 con errores por campo
- **WHEN** llega
- **THEN** se muestran igual que los detectados en el navegador

#### Scenario: Sin envío si hay errores locales (I)
- **GIVEN** un formulario con errores
- **WHEN** se pulsa enviar
- **THEN** no se hace ninguna petición al servidor

### Requirement: Envío y confirmación
Mientras se envía, el formulario MUST impedir un segundo envío e indicarlo. Al aceptarse, MUST mostrar una confirmación anunciada a las tecnologías de apoyo que no promete un plazo.

#### Scenario: Confirmación (I · L5-4)
- **GIVEN** un envío aceptado
- **WHEN** responde el servidor
- **THEN** se muestra «Recibimos tu consulta. Te contactaremos pronto.» en una región `role="status"`
- **AND** el texto no promete un plazo

#### Scenario: Sin doble envío (I)
- **GIVEN** un envío en curso
- **WHEN** se pulsa enviar de nuevo
- **THEN** no se hace una segunda petición y el botón indica que está enviando

#### Scenario: Recorrido completo (E · L5-1)
- **GIVEN** la home en español y en inglés, en cada modo
- **WHEN** el visitante rellena nombre, correo y consentimiento y envía
- **THEN** ve la confirmación en su idioma

### Requirement: Degradación
Si el servidor no puede recibir la consulta, la verificación antispam no carga o la red falla, el formulario MUST mostrar un error claro que ofrece `hola@confia.ing` y MUST conservar lo escrito. Sin JavaScript, MUST verse el correo de contacto en lugar del formulario.

#### Scenario: Servidor no disponible (I · L5-9)
- **GIVEN** que el repositorio no está disponible
- **WHEN** se envía
- **THEN** el formulario muestra un error que ofrece escribir a `hola@confia.ing`
- **AND** conserva lo escrito

#### Scenario: Demasiados envíos o antispam (I)
- **GIVEN** una respuesta 429 o 403
- **WHEN** llega
- **THEN** se muestra un mensaje propio de cada caso, con el correo como alternativa

#### Scenario: Sin JavaScript (E)
- **GIVEN** JavaScript desactivado
- **WHEN** carga la home
- **THEN** el bloque de consulta muestra `hola@confia.ing` y no un formulario que no se puede enviar

### Requirement: Formulario accesible y dentro de presupuesto
El formulario MUST poder completarse solo con teclado en ambos modos, sin infracciones de axe, con controles táctiles de al menos 44 px, y MUST mantener el JS inicial dentro del presupuesto.

#### Scenario: Solo teclado (E)
- **GIVEN** el formulario en cada modo
- **WHEN** se completa y envía usando solo el teclado
- **THEN** se llega a la confirmación

#### Scenario: Sin infracciones (E)
- **GIVEN** el formulario en cada modo, vacío, con errores y enviado, a 375 px y 1280 px
- **WHEN** se analiza con axe
- **THEN** no hay infracciones

#### Scenario: Presupuestos (E)
- **GIVEN** `/es` con el formulario
- **WHEN** se miden JS inicial, LCP y CLS
- **THEN** JS ≤ 200 kB comprimido, LCP < 2,5 s y CLS < 0,1
