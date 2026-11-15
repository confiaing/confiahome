# ADR-0015: La agenda se carga en su bloque, con el widget de Calendly y a petición

**Estado:** Aceptada · **Fecha:** 2026-11-14 · **Decide:** fundador de Confia.ing (propuesta del lote L6)

## Contexto

«Agenda 30 minutos» es la acción principal de la página. El PRD pide un calendario integrado; el proyecto pide además que ningún tercero se cargue sin una acción del visitante, y que la acción funcione sin JavaScript.

El backlog (L6-4) describía un diálogo. El diseño finalista lleva todas las acciones de agenda a la tarjeta «Agenda» del cierre y carga allí el calendario. Las dos fuentes se contradecían; CLAUDE.md da prioridad al diseño.

Calendly, comprobado contra el servicio real el 2026-11-14:

- Su script `widget.js` monta el calendario en un marco dentro del elemento que se le indique.
- El marco avisa a la página con `window.postMessage`, con origen `https://calendly.com`: `calendly.page_height`, `calendly.event_type_viewed`, `calendly.date_and_time_selected` y, al confirmar la reserva, `calendly.event_scheduled`. Este último se verificó con una reserva de prueba.
- El idioma lo fija el tipo de evento, no el navegador ni la dirección. El plan actual admite un solo evento, que está en inglés.

## Decisión

1. **El calendario se monta dentro de la tarjeta `#agenda`**, no en un diálogo.
2. **Las acciones de agenda son enlaces reales a Calendly** (`<a data-agenda href="https://calendly.com/…" target="_blank">`). Con scripts, `AgendaPanel` intercepta el clic, lleva el foco al título del bloque y carga el calendario. Sin scripts, o antes de hidratar, el enlace abre Calendly en otra pestaña.
3. **Se usa el script oficial de Calendly**, pedido solo tras la acción del visitante. Antes, el bloque dice que el calendario es de Calendly.
4. **El estado se deduce de los mensajes de Calendly:** cualquier mensaje suyo significa que el calendario está vivo; `calendly.event_scheduled` muestra la confirmación. Sin señales en 20 s, o si el script falla, se ofrece el enlace directo y el formulario.
5. **Un solo calendario.** Su idioma se declara en `NEXT_PUBLIC_CALENDLY_LOCALE` (por defecto, inglés); cuando no coincide con el de la página, el bloque lo avisa.

## Opciones consideradas

| Opción | A favor | En contra |
|---|---|---|
| **Bloque en la página (elegida)** | Es el diseño elegido; sin foco atrapado ni capas; el calendario tiene sitio propio | El visitante es desplazado al final de la página |
| Diálogo modal propio | El visitante no pierde su posición | Más código y más riesgo de accesibilidad; un calendario de 700 px de alto dentro de un modal en móvil |
| Ventana emergente de Calendly | Mínimo código | El diálogo es de Calendly: ni su accesibilidad ni su aspecto dependen de nosotros |
| Marco propio sin el script | Ningún script de terceros | Calendly no garantiza los mensajes fuera de su script; habría que mantener a mano sus parámetros |
| Solo el enlace directo | Nada que mantener | No cumple «calendario integrado» ni permite medir reuniones agendadas |

## Consecuencias

- Al cargar la página no hay ninguna petición a Calendly; lo comprueba una prueba E2E.
- Tras el clic se cargan `assets.calendly.com`, `calendly.com` y `dfp.calendly.com`, y Calendly muestra su propio aviso de cookies dentro del marco. La política de privacidad (L8) y la política de seguridad de contenido (L9) deben recogerlo.
- No hay foco atrapado ni tecla Escape: no hay nada que cerrar. L6-4 pasa a ser «accesibilidad del bloque».
- De la reserva solo se sabe que ocurrió. No se lee ni se guarda quién reservó.
- El bloque emite `confia:agenda-opened` y `confia:agenda-scheduled`, sin datos, para la analítica de L7.
- Las pruebas automáticas usan un Calendly simulado servido en sus direcciones reales. La comprobación contra el servicio real es manual: `scripts/capture-agenda-shots.ts`.
- Si Calendly cambia sus mensajes, el calendario sigue funcionando dentro del marco; lo que se perdería es nuestra confirmación y, pasado el plazo, aparecería el aviso con el enlace directo junto al calendario.
