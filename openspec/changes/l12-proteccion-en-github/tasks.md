# Tareas — L12 Protección en GitHub

Empieza cuando L11 esté archivado (mañana, tras la tarea 3.3 de L11).

## 1. Rama y pruebas primero

- [ ] 1.1 Crear la rama `lote/l12-proteccion-en-github` desde `main`. Verificación: `git branch --show-current`.
- [ ] 1.2 Escribir `tests/unit/github-automation.test.ts` con los escenarios U de «Vigilancia diaria de producción» y «Dependencias vigiladas», y la coherencia entre `branch-protection.json` y `ci.yml`. Verificación: en rojo por la ausencia de los archivos.

## 2. Automatización

- [ ] 2.1 `.github/workflows/verify-production.yml` (diseño, decisión 3). Verificación: pruebas en verde.
- [ ] 2.2 `.github/dependabot.yml` y `.github/workflows/audit.yml` (decisión 4). Verificación: pruebas en verde.
- [ ] 2.3 `.github/branch-protection.json` con `enforce_admins` según la decisión del fundador. Verificación: pruebas en verde.

## 3. Documentación

- [ ] 3.1 `docs/operations.md`:
  - qué hacer si falla la vigilancia diaria;
  - la suspensión de los workflows tras 60 días sin actividad;
  - cómo revisar los pull requests de Dependabot;
  - cómo consultar, aplicar y suspender la protección.

  Verificación: enlaces comprobados.
- [ ] 3.2 README y `CLAUDE.md`: flujo de rama `lote/<nombre>`, pull request, CI en verde y fusión. `/code-review` antes del push de la rama. ADR-0017: pendientes actualizados. Verificación: pruebas de la guía en verde.

## 4. Cierre por pull request

- [ ] 4.1 `/code-review medium`, porque el lote toca CI. `aitmpl-code-reviewer` revisa el lote en un subagente. Corregir los hallazgos. Verificación: hallazgos y resolución anotados aquí.
- [ ] 4.2 Puerta de cierre completa. Verificación: salida a la vista.
- [ ] 4.3 BACKLOG (L12 ✅) y commit en la rama. **[orden]** Push de la rama y pull request. Verificación: CI del pull request en verde, con enlace.
- [ ] 4.4 **[orden]** Aplicar la protección con `gh api`. Verificación: la consulta de la protección muestra los cuatro trabajos, el pull request obligatorio y la rama al día.
- [ ] 4.5 Probar la protección: un push directo a `main` se rechaza (si aplica a administradores). Verificación: mensaje de rechazo anotado.
- [ ] 4.6 **[orden]** Fundir el pull request de L12 y archivar el cambio en `main`. Verificación: `main` contiene L12 y `openspec list` sin L12.
- [ ] 4.7 **[orden]** Lanzar a demanda `verify-production.yml` y `audit.yml`. Verificación: enlaces a las ejecuciones; hallazgos de la auditoría corregidos o aceptados.
