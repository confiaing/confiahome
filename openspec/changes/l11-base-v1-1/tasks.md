# Tareas — L11 Base de la v1.1

## 1. Pruebas primero

- [ ] 1.1 Añadir `yaml` como dependencia de desarrollo. Escribir `tests/unit/development-workflow.test.ts` con los escenarios U de `development-workflow`:
  - sin cambios de la v1 abiertos;
  - capacidades vigentes presentes;
  - revisión local exigida y estado de la v1.1 en `CLAUDE.md`;
  - skill presente;
  - reglas legibles y plan vigente en `config.yaml`.

  Verificación: la prueba falla en rojo por las razones esperadas.

## 2. Reconciliación

- [ ] 2.1 Escribir los deltas R1 a R11 del diseño en `specs/<capacidad>/spec.md` de este cambio, con el texto completo de cada exigencia modificada. Verificación: `openspec validate l11-base-v1-1 --strict` en verde.
- [ ] 2.2 Contrastar con el código las ~110 exigencias que la revisión previa no cubrió: L1, L4, L7 instrumentación, L8 SEO y L9 mantenimiento y calidad. Lo nuevo se añade como delta y se presenta al fundador. Verificación: tabla anotada aquí.
- [ ] 2.3 Probar el archivo en una copia del repositorio: L0 a L10 y después L11. Comprobar que `legal-pages` y los deltas de L11 se aplican sin error. Verificación: salida anotada aquí.

## 3. Cierre de L10 y archivo

- [ ] 3.1 En `l10-lanzamiento/tasks.md`:
  - 6.5 marcada con su evidencia (envío y CI en verde);
  - 4.1 pasa a «Trasladada a L13» y 5.6 a «Trasladada a L12», sin casilla;
  - 6.4 se marca al archivar.

  Verificación: diff revisado.
- [ ] 3.2 Archivar L0 a L9 en orden con `openspec archive <cambio> -y`. Verificación: `openspec list` sin esos cambios y `openspec/specs/` con sus capacidades.
- [ ] 3.3 Después de las 08:17 UTC del 17 de noviembre, comprobar en los registros del Worker el evento `maintenance.done` (tarea 3.7 de L10) y archivar L10. Si no aparece, diagnosticar antes de archivar. Verificación: registro anotado aquí.

## 4. Guía, configuración y skill

- [ ] 4.1 Con el permiso del fundador:
  - descargar con `curl` desde `davila7/claude-code-templates` los archivos de `cli-tool/components/skills/development/code-reviewer`;
  - leerlos;
  - copiarlos a `.claude/skills/code-reviewer/`.

  Verificación: revisión del contenido anotada aquí y prueba del skill en verde.
- [ ] 4.2 Actualizar `CLAUDE.md`:
  - estado de la v1.1 y lotes L11 a L16;
  - rama y pull request desde L12;
  - revisión local según la respuesta del fundador a la pregunta 2 de la propuesta;
  - skills de revisión corregidos;
  - regla roja de `push` sin «la v1 se sube completa al final».

  Verificación: pruebas de la guía en verde.
- [ ] 4.3 Corregir `openspec/config.yaml`:
  - poner entre comillas la regla de specs con «: »;
  - contexto con lotes hasta L16 y ADR hasta 0017;
  - quitar «la v1 se sube completa al final».

  Verificación: prueba en verde y `openspec instructions specs --change l11-base-v1-1` sin avisos (M).
- [ ] 4.4 README: quitar la nota «Se corrige en la v1.1» de la tabla de skills, que ya estará corregida. Verificación: diff revisado.

## 5. Cierre

- [ ] 5.1 Revisión de código en local según D1 y corrección de los hallazgos. Verificación: hallazgos y resolución anotados aquí.
- [ ] 5.2 Puerta de cierre: `lint`, `typecheck`, `test`, `e2e`, `e2e:preview`, `build:worker`, `measure:js`. Verificación: salida a la vista.
- [ ] 5.3 BACKLOG: L11 marcado como hecho. Archivar L11. Verificación: `openspec list` sin cambios abiertos.
- [ ] 5.4 Commit local. El `push`, solo con la orden del fundador.
