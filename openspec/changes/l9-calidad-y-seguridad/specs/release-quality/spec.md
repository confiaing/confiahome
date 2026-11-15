# Calidad de la versión

## Purpose

Define lo que la primera versión completa debe superar antes de lanzarse: flujos de extremo a extremo, uso sin ratón, accesibilidad, rendimiento, y una auditoría de seguridad y una revisión de código de todo el sitio.

## ADDED Requirements

### Requirement: Los dos flujos funcionan de extremo a extremo
Los flujos de agendar y de consultar MUST completarse en español y en inglés, en escritorio y en móvil.

#### Scenario: Consultar (E · L9-1)
- **GIVEN** un visitante en `/es` en modo terminal y otro en `/en` en modo clásico
- **WHEN** completan y envían el formulario
- **THEN** cada uno ve la confirmación en su idioma

#### Scenario: Agendar (E · L9-1)
- **GIVEN** un visitante en cada idioma, con Calendly simulado
- **WHEN** abre la agenda y completa la reserva
- **THEN** ve los próximos pasos en su idioma

#### Scenario: En el runtime real (E)
- **GIVEN** el sitio servido en el runtime de Workers
- **WHEN** se completa el flujo de consulta y se abre la agenda
- **THEN** ambos funcionan igual que en el servidor de pruebas

### Requirement: Todo el sitio se usa sin ratón
Un visitante que solo usa el teclado MUST poder hacer todo lo que ofrece la home.

#### Scenario: Recorrido completo con teclado (E · L9-2)
- **GIVEN** la home en escritorio
- **WHEN** se recorre solo con el teclado
- **THEN** se puede saltar al contenido, cambiar de idioma, recorrer las cinco etapas, cambiar la versión de la página, cambiar de modo de formulario, enviarlo y abrir la agenda
- **AND** el foco es visible en cada paso

#### Scenario: Menú en móvil (E · L9-2)
- **GIVEN** la home en un ancho de móvil
- **WHEN** se usa solo el teclado
- **THEN** el menú se abre, se recorre y se cierra

#### Scenario: Movimiento reducido (E · L9-2)
- **GIVEN** la preferencia de movimiento reducido
- **WHEN** se usan las etapas, el formulario y la agenda
- **THEN** nada se desplaza ni se escala de forma animada

### Requirement: Accesibilidad automática sin infracciones
La home y las páginas legales MUST pasar el análisis automático de accesibilidad en ambos idiomas, en ambas versiones de la escena y en móvil y escritorio.

#### Scenario: Sin infracciones (E · L9-3)
- **GIVEN** la home y las cuatro páginas legales, a 375 y 1280 px, en versión completa y ligera
- **WHEN** las analiza axe
- **THEN** no hay infracciones

### Requirement: Presupuesto de rendimiento
La home MUST cumplir el presupuesto de rendimiento con el perfil de medición del proyecto, en ambas versiones de la escena.

#### Scenario: LCP y CLS (E · L9-4)
- **GIVEN** `/es` en móvil simulado con red y procesador limitados
- **WHEN** carga en versión ligera y en versión completa
- **THEN** en ambas el LCP es menor que 2,5 s y el CLS menor que 0,1

#### Scenario: JavaScript inicial (U · L9-4)
- **GIVEN** el build de producción
- **WHEN** se mide el JS inicial de `/es`
- **THEN** es de 200 kB comprimido o menos y no incluye Three.js

### Requirement: Datos de entrada acotados en todo el sitio
Todo dato que llega del navegador y se guarda MUST cumplir un formato estricto. Las etiquetas de campaña que acompañan a una consulta MUST tener el mismo formato que las de la analítica.

#### Scenario: Etiquetas de campaña de la consulta (U, I)
- **GIVEN** una consulta con una etiqueta de campaña que contiene espacios, un correo o más de 40 caracteres
- **WHEN** se valida
- **THEN** la consulta se acepta y esa etiqueta se guarda como ausente

### Requirement: Auditoría de seguridad y revisión de toda la versión
Antes de cerrar el lote MUST ejecutarse una auditoría de seguridad y una revisión de código sobre todo el sitio. Cada hallazgo de severidad alta o media MUST quedar corregido o aceptado por escrito por el fundador.

#### Scenario: Hallazgos resueltos (M · L9-6, L9-7)
- **GIVEN** el informe de la auditoría y el de la revisión
- **WHEN** se cierra el lote
- **THEN** cada hallazgo alto o medio tiene su corrección, con prueba, o su aceptación escrita
- **AND** el informe queda en el repositorio

#### Scenario: Secretos fuera del repositorio (U, M)
- **GIVEN** el repositorio completo y su historial local
- **WHEN** se busca cualquier clave o secreto
- **THEN** no hay ninguno
