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
- [x] 2.2 **[orden]** `npx supabase db push`. Verificación: sin errores; tres migraciones aplicadas.
- [x] 2.3 Comprobar con la publishable key que ambas tablas no devuelven filas y rechazan inserciones (La base de producción queda como la local). Verificación: resultado anotado aquí.

## 3. Secretos y despliegue (L10-1, L10-3)

- [x] 3.1 **[orden]** El fundador carga los secretos en su terminal con los comandos preparados. Verificación: `wrangler secret list` muestra los nombres esperados.
- [x] 3.2 `npm run release` con el entorno de producción cargado desde `.env.prod` sin mostrarlo. Verificación: comprobación previa y build en verde.
- [x] 3.3 **[orden]** `npx wrangler deploy` a la dirección `workers.dev`. Verificación: `verify-production` en verde contra esa dirección.
- [x] 3.4 **[orden]** Adjuntar `confia.ing` y volver a desplegar. Verificación: `verify-production` en verde contra `https://confia.ing`.
- [x] 3.5 **[orden]** Consulta real de prueba y apertura de la agenda en producción, en ES y EN (Flujo B real; Flujo A real). Verificación: confirmación vista, fila en la base, aviso recibido por el fundador, calendario cargado sin infracciones.
- [x] 3.6 **[orden]** Borrar de producción las filas de prueba (el fundador decidió conservar la fila). Verificación: cuentas antes y después anotadas aquí.
- [ ] 3.7 Comprobar que el disparo diario está programado; al día siguiente, el registro del latido. Verificación: anotado aquí, o dicho que queda pendiente.

## 4. Ajustes en Cloudflare

- [ ] 4.1 Con el fundador, en el panel: widget de Turnstile restringido a `confia.ing`; regla de frecuencia para `/api/events`; revisar que los registros no guardan invocaciones. Verificación: confirmado por el fundador y anotado aquí.

## 5. GitHub (L10-4)

- [x] 5.1 Revisión de lo que se publica: archivos versionados, historial completo, claves y datos personales (repository-and-ci: Lo que se sube). Verificación: resultado anotado aquí.
- [x] 5.2 Pruebas en rojo y `.github/workflows/ci.yml` con la puerta de cierre; prueba que compara sus comandos con los de `CLAUDE.md` (Comprobaciones automáticas en cada cambio). Verificación: `npm test` en verde.
- [x] 5.3 Escribir el ADR-0017. Verificación: enlazado desde README y arquitectura.
- [x] 5.4 **[orden]** `git push -u origin main`. Verificación: `main` en GitHub coincide con el local.
- [x] 5.5 Primera ejecución de la CI en verde; corregir lo que solo falle allí. Verificación: enlace a la ejecución anotado aquí.
- [ ] 5.6 **[orden]** Protección de `main` exigiendo la CI. Verificación: consulta de la protección anotada aquí.

## 6. Cierre de la v1 (L10-5)

- [x] 6.1 `docs/operations.md` y README final (production-release: Vuelta atrás documentada; repository-and-ci: README de un proyecto desplegado). Verificación: enlaces comprobados por una prueba.
- [x] 6.2 Revisión de código del lote con `fullstack-dev-skills:code-reviewer` en un subagente independiente. Verificación: hallazgos y resolución anotados aquí.
- [x] 6.3 Actualizar BACKLOG (L10 ✅ y lo que queda «después de la v1»), `docs/setup.md`, `docs/legal/README.md` y `CLAUDE.md` (estado; con aprobación del fundador). Verificación: enlaces comprobados.
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

`npm test`: 1013 en verde tras la reescritura.

**Migración de producción (2.2, 2.3), con la orden del fundador.** `npx supabase db push --remote --yes` aplicó las tres migraciones a `confiahomeDB`; el simulacro posterior dice «Remote database is up to date». La CLI exige `--yes` para escribir en producción y sin `--remote` apunta a la base local. Comprobado después:

- Con la publishable key: leer e insertar en `contact_requests` y en `analytics_events` responde 401 con el código `42501` (permiso denegado). Sin clave, 401.
- Con la clave del servidor (solo una cuenta, sin leer filas): ambas tablas responden y tienen 0 filas.

**Build de producción (3.2).** `npm run release`: entorno comprobado, Worker de 1186,8 KiB, sin variables incrustadas en ninguno de los tres bloques. El HTML generado lleva la dirección pública y la clave pública real de Turnstile; ni `localhost` ni la clave de pruebas.

Corregido de paso: `release` buscaba la clave pública en los scripts del navegador y está en el HTML (llega al formulario como dato de la página).

**Carga de secretos.** `npm run secrets:put` (`scripts/put-secrets.ts`) pasa los cuatro valores de `.env.prod` a `wrangler secret bulk` por la entrada estándar, sin mostrarlos. Lo ejecuta el fundador.

**Despliegue (3.1, 3.3, 3.4), con la orden del fundador.**

- Primer `npx wrangler deploy`: Worker subido con sus bindings y el disparo diario. La dirección `workers.dev` no respondió: la cuenta no tiene ese subdominio registrado. Con el fundador se decidió ir directo al dominio, que no servía ninguna web.
- El fundador ejecutó `npm run secrets:put`; `wrangler secret list` muestra los cuatro nombres esperados.
- `wrangler.jsonc`: `routes` con `confia.ing` como dominio propio y `workers_dev: false`. Segundo despliegue: versión `8ed8adc8`. `https://confia.ing/es` respondió 200 a los 15 s.
- `npm run verify:site -- https://confia.ing`: **21 de 21 en verde**, incluida la consulta sin verificación antispam, que producción rechaza.
- Carga en Chromium de `/es` y `/en`, sin enviar ni reservar: la agenda carga el Calendly real, el contador de visitas se carga, ninguna cookie de `confia.ing`, ninguna infracción de la política de contenido en nuestro documento. El marco de Turnstile carga (sus mensajes de consola aparecen); no se pudo localizar con un selector, así que **que entregue un token válido lo confirmará la consulta real de prueba**.
- Los archivos estáticos llevan HSTS, `nosniff` y su política.

**Encontrado al verificar.**

- `http://confia.ing` respondía 200 sin redirigir a HTTPS: la zona no tiene activado «Always Use HTTPS». Corregido en el Worker: redirige con 301 cuando Cloudflare indica que el visitante llegó por HTTP (cabecera `cf-visitor`). Un primer intento, que miraba la dirección de la petición, provocaba un bucle en el preview local, que reescribe el host; lo detectó `e2e:preview`. **Pendiente de redesplegar.** Conviene además activar «Always Use HTTPS» en el panel.
- `www.confia.ing` no existe en el DNS. Queda para la v1.1 decidir si redirige al dominio.

**Redespliegue con la redirección.** `http://confia.ing/es` responde 301 a HTTPS conservando ruta y parámetros; `verify:site` 21 de 21.

**Consulta real de prueba (3.5).** El primer aviso del fundador no dejó rastro: 0 filas y ningún `POST /api/contact` en nueve minutos de escucha. Tras su segundo envío, `contact_requests` tiene **1 fila**: 2026-11-16 15:43 UTC, idioma `es`, estado `new`, versión del consentimiento `2026-11-borrador`. Turnstile real, guardado y esquema funcionan de punta a punta. El fundador reservó además una reunión real en la agenda.

No se registraron eventos de analítica de esa visita (ni vista de página ni formulario ni reunión): lo esperable si su navegador envía «No rastrear» o bloquea la petición. Sin confirmar cuál. **Pendiente de confirmar por el fundador:** que el aviso llegó a su buzón.

**Dos mejoras pedidas por el fundador tras ver el sitio.**

- *Título del cierre:* en ordenador se partía en tres líneas («…Hagamos que / la IA trabaje con él»). Era fiel a la maqueta, pero el fundador lo quiere por frases: ahora cada frase es un bloque, y desde 1280 px cada una cabe en su línea. E2E a 375, 768, 1280, 1440 y 1920 px.
- *Modo terminal:* la pregunta abierta compartía fila con su respuesta y solo mostraba un ejemplo fijo. Ahora va encima, a todo el ancho, y los cuatro ejemplos se escriben solos uno tras otro, como en la maqueta; con movimiento reducido queda el primero, fijo. La pregunta ya no se pasa a minúsculas («IA»). Era una omisión mía en L5 respecto a la maqueta.

Desviación de TDD: las pruebas de estas dos mejoras se escribieron antes que el código, pero no las ejecuté en rojo por separado.

**Confirmado por el fundador:** el aviso de la consulta llegó a su buzón. Decidió **conservar** la fila de prueba («J Inc») como primera consulta de la tabla.

**Arreglos desplegados.** `npm run release` + `wrangler deploy`; `verify:site` 21 de 21. Puerta local antes de subir: `test` 1028 · `e2e` 369 (23 omitidas) · `e2e:preview` 31.

**Pasa a la v1.1** (lista en BACKLOG): tareas 4.1, 5.6 y 6.4, y la reescritura completa del README de 6.1 (hoy solo se actualizó su estado). La 3.7 se comprueba al día siguiente: registro `maintenance.done` tras las 08:17 UTC.

**GitHub y CI (5.4, 5.5).** Primer `git push` con la orden del fundador: 18 commits, sin claves ni direcciones personales. Primera CI: contrato y E2E contra Workers en verde; calidad y E2E en rojo por dos diferencias reales con Linux:

- La fuente de respaldo de los títulos solo nombraba Times New Roman, que no existe en Linux: CLS de 0,111 al cargar las fuentes. Añadidas Liberation Serif, Tinos y Nimbus Roman.
- La prueba de la imagen para redes comparaba bytes; ahora compara píxeles.

Segunda CI (commit `98fcb70`): **los cuatro trabajos en verde.**

**Dos fallos en producción, encontrados el 2026-11-16 tras el lanzamiento.**

1. *Página rota al recargar* (lo vio el fundador: sin estilos ni scripts). Una respuesta 304 «no modificado» llevaba la política de contenido de lo que no es HTML (`default-src 'none'`), y el navegador la aplica a la página guardada. Fallo mío en `worker/index.ts` desde L9; las pruebas no recargaban. Corregido: un 304 no lleva política. Pruebas nuevas: unitaria, y dos contra Workers (recargar dos veces y petición condicional).
2. *Errores 500 intermitentes* en `/es` y `/en` (entre 2 y 4 de cada 16 peticiones). Registro del Worker: «This promise was created by a request that has since ended…». Las páginas se volvían a renderizar en cada visita (`x-nextjs-cache: MISS`, hasta 467 ms de CPU) y el render simultáneo comparte trabajo entre peticiones, que el runtime ya no permite. **No se reproduce en local** ni con 80 peticiones a 16 simultáneas. Corregido en `open-next.config.ts` con la caché de páginas prerenderizadas de OpenNext (`staticAssetsIncrementalCache`): en local las cuatro páginas pasan a `HIT`.

De paso: `Permissions-Policy` nombraba `browsing-topics`, que Chrome no reconoce.

Local con ambos arreglos: `test` 1031 · `e2e:preview` 35.

**Desplegado con la orden del fundador y medido en producción.**

- `/es` 40 de 40 en 200, `/en` 30 de 30, las cuatro legales 16 de 16 (antes: entre 2 y 4 errores 500 de cada 16).
- `x-nextjs-cache: HIT`: las páginas ya no se renderizan por visita.
- La petición condicional responde 304 **sin** política de contenido.
- `verify:site`: 21 de 21.
- En Chromium y WebKit reales: carga y dos recargas con estilos, fuentes y página activa.

Estado: sitio en vivo en `https://confia.ing`, sin fallos conocidos. Falta redesplegar con la redirección, la consulta real de prueba y la subida a GitHub.

## Workflow follow-up

- Tras la revisión legal: datos del responsable, `LEGAL_STATUS = "in-force"`, nuevo despliegue.
- Al día siguiente del lanzamiento: comprobar el registro de la tarea diaria.

### Para reanudar (pausa del 2026-11-16, cambio de modelo)

Todo está en commits y subido a GitHub salvo esta nota. Sin procesos abiertos; `.dev.vars` en `SERVICES=memory`.

- **Producción:** `https://confia.ing` en vivo, sin fallos conocidos. Desplegar siempre con `npm run release` + `npx wrangler deploy`, con la orden del fundador, y verificar con `npm run verify:site -- https://confia.ing`.
- **Por comprobar:** la CI del último push (`gh run list --limit 1`), y mañana tras las 08:17 UTC el registro `maintenance.done` de la tarea diaria (tarea 3.7).
- **Pendiente del fundador:** activar «Always Use HTTPS» en Cloudflare; datos del responsable y revisión legal; borrar la copia `../confiahome-historial-previo-20261116.bundle` (contiene un correo personal; no subirla).
- **v1.1:** lista en BACKLOG, «Después de la v1».
- **Sin verificar:** salto de diseño al cargar fuentes en Android; lectores de pantalla; Safari y Firefox reales.
