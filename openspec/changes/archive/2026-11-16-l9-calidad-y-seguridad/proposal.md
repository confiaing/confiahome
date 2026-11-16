# Proposal

Lote **L9 — Calidad y seguridad** de [BACKLOG.md](../../../BACKLOG.md). Tareas: L9-1 a L9-8, más lo que dejaron anotado los lotes anteriores.

## Why

La página hace lo que debe, pero no está lista para exponerse: responde sin cabeceras de seguridad, la base de datos se pausaría tras una semana sin uso y la política de privacidad promete borrar datos que hoy nadie borra. Y cada lote se probó por separado; falta mirar la v1 entera.

## What Changes

- **Cabeceras de seguridad** en todas las respuestas: política de contenido (CSP) sin `unsafe-inline` para scripts y con los terceros explícitos, HSTS, `nosniff`, `Referrer-Policy` y `frame-ancestors 'none'`.
- **Tarea diaria del Worker** con dos trabajos: el **latido** que evita la pausa de Supabase y el **borrado** de consultas con más de 24 meses y de eventos con más de 13.
- **Registros de Cloudflare sin IP:** se desactivan los registros de invocación, que pueden guardar la IP de cada petición; se conservan los nuestros.
- **Endurecimiento pendiente:** las etiquetas `utm_*` de una consulta, con el formato estricto de la analítica.
- **Pruebas de la v1 completa:** los dos flujos en ambos idiomas, toda la home solo con teclado, accesibilidad automática en home y legales en ambas versiones de la escena, y presupuesto de rendimiento.
- **Prueba en el runtime real:** una pasada de E2E contra `preview` (Workers).
- **Auditoría de seguridad** con el skill `security-audit` y **revisión de código de toda la v1**; cada hallazgo alto o medio, corregido o aceptado por ti.

## Lo que conviene que sepas antes de aprobar

1. **La CSP sin `unsafe-inline` es la parte incierta.** Next.js escribe scripts dentro del HTML. La vía que propongo es autorizarlos por su huella (hash), calculada al construir, sin perder que las páginas sean estáticas. Empiezo por una prueba de concepto; si no es viable, te traigo las alternativas antes de seguir.
2. **Hace falta una entrada propia del Worker** que envuelva a la de OpenNext: es donde se ponen las cabeceras y donde vive la tarea diaria. Va en un ADR.
3. **El borrado es irreversible.** Lo pruebo solo contra la base local. La copia de cada consulta en tu buzón de correo no la puede borrar el sitio: sigue siendo manual.
4. **HSTS sin subdominios ni precarga**, salvo que me confirmes que todo `confia.ing` va siempre por HTTPS.

## Capabilities

### New Capabilities

- `security-headers`: cabeceras y política de contenido de todas las respuestas.
- `scheduled-maintenance`: latido diario y borrado por conservación.
- `release-quality`: lo que la v1 completa debe superar antes de lanzarse.

### Modified Capabilities

Ninguna en `openspec/specs/`.

## Fuera de alcance

- Despliegue, secretos, migraciones en producción, dominio y CI (L10).
- Revisión legal. Monitorización y alertas.

## ADR que aplican

[ADR-0001](../../../docs/architecture/adr/0001-plataforma-cloudflare-workers.md), [ADR-0002](../../../docs/architecture/adr/0002-acceso-a-supabase-solo-servidor.md), [ADR-0008](../../../docs/architecture/adr/0008-estrategia-de-pruebas.md). **ADR nuevo, 0016:** entrada propia del Worker, cabeceras y CSP por huella.

## Impact

- **Código nuevo:** `worker/`, `src/lib/server/security/`, `src/domain/maintenance/`, adaptadores, scripts de comprobación, E2E contra `preview`.
- **Código modificado:** `wrangler.jsonc`, `container.ts`, esquema de la consulta.
- Sin dependencias nuevas.
