# L11 — Base de la v1.1

## Why

La v1 está en producción, pero sus once cambios de OpenSpec siguen abiertos y `openspec/specs/` está vacío. Sin una verdad vigente, los lotes L12 a L16 no tienen contra qué escribir sus deltas. Además, la guía del agente (`CLAUDE.md`) y la configuración de OpenSpec todavía describen la v1, y el skill de revisión que pidió el fundador nunca se instaló.

## What Changes

Lote **L11** del BACKLOG («v1.1 — Plan»).

- **Cerrar L10.** Anotar la evidencia de las tareas hechas. Pasar a su lote las que se trasladan: 4.1 a L13 y 5.6 a L12. Comprobar el registro `maintenance.done` de la tarea diaria (3.7), que solo se ve después de las 08:17 UTC del 17 de noviembre.
- **Reconciliar antes de archivar.** Revisar las 161 exigencias de L0 a L10 frente al código actual. Las que una tarea posterior contradijo, duplicó o dejó obsoletas se corrigen con deltas MODIFIED o REMOVED en este cambio, que el fundador aprueba antes de archivar.
- **Archivar L0 a L10 en orden.** `openspec/specs/` queda con las capacidades vigentes y `openspec list` sin cambios de la v1.
- **Actualizar `CLAUDE.md`:** estado de la v1.1, rama y pull request desde L12, revisión local antes de cada `push` (D1) y skills corregidos.
- **Instalar el skill `code-reviewer` de aitmpl.com** (claude-code-templates, v2.0.0) en `.claude/skills/`, versionado con el repositorio. Antes, leer su contenido. Necesita el permiso del fundador para la descarga.
- **Corregir `openspec/config.yaml`.** Una regla de specs mal citada hace que OpenSpec ignore todas las reglas de specs. Además, el texto sigue describiendo la v1.
- **Pruebas unitarias** de lo anterior.

## Capabilities

### New Capabilities
- `development-workflow`: reglas que todo cambio cumple antes de llegar a `main`. Especificaciones vigentes archivadas, guía del agente al día, revisión local antes de subir y configuración de OpenSpec válida.

### Modified Capabilities
La revisión previa encontró 11 correcciones (tabla R1 a R11 en `design.md`):

- `security-headers`: HSTS con `includeSubDomains`; respuesta 304 sin CSP.
- `contact-form`: ejemplos animados y la pregunta encima de la respuesta.
- `home-page`: título del cierre partido por frases.
- `app-shell`: páginas servidas desde el build.
- `legal-pages`: aviso de borrador duplicado.
- `site-navigation` y `scheduling`: agenda sin JavaScript.
- `locale-routing`: metadatos duplicados.
- `repository-and-ci`: la CI ejecuta la puerta más el contrato.
- `production-release`: dato de prueba conservado por decisión del fundador.

## Fuera de alcance

- Protección de `main`, Dependabot, `npm audit` y la comprobación diaria de producción (L12).
- Cloudflare, `www` y Turnstile (L13); despliegue desde GitHub (L14); deuda de la auditoría (L15).
- Reescribir el README y pasar el repositorio a privado (L16).
- Cambios en el comportamiento del sitio: L11 no toca `src/` ni producción.

## ADR aplicables

ADR-0017 (CI y revisión local). No contradice ninguno.

## Impact

`openspec/`, `CLAUDE.md`, `.claude/skills/`, `tests/unit/`, README y BACKLOG.

## Preguntas al fundador

1. ¿Autorizas descargar e instalar el skill `code-reviewer` de aitmpl.com en `.claude/skills/`?
2. Para la revisión local antes de cada `push` (D1): ¿se usa `/code-review` de Claude Code, el skill de aitmpl, o los dos?
