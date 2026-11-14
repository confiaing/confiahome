# Proposal

Lote **L5 — Consulta por formulario (Flujo B)** de [BACKLOG.md](../../../BACKLOG.md). Historias: L5-1 a L5-10.

## Why

Una de las dos vías de contacto, «Cuéntanos dónde quieres aplicar IA», hoy solo muestra un correo. Es el flujo para quien aún no quiere agendar una llamada, y el primer punto donde el sitio guarda datos personales: estrena la base de datos, el antispam y el aviso por correo.

## What Changes

- **Formulario de consulta** en el bloque del cierre: nombre, empresa, correo, teléfono y mensaje; exige correo o teléfono y un consentimiento explícito, no preseleccionado, con enlace a la política de privacidad.
- **Dos modos a elección del visitante:** terminal (el inicial) y clásico con un panel `consulta.json` en vivo. Mismos campos, mismo esquema y mismos errores; cambiar de modo conserva lo escrito.
- **Errores accesibles:** cada uno junto a su campo y anunciado; el foco va al primero; nada de lo escrito se pierde.
- **Confirmación en pantalla** sin prometer plazo, y **degradación**: si algo falla, un error claro con `hola@confia.ing`.
- **`POST /api/contact`:** valida en el servidor con el mismo esquema, comprueba origen y tipo de contenido, y responde con errores por campo en el idioma del visitante.
- **Tabla `contact_requests`** en Supabase, con RLS sin políticas públicas y la regla «correo o teléfono» también en la base. Guarda fecha y versión del consentimiento.
- **Antispam en tres capas:** Turnstile verificado en el servidor, campo trampa y límite de frecuencia. La IP no se guarda.
- **Aviso al equipo** por correo en texto plano, con `Reply-To` del visitante; si el aviso falla, la consulta ya está guardada.

## Capabilities

### New Capabilities

- `contact-submission`: recepción, validación, guardado, antispam y aviso de una consulta.
- `contact-form`: el formulario en sus dos modos, sus errores, confirmación y degradación.

### Modified Capabilities

Ninguna.

## Fuera de alcance

- Envío real en producción: secretos, migración en `confiahomeDB` y prueba con el dominio (L10).
- Acuse por correo al visitante (después de la v1) y casilla de comunicaciones comerciales (descartada en la Fase 1).
- Eventos de analítica del formulario (L7); texto legal definitivo (L8); cabeceras de seguridad (L9).
- Panel para leer las consultas: se consultan en Supabase.

## ADR que aplican

- [ADR-0002](../../../docs/architecture/adr/0002-acceso-a-supabase-solo-servidor.md): Supabase solo desde el servidor, RLS sin políticas.
- [ADR-0003](../../../docs/architecture/adr/0003-notificaciones-por-correo.md): aviso con `send_email`.
- [ADR-0006](../../../docs/architecture/adr/0006-antispam.md): antispam en capas.
- [ADR-0008](../../../docs/architecture/adr/0008-estrategia-de-pruebas.md): puertos y adaptadores; contrato contra Supabase local.
- [ADR-0010](../../../docs/architecture/adr/0010-formulario-en-dos-modos.md): dos modos sobre un esquema.
- **ADR nuevo, 0014:** Supabase por PostgREST con `fetch`, sin su SDK. No contradice el ADR-0002; lo concreta.

## Impact

- **Código nuevo:** `src/domain/contact/`, adaptadores en `src/adapters/`, `src/app/api/contact/`, `src/components/contact/`, migración en `supabase/migrations/`.
- **Código modificado:** `closing.tsx`, `container.ts`, `env.ts`, diccionarios, `wrangler.jsonc` (bindings de correo y de límite de frecuencia).
- **JavaScript de cliente:** el formulario y Zod. Se mide contra el presupuesto.
- **Pruebas de contrato:** primera vez que se usan; necesitan Supabase local en Docker.
- Sin dependencias nuevas.
- **Del fundador, para L10:** widget de Turnstile y dirección de aviso verificada.
