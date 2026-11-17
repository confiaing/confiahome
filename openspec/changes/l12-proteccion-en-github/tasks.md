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
- [ ] 4.3 BACKLOG (L12 ✅), archivo del cambio en OpenSpec y commit, todo en la rama: con `main` protegida, el archivo no puede ir después en un push a `main`. **[orden]** Push de la rama y pull request. Verificación: CI del pull request en verde, con enlace.
- [ ] 4.4 **[orden]** Aplicar la protección con `gh api`. Verificación: la consulta de la protección muestra los cuatro trabajos, el pull request obligatorio y la rama al día.
- [ ] 4.5 Probar la protección: un push directo a `main` se rechaza, también para el fundador. Verificación: mensaje de rechazo anotado.
- [ ] 4.6 **[orden]** Fundir el pull request de L12, que ya lleva el cambio archivado. Verificación: `main` contiene L12 y `openspec list` sin L12.
- [ ] 4.7 **[orden]** Lanzar a demanda `verify-production.yml` y `audit.yml`. Verificación: enlaces a las ejecuciones; hallazgos de la auditoría corregidos o aceptados.
