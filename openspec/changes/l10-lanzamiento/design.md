# Design

## Context

- Código en `main`, once commits locales, sin subir. Remoto configurado: `github.com/confiaing/confiahome`.
- `wrangler.jsonc`: Worker `confiahome`, entrada `worker/index.ts`, `SERVICES=real`, bindings de correo y de límite de frecuencia, disparo diario. Sin dominio propio declarado.
- `npm run build:worker` vacía las variables de desarrollo incrustadas, comprueba secretos y tamaño, y **avisa** si falta la clave pública de Turnstile.
- Tres migraciones, aplicadas solo en local. El proyecto remoto de Supabase está enlazado y nunca se ha tocado.
- `LEGAL_STATUS = "draft"`, `LEGAL_ENTITY` vacío.
- Pendientes anotados en lotes anteriores: restringir el widget de Turnstile al dominio; regla de frecuencia para `/api/events`; `destination_address` en el binding de correo; HSTS con o sin subdominios; verificar el límite de 20 por minuto y los registros sin invocaciones.
- Ningún cambio de OpenSpec está archivado: `openspec/specs/` está vacío.

No sé todavía, y se comprueba al empezar: el estado de las sesiones de `wrangler` y de Supabase; cómo está hoy el DNS de `confia.ing`; si el plan de GitHub de la organización admite protección de rama en un repositorio privado.

## Goals / Non-Goals

**Goals**

- Publicar sin sorpresas: cada paso externo, visible y ordenado por el fundador.
- Que «desplegado» esté verificado con una consulta real.
- Que el siguiente cambio al repositorio no pueda romper lo que hoy funciona.

**Non-Goals**

- Despliegue automático desde GitHub. Entornos de staging. Monitorización.

## Decisions

### D1 — Orden del lanzamiento

1. Comprobaciones previas e insumos (sin efectos externos).
2. Base de datos de producción.
3. Secretos y variables.
4. Despliegue a la dirección `workers.dev` y verificación.
5. Dominio `confia.ing` y verificación completa, con la consulta real.
6. Ajustes de Cloudflare.
7. Revisión y subida a GitHub; CI; protección de rama.
8. Documentos finales y archivo de OpenSpec.

Primero producción y después GitHub: el código que se publica es el que ya se vio funcionar. Cada paso del 2 al 7 empieza mostrando qué se va a ejecutar y espera la orden.

### D2 — `scripts/release.ts` (`npm run release:check`)

Función pura `releaseProblems(env, legal)` en `scripts/lib/release.ts`, probada en unitario; el script la llama con el entorno real y el estado legal. Comprueba:

- `NEXT_PUBLIC_SITE_URL`: HTTPS y no local.
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`: presente y distinta de las claves oficiales de prueba.
- `NEXT_PUBLIC_CALENDLY_URL`: de Calendly.
- Estado legal: `publicationBlockers()` vacío; en borrador, aviso explícito.
- Que el build existente se hizo con ese entorno: la clave pública aparece en los archivos del cliente.

Nunca imprime valores. `npm run release` = `release:check` + `build:worker`; el despliegue usa ese build (`wrangler deploy`), no `opennextjs-cloudflare deploy`, que reconstruiría sin pasar por las comprobaciones.

### D3 — Base de datos

`npx supabase db push --dry-run` primero, para ver qué aplicaría; después `db push`. Verificación con la publishable key (lectura vacía, inserción rechazada) y listado de columnas. Si una migración falla a medias, se detiene: son `create table` y `alter table add constraint` sobre tablas nuevas, sin datos que perder; la guía de operación explica cómo dejarla limpia.

### D4 — Secretos y variables

Con `wrangler secret put`, escritos por el fundador: `SUPABASE_SECRET_KEY`, `TURNSTILE_SECRET_KEY`, `SUPABASE_URL` y `NOTIFY_TO`. Los dos últimos no son secretos en sentido estricto, pero no van en `wrangler.jsonc`: el preview local lee ese archivo y no debe poder apuntar a la base de producción, y la dirección de aviso es un buzón personal en un repositorio público. Variables en `wrangler.jsonc`: `SERVICES` y `NOTIFY_FROM`. Las `NEXT_PUBLIC_*` van en el entorno del build, desde `.env.prod`, que se carga sin abrirlo ni mostrarlo.

El binding `send_email` no fija `destination_address`, por el mismo motivo; Email Routing ya limita los envíos a direcciones verificadas.

### D5 — Verificación en producción

Script de solo lectura `scripts/verify-production.ts <url>`: códigos de respuesta, cabeceras, que el HTML lleve el código en cada script, `robots`, `sitemap` y `llms.txt` con la dirección pública, y que una consulta sin token reciba 403. No envía consultas válidas.

La consulta real la hace el fundador, o yo en el navegador con su orden, con datos de prueba y su propio correo. Después se comprueban la fila y el aviso, y se borra la fila con su orden. La agenda se abre sin reservar.

El disparo diario no se puede forzar en producción desde fuera: se comprueba que está programado y, al día siguiente, el registro `maintenance.done`.

### D6 — Dominio

`routes` con `custom_domain: true` para `confia.ing` en `wrangler.jsonc`. Antes se mira qué sirve hoy el dominio y se le muestra al fundador: adjuntarlo sustituye lo que haya.

### D7 — GitHub (ADR-0017)

- Revisión previa: archivos versionados, historial completo, tamaño de binarios, y búsqueda de claves y datos personales (la de L9, repetida).
- `git push -u origin main`, con la orden del fundador.
- `.github/workflows/ci.yml` en `ubuntu-latest`: instala, levanta Supabase local (`supabase start`), instala los navegadores de Playwright y ejecuta la puerta de cierre. Sin secretos; no despliega. Una prueba compara la lista de comandos del workflow con la de `CLAUDE.md`.
- Protección de `main`: exige el workflow. Si el plan no lo permite en repositorio privado, se le dice al fundador.

*Alternativa:* desplegar desde GitHub Actions. Descartada para la v1: obligaría a guardar credenciales de Cloudflare en GitHub; el despliegue sigue siendo manual y deliberado.

### D8 — Documentos y OpenSpec

- `docs/operations.md`: desplegar, volver atrás (`wrangler rollback`), leer y responder consultas, atender una supresión de datos (base y buzón), rotar claves, revisar la tarea diaria, qué mirar si el formulario falla.
- README reescrito para un proyecto en producción; el historial de fases pasa a un apartado breve.
- `/opsx:archive` de los once cambios, en orden, con la aprobación del fundador: `openspec/specs/` pasa a tener las especificaciones vigentes.

### Dependencias

Ninguna nueva en el proyecto. La CI usa acciones oficiales de GitHub.

## Risks / Trade-offs

- **Lanzar con textos legales en borrador.** → Decisión del fundador, anotada; el aviso es visible y las páginas no se indexan.
- **Una migración sobre un proyecto remoto que no conozco por dentro.** → `--dry-run` antes; si ya hubiera tablas con esos nombres, se detiene y se consulta.
- **El dominio ya sirve otra cosa.** → Se comprueba antes y se despliega primero en `workers.dev`.
- **Datos de prueba en producción.** → Marcados y borrados al terminar.
- **La CI tarda** (Docker, tres navegadores). → Aceptado: es la misma puerta que en local.
- **Publicar el repositorio expone la arquitectura.** → No hay secretos; el identificador del proyecto de Supabase es público por diseño y RLS lo cierra.

## Migration Plan

Las tres migraciones del repositorio, en orden, sobre `confiahomeDB`. Vuelta atrás del Worker: `wrangler rollback`. Las tablas nuevas no se borran en una vuelta atrás: quedan vacías y sin acceso público.
