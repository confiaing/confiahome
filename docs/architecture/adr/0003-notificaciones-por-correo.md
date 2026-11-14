# ADR-0003: Avisos de consulta con el binding `send_email` de Cloudflare

**Estado:** Aceptada · **Fecha:** 2026-11-13

## Contexto

Cada consulta debe avisar a hola@confia.ing. El dominio ya usa Cloudflare Email Routing hacia un buzón de Gmail verificado. No se envía correo al visitante (la confirmación es en pantalla).

## Decisión

El Worker envía el aviso con el binding `send_email`, desde `web@confia.ing` hacia la dirección de destino verificada. Texto plano, con `Reply-To` del visitante cuando dejó correo.

## Opciones consideradas

| Opción | Costo | Secretos | Nota |
|---|---|---|---|
| `send_email` (elegida) | Gratis a direcciones verificadas | Ninguno | Solo sirve para avisar al equipo |
| Resend u otro proveedor | Gratis con cupo | API key + registros DNS | Necesario solo si se quisiera escribir al visitante |
| Webhook de base de datos de Supabase | Gratis | Configuración fuera del repo | Más difícil de probar y versionar |

## Consecuencias

- Sin proveedor adicional ni clave que rotar.
- El sitio no envía un acuse **automático** al visitante: eso exige plan de pago o un proveedor externo y queda fuera de la v1. La respuesta la da el equipo desde Gmail como hola@confia.ing (envío y recepción ya configurados por el usuario); el buzón de Gmail es el respaldo de toda la correspondencia.
- El envío no bloquea la respuesta: si falla, la consulta ya está guardada.
- Acción del usuario: confirmar que el buzón de destino figura como dirección verificada en Email Routing.
