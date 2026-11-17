# Tareas — L12 Protección en GitHub

Propuesta aprobada por el fundador el 2026-11-16. Empieza cuando L11 esté archivado (mañana, tras la tarea 3.3 de L11).

## 1. Rama y pruebas primero

- [x] 1.1 Crear la rama `lote/l12-proteccion-en-github` desde `main`. Verificación: `git branch --show-current`.
- [x] 1.2 Escribir `tests/unit/github-automation.test.ts` con los escenarios U de «Vigilancia diaria de producción» y «Dependencias vigiladas», y la coherencia entre `branch-protection.json` y `ci.yml`. Verificación: en rojo por la ausencia de los archivos.

## 2. Automatización

- [x] 2.1 `.github/workflows/verify-production.yml` (diseño, decisión 3). Verificación: pruebas en verde.
- [x] 2.2 `.github/dependabot.yml` y `.github/workflows/audit.yml` (decisión 4). Verificación: pruebas en verde.
- [x] 2.3 `.github/branch-protection.json` con `enforce_admins: true` (decisión del fundador). Verificación: pruebas en verde.

## 3. Documentación

- [x] 3.1 `docs/operations.md`:
  - qué hacer si falla la vigilancia diaria;
  - la suspensión de los workflows tras 60 días sin actividad;
  - cómo revisar los pull requests de Dependabot;
  - cómo consultar, aplicar y suspender la protección.

  Verificación: enlaces comprobados.
- [x] 3.2 README y `CLAUDE.md`: flujo de rama `lote/<nombre>`, pull request, CI en verde y fusión. `/code-review` antes del push de la rama. ADR-0017: pendientes actualizados. Verificación: pruebas de la guía en verde.

## 4. Cierre por pull request

- [x] 4.1 `/code-review high`, porque el lote toca CI (tabla de riesgo de CLAUDE.md; la propuesta decía `medium`). `aitmpl-code-reviewer` revisa el lote en un subagente. Corregir los hallazgos. Verificación: hallazgos y resolución anotados aquí.

  *Hecho, 2026-11-17.*
  - **`/code-review high`:** seis hallazgos, los seis corregidos.
    1. La 4.6 archivaba en `main` después de fundir, cosa imposible con la protección: el archivo va ahora en la rama (4.3).
    2. El grupo de Dependabot sin `patterns`: añadido `"*"`.
    3. El ADR-0017 decía que el workflow ejecuta `npm run`; ahora dice que llama a `node`, y que la protección se aplica antes de fundir.
    4. La lista de textos prohibidos estaba duplicada en dos pruebas: ahora vive en `tests/unit/helpers/workflow-rules.ts`, con `opennextjs-cloudflare deploy` añadido.
    5. Esta tarea pedía `medium`.
    6. Quién recibe el aviso de un workflow programado: la cuenta que tocó su `cron` por última vez.
  - **`aitmpl-code-reviewer` (high, subagente):** aprobar con comentarios.
    - (Media, confirmada) La vigilancia no detecta Supabase pausado ni un secreto caducado: la consulta sin token se rechaza en Turnstile (`submit-contact.ts:55`) antes de `repository.save`. Corregido en `operations.md`, `design.md` y ADR-0017, que ahora lo dicen. Detectarlo queda como pendiente del ADR, a decidir por el fundador.
    - (Baja) Dos aserciones de `development-workflow.test.ts` ya pasaban con el texto anterior: ahora buscan frases concretas.
    - (Menor) «Una hora después» eran 1 h 20 min: texto corregido.
  - **Lint en la puerta:** 8 `any` en la prueba nueva. Tipada con tipos propios.
- [x] 4.2 Puerta de cierre completa. Verificación: salida a la vista.

  *Hecho, 2026-11-17, tras las correcciones de la revisión.* `lint` 0 · `typecheck` 0 · `test` 1104 de 1104 (60 archivos) · `e2e` 371 en verde (23 omitidas, las de siempre) · `e2e:preview` 35 en verde · `build:worker` 1190,0 KiB de 3072 · `measure:js` 164,6 kB de 200. La primera pasada falló en `lint` (8 `any` en la prueba nueva), y se corrigió antes de esta.

  **Orden de cierre, ajustado en la revisión:** commit en la rama → **[orden]** push y pull request → 4.4 y 4.5 → archivo del cambio y BACKLOG en la misma rama → **[orden]** fusión. La evidencia de la 4.7, posterior a la fusión, se anota en el lote siguiente.
- [x] 4.3 BACKLOG (L12 ✅), archivo del cambio en OpenSpec y commit, todo en la rama: con `main` protegida, el archivo no puede ir después en un push a `main`. **[orden]** Push de la rama y pull request. Verificación: CI del pull request en verde, con enlace.

  *Hecho en dos pull requests, 2026-11-17.* [confiaing/confiahome#1](https://github.com/confiaing/confiahome/pull/1), con el lote: CI en verde (`quality`, `contract`, `e2e`, `e2e-preview`). El fundador lo fundió (`4c2d5c7`) antes de las tareas 4.4 y 4.5, así que el archivo y el BACKLOG van en un segundo pull request desde `lote/l12-cierre`, el primero que pasa por la protección.
- [x] 4.4 **[orden]** Aplicar la protección con `gh api`. Verificación: la consulta de la protección muestra los cuatro trabajos, el pull request obligatorio y la rama al día.

  *Hecho, 2026-11-17, con la orden del fundador.* `gh api -X PUT …/branches/main/protection --input .github/branch-protection.json`. Consulta: `strict: true`, contextos `quality`, `contract`, `e2e`, `e2e-preview`, 0 aprobaciones (pull request obligatorio), `enforce_admins: true`, `allow_force_pushes: false`, `allow_deletions: false`.
- [x] 4.5 Probar la protección: un push directo a `main` se rechaza, también para el fundador. Verificación: mensaje de rechazo anotado.

  *Hecho, 2026-11-17.* Commit vacío empujado a `main` con la cuenta del fundador (administradora): `remote: error: GH006: Protected branch update failed for refs/heads/main. Changes must be made through a pull request. 4 of 4 required status checks are expected. ! [remote rejected] main -> main (protected branch hook declined)`. El commit se descartó en local; `main` sigue en `4c2d5c7` en local y en GitHub.
- [x] 4.6 **[orden]** Fundir el pull request de L12, que ya lleva el cambio archivado. Verificación: `main` contiene L12 y `openspec list` sin L12.

  *Hecho en dos pasos.* El fundador fundió el PR #1 el 2026-11-17 a las 22:15 UTC (`4c2d5c7`). Este cambio se archiva en el pull request de cierre: `openspec list` sin L12 en la rama `lote/l12-cierre`.
- [x] 4.7 **[orden]** Lanzar a demanda `verify-production.yml` y `audit.yml`. Verificación: enlaces a las ejecuciones; hallazgos de la auditoría corregidos o aceptados.

  *Hecho, 2026-11-17, con la orden del fundador.*
  - **Vigilancia:** [ejecución 44188538700](https://github.com/confiaing/confiahome/actions/runs/44188538700), en verde, 21 de 21 comprobaciones.
  - **Auditoría:** [ejecución 44188545207](https://github.com/confiaing/confiahome/actions/runs/44188545207), en rojo: 22 vulnerabilidades (7 moderadas, 15 altas), **todas en dependencias de desarrollo**. El origen de las altas es `picomatch` ≤ 4.0.7 (ReDoS), que no tiene versión corregida publicada (4.0.7 es la última), vía Vitest, Vite, ESLint y el build de OpenNext. `npm audit fix --force` proponía bajar Vitest, OpenNext y el plugin de Next. Las dependencias de producción dan 0 (`npm audit --omit=dev --audit-level=high` en local).
  - **Decisión del fundador:** auditar solo producción. `audit.yml` pasa a `npm audit --omit=dev --audit-level=high`, con su prueba (en rojo antes del cambio), `design.md`, la spec del cambio y `docs/operations.md`. Las de desarrollo, aceptadas: las cubre Dependabot. La primera ejecución con la nueva orden se lanzará tras fundir el pull request de cierre.

## 5. Añadido por el fundador

- [x] 5.1 Documentar el entorno de desarrollo local y cómo apagar Docker al cerrar un lote o una versión (pedido el 2026-11-17, con el pull request abierto). Verificación: `docs/development.md` enlazado desde README, CLAUDE.md y `setup.md`; comandos comprobados contra la CLI instalada (`supabase stop --help`: `--no-backup` borra los volúmenes; `docker ps --filter name=confia.ing-home` lista los 12 contenedores del proyecto).

## Revisión del cierre

`/code-review high` sobre el pull request de cierre (`lote/l12-cierre`). Tres hallazgos:

- **(Baja, pendiente)** El escenario M «Un pull request en rojo no se funde» no tiene evidencia propia. La protección exige los cuatro trabajos (tarea 4.4), pero ningún pull request en rojo se ha intentado fundir aún. Se anota con el primero que llegue en rojo, sea un pull request de Dependabot o de L13.
- **(Baja, pendiente)** El escenario «Un fallo se ve» de la spec vigente dice que GitHub avisa «a quien tenga activadas las notificaciones de Actions». En un workflow programado, el aviso va a quien modificó el `cron` por última vez, como ya dice `docs/operations.md`. Las specs no se editan a mano: se corrige en el próximo cambio que toque `production-release`, como pronto L13.
- **(Menor, corregido)** La columna «Quién» de L12 en el BACKLOG seguía con el texto del plan.

