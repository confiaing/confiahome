# Tasks

Las tareas marcadas **[orden]** ejecutan algo fuera de esta máquina: cada una muestra antes qué hará y espera la orden expresa del fundador. Entre paréntesis, la spec y el requisito.

## 1. Preparación (sin efectos externos)

- [x] 1.1 Recoger las decisiones del fundador: textos legales en borrador o esperar; repositorio público o privado; HSTS con subdominios. Verificación: anotadas aquí.
- [x] 1.2 Comprobar insumos sin mostrar valores: sesiones de `wrangler` y de Supabase; que `.env.prod` define cada variable necesaria (solo nombres); dirección de aviso verificada; qué sirve hoy `confia.ing`. Verificación: lista anotada aquí.
- [x] 1.3 Pruebas unitarias en rojo e implementación de `scripts/lib/release.ts` y `scripts/release.ts`; `npm run release:check` y `npm run release` (production-release: Comprobación previa del build). Verificación: `npm test` en verde.
- [x] 1.4 Pruebas en rojo e implementación de `scripts/verify-production.ts`, probado contra `preview` local (Verificación tras el despliegue: Páginas y cabeceras; Antispam real). Verificación: `npm test` y ejecución contra `preview` en verde.
- [x] 1.5 `wrangler.jsonc`: solo las variables no secretas; pruebas de configuración actualizadas (el destinatario y la base van como secretos, y el dominio se declara en 3.4: ver «Cambios respecto al diseño»). Verificación: `npm test` y `npm run build:worker` en verde.
- [x] 1.6 Puerta de cierre completa antes de tocar producción. Verificación: todo en verde; cifras anotadas aquí.

## 2. Base de datos de producción (L10-2)

- [x] 2.1 **[orden]** `npx supabase db push --dry-run` contra `confiahomeDB`. Verificación: salida mostrada al fundador; si hay tablas inesperadas, se detiene.
- [ ] 2.2 **[orden]** `npx supabase db push`. Verificación: sin errores; tres migraciones aplicadas.
- [ ] 2.3 Comprobar con la publishable key que ambas tablas no devuelven filas y rechazan inserciones (La base de producción queda como la local). Verificación: resultado anotado aquí.

## 3. Secretos y despliegue (L10-1, L10-3)

- [ ] 3.1 **[orden]** El fundador carga los secretos en su terminal con los comandos preparados. Verificación: `wrangler secret list` muestra los nombres esperados.
- [ ] 3.2 `npm run release` con el entorno de producción cargado desde `.env.prod` sin mostrarlo. Verificación: comprobación previa y build en verde.
- [ ] 3.3 **[orden]** `npx wrangler deploy` a la dirección `workers.dev`. Verificación: `verify-production` en verde contra esa dirección.
- [ ] 3.4 **[orden]** Adjuntar `confia.ing` y volver a desplegar. Verificación: `verify-production` en verde contra `https://confia.ing`.
- [ ] 3.5 **[orden]** Consulta real de prueba y apertura de la agenda en producción, en ES y EN (Flujo B real; Flujo A real). Verificación: confirmación vista, fila en la base, aviso recibido por el fundador, calendario cargado sin infracciones.
- [ ] 3.6 **[orden]** Borrar de producción las filas de prueba. Verificación: cuentas antes y después anotadas aquí.
- [ ] 3.7 Comprobar que el disparo diario está programado; al día siguiente, el registro del latido. Verificación: anotado aquí, o dicho que queda pendiente.

## 4. Ajustes en Cloudflare

- [ ] 4.1 Con el fundador, en el panel: widget de Turnstile restringido a `confia.ing`; regla de frecuencia para `/api/events`; revisar que los registros no guardan invocaciones. Verificación: confirmado por el fundador y anotado aquí.

## 5. GitHub (L10-4)

- [x] 5.1 Revisión de lo que se publica: archivos versionados, historial completo, claves y datos personales (repository-and-ci: Lo que se sube). Verificación: resultado anotado aquí.
- [x] 5.2 Pruebas en rojo y `.github/workflows/ci.yml` con la puerta de cierre; prueba que compara sus comandos con los de `CLAUDE.md` (Comprobaciones automáticas en cada cambio). Verificación: `npm test` en verde.
- [x] 5.3 Escribir el ADR-0017. Verificación: enlazado desde README y arquitectura.
- [ ] 5.4 **[orden]** `git push -u origin main`. Verificación: `main` en GitHub coincide con el local.
- [ ] 5.5 Primera ejecución de la CI en verde; corregir lo que solo falle allí. Verificación: enlace a la ejecución anotado aquí.
- [ ] 5.6 **[orden]** Protección de `main` exigiendo la CI. Verificación: consulta de la protección anotada aquí.

## 6. Cierre de la v1 (L10-5)

- [ ] 6.1 `docs/operations.md` y README final (production-release: Vuelta atrás documentada; repository-and-ci: README de un proyecto desplegado). Verificación: enlaces comprobados por una prueba.
- [ ] 6.2 Revisión de código del lote con `fullstack-dev-skills:code-reviewer` en un subagente independiente. Verificación: hallazgos y resolución anotados aquí.
- [ ] 6.3 Actualizar BACKLOG (L10 ✅ y lo que queda «después de la v1»), `docs/setup.md`, `docs/legal/README.md` y `CLAUDE.md` (estado; con aprobación del fundador). Verificación: enlaces comprobados.
- [ ] 6.4 **[orden]** Archivar los once cambios de OpenSpec, en orden. Verificación: `openspec/specs/` contiene las especificaciones vigentes y `openspec list` no muestra cambios abiertos.
- [ ] 6.5 Commit final y, con **[orden]**, envío a GitHub. Verificación: CI en verde sobre el último commit.

## Evidencia

### Preparación (tarea 1), 2026-11-14

**Decisiones del fundador (1.1).** Aprobó la propuesta al responder a sus preguntas:

- Se lanza con los textos legales **en borrador**: con aviso, sin indexar y con los datos del responsable pendientes.
- El repositorio será **público** en esta etapa; pasará a privado al terminar la v1 o la v2.
- Todo `confia.ing`, con sus subdominios, va por HTTPS: HSTS pasa a `max-age=31536000; includeSubDomains`, sin precarga.

**Insumos (1.2), comprobados sin mostrar valores.**

| Insumo | Estado |
|---|---|
| Sesión de `wrangler` | Iniciada, con permisos de Workers, rutas, Email Routing y Turnstile |
| Sesión de la CLI de Supabase | Iniciada; proyecto `confiahomeDB` enlazado y activo |
| Dominio `confia.ing` | DNS en Cloudflare; correo con Email Routing; **no sirve ninguna web hoy** (sin registro A, sin respuesta por HTTPS): adjuntarlo no sustituye nada |
| `.env.prod` → dirección pública, calendario, Supabase, remitente | Definidos |
| `.env.prod` → claves de Turnstile | **Son las claves oficiales de prueba.** Faltan las del widget real |
| `.env.prod` → `NOTIFY_TO` | **Vacía.** Falta la dirección de aviso verificada |
| `.env.prod` → token de Web Analytics | Vacío (opcional) |

`npm run release:check` falla hoy exactamente por las dos claves de prueba y por `NOTIFY_TO`: **el lote queda detenido aquí hasta tenerlas.**

**Hecho (1.3 a 1.6).**

- `npm run release:check` y `npm run release` (`scripts/release.ts`, `scripts/lib/release.ts`): leen `.env.prod` sin mostrarlo, comprueban el entorno y el estado legal, y al build solo le pasan las variables públicas.
- `npm run verify:site -- <dirección>` (`scripts/lib/verify-site.ts`): 21 comprobaciones de solo lectura. Contra el preview local falla en las cuatro que solo producción cumple (dirección pública en `robots`, `sitemap` y `llms.txt`, y rechazo de una consulta sin antispam), que es lo esperado.
- `wrangler.jsonc`: solo `SERVICES` y `NOTIFY_FROM` como variables.
- Puerta de cierre: `lint` y `typecheck` sin errores · `test` 996 · `test:contract` 52 · `e2e` 355 (23 omitidas) · `e2e:preview` 31 (1 omitida) · `build:worker` 1186,7 KiB de 3072 · `measure:js` 164,3 kB de 200.

**Cambios respecto al diseño.**

- `SUPABASE_URL` y `NOTIFY_TO` se cargan con `wrangler secret put`, no como variables de `wrangler.jsonc`: el preview local lee ese archivo y no debe poder apuntar a la base de producción, y la dirección de aviso es un buzón personal que no debe publicarse. Por lo mismo no se fija `destination_address` en el binding de correo.
- El dominio se declara en `wrangler.jsonc` en la tarea 3.4, no antes.

### 2026-11-16

**Decisiones del fundador.** Recorte a la v1.1: despliegue continuo desde GitHub, protección de `main`, revisión automática por PR, archivo de OpenSpec, reescritura del README y regla de frecuencia en Cloudflare (tareas 4.1, 5.6, 6.4 y parte de 6.1). Historial: reescribirlo para retirar una dirección personal.

**`.env.prod` (1.2).** `npm run release:check` pasa: claves reales de Turnstile, dirección de aviso y token de Web Analytics presentes.

**Revisión del delta (5.1, 6.2).** Agente independiente con `security-audit` y revisión de calidad sobre lo cambiado desde la auditoría de L9:

- *Media-alta, corregido.* Una dirección personal `@gmail.com` (el buzón de reenvío) estaba en el README desde el commit de L0. Mi búsqueda de L9 solo miraba otra dirección y no la vio. Retirada del archivo y del historial: reescritura de los 13 commits con `git filter-branch`, copia de seguridad previa en `../confiahome-historial-previo-20261116.bundle` (fuera del repositorio; contiene la dirección: no publicarla). En `main` quedan cero coincidencias fuera de los datos de ejemplo de las pruebas. Los identificadores de los commits cambiaron.
- *Bajas, corregidas:* comentario al final de línea en `.env.prod` tomado como parte del valor; `verify:site` no exigía `includeSubDomains`; nombres de archivo desalineados en estos documentos.
- *Baja, aceptada:* el identificador del proyecto de Supabase aparece en la documentación; no es un secreto.
- Sin hallazgos en `release.ts` (no imprime ni pasa secretos), `verify-site.ts` (no crea datos) ni `wrangler.jsonc`.

**CI (5.2, 5.3).** `.github/workflows/ci.yml` con cuatro trabajos (calidad, contrato, E2E, E2E contra Workers), sin secretos ni despliegue; `tests/unit/ci-workflow.test.ts` lo ata a la puerta de cierre de `CLAUDE.md`; ADR-0017 con el despliegue continuo diseñado para la v1.1; `docs/operations.md`. Escritos por un agente y revisados. **La CI no se ha ejecutado todavía:** lo hará al subir.

**Simulacro de migración (2.1).** `npx supabase db push --remote --dry-run` contra `confiahomeDB`: aplicaría exactamente las tres migraciones del repositorio (`20261114170000`, `20261114210000`, `20261115040000`); ninguna está aplicada. No se aplicó nada. Sin la opción `--remote` el comando apunta a la base local.

`npm test`: 1013 en verde tras la reescritura. Nada se ha subido ni desplegado.

## Workflow follow-up

- Tras la revisión legal: datos del responsable, `LEGAL_STATUS = "in-force"`, nuevo despliegue.
- Al día siguiente del lanzamiento: comprobar el registro de la tarea diaria.
