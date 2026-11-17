# Proposal

Lote **L10 — Lanzamiento** de [BACKLOG.md](../../../BACKLOG.md). Tareas: L10-1 a L10-5, más lo que los lotes anteriores dejaron para este.

## Why

El sitio está construido, probado y revisado, pero solo existe en esta Mac. Falta ponerlo en `confia.ing` con sus servicios reales, comprobar que una consulta de verdad llega, y subir el código a GitHub con las comprobaciones automáticas que eviten romperlo después.

Es el único lote cuyas acciones salen de esta máquina: escriben en la base de producción, publican un sitio y un repositorio. Por eso cada una espera tu orden expresa.

## What Changes

- **Comprobación previa al lanzamiento** (`npm run release:check`): falla si el build no lleva lo que producción exige —dirección pública, clave pública de Turnstile— o si el estado legal no cuadra.
- **Base de datos de producción:** las tres migraciones aplicadas a `confiahomeDB` y comprobación de que la clave pública no lee ni escribe nada.
- **Secretos y variables** cargados en el Worker. Los valores los escribes tú en tu terminal; yo preparo los comandos y no los veo.
- **Despliegue en `confia.ing`**, con comprobación de páginas, cabeceras y tarea diaria, y una consulta real de prueba de punta a punta.
- **Ajustes en Cloudflare** que quedaron anotados: dominio del widget de Turnstile, regla de frecuencia para `/api/events`, destinatario único del aviso.
- **Subida a GitHub** tras revisar lo que se publica, con **integración continua** y **protección de la rama principal**.
- **README final y guía de operación:** cómo desplegar, leer y responder consultas, rotar claves, volver atrás.
- **Archivo de los cambios de OpenSpec**, que hasta ahora siguen abiertos.

## Lo que necesito de ti antes de empezar

1. **¿Lanzar con los textos legales en borrador?** Hoy muestran el aviso, no se indexan y les faltan los datos del responsable. El formulario recoge datos personales y enlaza a esa política. Lanzar así es decisión tuya y de tu abogado; la alternativa es esperar a tenerlos revisados.
2. **Insumos:** clave pública y secreta de Turnstile, dirección de aviso verificada en Email Routing, token de Web Analytics (opcional) y sesión iniciada en `wrangler` y en la CLI de Supabase.
3. **¿El repositorio será público?** El README lo da por hecho. Revisaré el historial antes de subir.
4. **HSTS:** ¿todo `confia.ing`, con sus subdominios, va siempre por HTTPS?

## Capabilities

### New Capabilities

- `production-release`: qué debe cumplirse para desplegar y qué se verifica después.
- `repository-and-ci`: qué se publica en GitHub y qué comprobaciones protegen la rama principal.

### Modified Capabilities

Ninguna en `openspec/specs/`.

## Fuera de alcance

- Revisión legal. Monitorización y alertas. Alta en buscadores. Mejoras posteriores a la v1.

## ADR que aplican

[ADR-0001](../../../docs/architecture/adr/0001-plataforma-cloudflare-workers.md), [ADR-0002](../../../docs/architecture/adr/0002-acceso-a-supabase-solo-servidor.md), [ADR-0003](../../../docs/architecture/adr/0003-notificaciones-por-correo.md), [ADR-0016](../../../docs/architecture/adr/0016-entrada-propia-del-worker-cabeceras-y-tarea-diaria.md). **ADR nuevo, 0017:** integración continua y protección de la rama.

## Impact

- **Código nuevo:** `scripts/release.ts`, `.github/workflows/`, `docs/operations.md`.
- **Código modificado:** `wrangler.jsonc` (dominio, destinatario), `package.json`, README, BACKLOG, `docs/setup.md`.
- **Fuera de esta máquina:** `confiahomeDB`, el Worker `confiahome`, el dominio y el repositorio de GitHub.
