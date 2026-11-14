# ADR-0002: Supabase accesible solo desde el servidor, con latido diario

**Estado:** Aceptada · **Fecha:** 2026-11-13

## Contexto

Las consultas contienen datos personales (nombre, correo o teléfono). Supabase permite escribir desde el navegador con la publishable key si hay políticas RLS que lo autoricen. El plan gratuito pausa los proyectos tras 7 días sin actividad en la base de datos.

## Decisión

1. El navegador nunca habla con Supabase. Solo los Route Handlers del Worker lo hacen, con la **secret key** guardada como secreto.
2. RLS activado en todas las tablas, sin políticas para `anon` ni `authenticated`.
3. Una tarea programada (Cron Trigger) hace una consulta mínima diaria para evitar la pausa.
4. El esquema se gestiona con migraciones SQL versionadas en `supabase/migrations/`, aplicadas con la CLI de Supabase tras el `supabase login` del usuario.
5. **Dos entornos de datos:** desarrollo usa Supabase local (`supabase start`, en Docker); producción usa el proyecto `confiahomeDB`. Las migraciones se prueban en local y luego se aplican a producción con `supabase db push`.

## Opciones consideradas

- **Inserción directa desde el navegador con RLS de solo inserción:** menos código, pero la tabla queda abierta a escrituras de cualquiera que tenga la clave pública y Turnstile no se puede verificar. Descartada.
- **Cloudflare D1 en lugar de Supabase:** sin pausa ni segundo proveedor, pero contradice la restricción del usuario. Descartada.
- **Edge Functions de Supabase:** duplica el runtime de servidor que ya da el Worker. Descartada.

## Entorno de desarrollo: opciones consideradas

| Opción | Costo | Riesgo |
|---|---|---|
| Supabase local en Docker (elegida) | Gratis; no gasta proyectos del plan | Requiere Docker en ejecución |
| Segundo proyecto en la nube (`dev`) | Gratis, pero ocupa el segundo y último proyecto del plan y también se pausa a los 7 días | Dos proyectos que mantener despiertos |
| Un solo proyecto para todo | Ninguno | Datos de prueba mezclados con consultas reales; una migración fallida rompe producción |

## Consecuencias

- La publishable key no se usa en la v1; se documenta en `.env.example` por si hiciera falta en el futuro.
- Si el latido falla una semana seguida, el formulario devolvería error: la API responde con un mensaje que ofrece escribir a hola@confia.ing y el fallo queda en los logs.
- El equipo consulta las solicitudes en el panel de Supabase; no hay panel propio en la v1.
- Acción: confirmar al implementar que el Worker de OpenNext admite un handler `scheduled` propio; si no, el latido se hace con un segundo Worker mínimo.
