# ADR-0005: Analítica sin cookies

**Estado:** Aceptada · **Fecha:** 2026-11-13

## Contexto

El PRD pide medir visitas, clics en CTA, aperturas de calendario, reuniones agendadas e inicio/envío de formulario, por idioma, dispositivo y canal, sin registrar contenido sensible. El usuario eligió no usar cookies ni banner.

## Decisión

- **Visitas y duración:** Cloudflare Web Analytics (script sin cookies).
- **Eventos de conversión:** `POST /api/events` guarda en `analytics_events` un nombre de una lista cerrada más idioma, tipo de dispositivo, ruta, host del referente y parámetros UTM.
- **Reunión agendada:** se detecta con el mensaje `calendly.event_scheduled` del widget embebido.
- No se guarda IP, identificador de visitante, user-agent completo ni texto del formulario.

## Opciones consideradas

- **Google Analytics 4:** embudos más ricos, pero exige banner de consentimiento y añade peso. Descartada por el usuario.
- **Plausible/Fathom:** sin cookies y con eventos, pero de pago.

## Consecuencias

- Sin banner y sin datos personales en analítica.
- No hay recorridos por visitante ni embudos por sesión: la conversión se calcula como proporción de eventos por día, idioma, dispositivo y canal.
- Los bloqueadores pueden descartar el script de Cloudflare; los eventos propios son de primera parte y resisten mejor.
- Los informes se consultan con SQL en Supabase; un panel queda para versiones posteriores.
