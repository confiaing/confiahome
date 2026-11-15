# Design

## Context

Las acciones de agenda son hoy `AgendaLink`: un enlace a `publicEnv.calendlyUrl` que se abre en otra pestaña y lleva `data-agenda`. Lo usan la cabecera, el hero y el cierre; el bloque `#agenda` del cierre muestra el título, una nota y ese mismo enlace. `src/components/scheduling/` está vacío.

El diseño finalista (`docs/design/ronda5-cercano-3d-finalista.html`) resuelve la agenda así: todas las acciones son `href="#agenda"`, llevan a la tarjeta «Agenda» y le dan el foco; el calendario se carga dentro de la tarjeta. El backlog (L6-4) habla de un diálogo. CLAUDE.md ordena que el diseño finalista prevalezca sobre el backlog.

Calendly (documentación consultada el 2026-11-14):

- El modo soportado para incrustar es su script `https://assets.calendly.com/assets/external/widget.js` con `Calendly.initInlineWidget({ url, parentElement })`. El marco suelto, sin ese script, no garantiza los mensajes al documento padre.
- Avisa al documento padre con `window.postMessage`: `calendly.profile_page_viewed`, `calendly.event_type_viewed`, `calendly.date_and_time_selected`, `calendly.event_scheduled`. El origen es `https://calendly.com`.
- El idioma de la página de reserva se fija en cada tipo de evento. No hay parámetro documentado para cambiarlo por visita.

**Sonda contra el Calendly real (2026-11-14).** Página local mínima con `widget.js` e `initInlineWidget` sobre `https://calendly.com/confiaing/30min`, registrando solo nombre del mensaje, origen y nombres de claves:

- El marco se crea con `?embed_domain=…&embed_type=Inline` y Calendly le pone su propio `title` en inglés («Select a Date & Time - Calendly»): hay que sobrescribirlo.
- Los mensajes llegan con origen `https://calendly.com`. Antes de `calendly.event_type_viewed` (que llegó dos veces) llega `calendly.page_height` con `payload.height`, no documentado.
- Del script cargado al primer mensaje pasaron unos 8 s, y 10 s hasta `event_type_viewed`, en el navegador integrado. El plazo de 10 s previsto es corto.
- **El calendario se muestra en inglés** («30 Minute Meeting», «Select a Day»), también con el navegador en español: el evento está configurado en inglés.
- `calendly.event_scheduled`: **comprobado** con una reserva de prueba autorizada por el fundador (30 de noviembre de 2026, 09:30, a cancelar por él). Llega desde `https://calendly.com` al confirmar, con `payload.event` y `payload.invitee` (referencias de Calendly, que no se leen ni se guardan). Antes llega `calendly.date_and_time_selected`. El marco pasa a mostrar la confirmación propia de Calendly. El fundador confirmó que la invitación llegó al correo y que la cita queda aceptada automáticamente al caer en un horario libre; reprogramar o cancelar es manual, desde Calendly.

## Goals / Non-Goals

**Goals**

- Reservar sin salir de la página, con Calendly cargado solo tras la acción del visitante.
- Que la acción funcione siempre: sin JavaScript, con Calendly bloqueado o caído.
- Dejar listo el enganche para la analítica de L7 sin implementarla.

**Non-Goals**

- Diálogo modal. Guardar datos de la reserva. CSP (L9). Texto legal (L8).

## Decisions

### D1 — Bloque en la página, no diálogo (ADR-0015)

El calendario se monta dentro de la tarjeta `#agenda`. Las acciones siguen siendo enlaces reales a Calendly (lo que funciona sin scripts); con scripts, un único componente cliente intercepta el clic.

*Alternativas:* diálogo modal (lo que decía el backlog: más código, foco atrapado, y un calendario de 700 px de alto dentro de un modal en móvil); ventana emergente de Calendly (`initPopupWidget`: su diálogo no es nuestro, no podemos garantizar su accesibilidad ni su aspecto).

### D2 — Un componente cliente: `AgendaPanel`

`src/components/scheduling/agenda-panel.tsx` (`"use client"`), montado por `closing.tsx` dentro de la tarjeta. Estados: `idle → loading → ready | failed`, y `scheduled` desde `ready`.

- **Interceptar acciones.** Un único listener de `click` en `document` busca `a[data-agenda]` (delegación). Si no hay teclas modificadoras ni botón central: `preventDefault()`, desplaza a `#agenda` (`behavior: "auto"` con movimiento reducido), enfoca el título (`tabIndex={-1}`, `focus({ preventScroll: true })`) y pide el calendario. Así cabecera, hero y cierre siguen siendo componentes de servidor sin cambios de estructura.
- **Botón propio.** En `idle`, el bloque muestra un botón «Ver horarios aquí», el aviso de que el calendario es de Calendly y el enlace directo.
- **Antes de hidratar** el clic abre Calendly en otra pestaña: sigue siendo una reserva válida.

### D3 — Carga del widget: `src/components/scheduling/calendly-loader.ts`

Función `loadCalendly(): Promise<CalendlyApi>` que inserta el script una sola vez (reutiliza el que exista), resuelve con `window.Calendly` y rechaza si el script falla. La hoja de estilos de Calendly solo hace falta para su ventana emergente; no se carga.

`initInlineWidget({ url, parentElement })` crea el marco; al aparecer se le pone `title` desde el diccionario (un `MutationObserver` acotado al contenedor).

### D4 — Cuándo está «listo» y cuándo «no disponible»

- `ready`: al recibir cualquier mensaje `calendly.*` desde Calendly (el primero suele ser `calendly.page_height`). El `load` del marco no cuenta: también se dispara con una página de error.
- `failed`: si el script rechaza, o a los **20 s** sin `ready` (la sonda midió 8 a 10 s en condiciones normales). El marco no se retira: si llega después, el estado pasa a `ready` y el mensaje desaparece.
- Reintento: vuelve a `loading` y reinicia el plazo.

El contenedor reserva la altura del calendario desde `loading` para que la llegada del marco no mueva la página.

### D5 — Mensajes de Calendly: `src/lib/calendly.ts`

Funciones puras, sin DOM, probadas en unitario:

- `calendlySignal(origin, data): "viewed" | "date-selected" | "scheduled" | "other" | null` — exige `origin === "https://calendly.com"` y `data.event` con prefijo `calendly.`.
- `embedUrl(base)`: valida `https://calendly.com/…` y devuelve la dirección para el widget. No se añade `hide_gdpr_banner`: el aviso de cookies de Calendly es suyo y debe verse.

Va en `src/lib/` (utilidad segura para el cliente), no en `src/domain/`: no hay reglas de negocio, solo el protocolo de un tercero.

### D6 — Idioma

El plan de Calendly admite un solo tipo de evento y su idioma se fija en el evento. Comprobado el 2026-11-14 con navegadores en `es-CO` y `en-US`: el calendario sale **en inglés** en ambos (`<html lang="en">`), así que no sigue al navegador.

`public-env.ts` añade `NEXT_PUBLIC_CALENDLY_LOCALE` (`es` o `en`; por defecto `en`, lo comprobado). Cuando no coincide con el idioma activo, el bloque muestra `agenda.languageNote`: en el diccionario español dice que el calendario está en inglés, y en el inglés, que está en español. Si el fundador cambia el idioma del evento en Calendly, basta con cambiar la variable. `AgendaLink` no cambia.

*Alternativa:* una dirección por idioma. Descartada: no hay segundo evento.

### D7 — Confirmación y enganche para L7

`scheduled` sustituye el calendario por la confirmación (`role="status"`, con foco) y deja debajo el marco de Calendly con su propio resumen de la reserva. Textos nuevos en `agenda.*`: `open`, `provider`, `loading`, `frameTitle`, `unavailable`, `openDirect`, `useForm`, `retry`, `languageNote`, `confirmedTitle`, `confirmedSteps[]`.

`AgendaPanel` emite `CustomEvent`s en `document` (`confia:agenda-opened`, `confia:agenda-scheduled`), sin datos. L7 los escucha; L6 no envía nada.

### D8 — Sin JavaScript

`@media (scripting: none)` oculta el botón «Ver horarios aquí» (`[data-agenda-open]`). Quedan el título, la nota y el enlace directo.

### Dependencias

Ninguna nueva.

## Risks / Trade-offs

- **Calendly cambia su script o sus mensajes.** → El enlace directo está siempre a la vista; el plazo de 20 s cubre el caso de que `ready` no llegue.
- **Las pruebas no hablan con Calendly** (regla del proyecto). → Unitarias e integración con el API simulado; E2E con `page.route` sirviendo un `widget.js` falso que crea un marco y emite los mensajes. Una comprobación **manual (M)** contra el Calendly real en el navegador, sin completar ninguna reserva, se anota como evidencia.
- **Mensajes simulados en E2E con origen distinto de `calendly.com`.** → La comprobación de origen se prueba en unitario e integración; en E2E el marco falso se sirve interceptando `https://calendly.com/*`, de modo que el origen es el real.
- **Cookies de terceros.** Calendly puede poner cookies al cargarse. → Solo tras el clic y con aviso previo; la política de privacidad lo recoge en L8.
- **Altura del calendario en móvil.** → Altura reservada con `clamp`; se revisa en capturas a 390 px.
- **Calendario en inglés dentro de `/es`.** → Aviso previo en español; los campos de Calendly son pocos (nombre, correo) y la conversación se acuerda en el idioma del visitante.

## Migration Plan

Sin migración de datos. `NEXT_PUBLIC_CALENDLY_LOCALE` es opcional y se lee al construir.

## Cambios durante la implementación

- **Idioma.** El evento resultó estar en inglés: `NEXT_PUBLIC_CALENDLY_LOCALE` (por defecto `en`) sustituye a la suposición de «español».
- **«Listo» solo por mensajes.** El `load` del marco no se usa como señal.
- **Plazos.** 20 s para la primera señal de Calendly; 15 s para que su script cargue.
- **Emisor del mensaje.** Además del origen, se exige que sea el marco del bloque.
- **Foco.** También el botón del bloque y el reintento llevan el foco al título.
- **Hueco del calendario.** Se reserva solo si hay marco; el desplazamiento al bloque ocurre después de pintarlo.
- **Sin componente activo.** El botón y la frase «se abre aquí» dependen de `data-hydrated`, no de `scripting: none`.
- **Comprobación manual.** Queda como script: `scripts/capture-agenda-shots.ts`.
