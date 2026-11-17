# Tareas — L11 Base de la v1.1

## 1. Pruebas primero

- [x] 1.1 Añadir `yaml` como dependencia de desarrollo. Escribir `tests/unit/development-workflow.test.ts` con los escenarios U de `development-workflow`:
  - sin cambios de la v1 abiertos;
  - capacidades vigentes presentes;
  - revisión local exigida y estado de la v1.1 en `CLAUDE.md`;
  - skill presente;
  - reglas legibles y plan vigente en `config.yaml`.

  Verificación: la prueba falla en rojo por las razones esperadas.

  *Hecho:* `yaml` 2.9.1 en `devDependencies`. 38 pruebas en `tests/unit/development-workflow.test.ts`: 34 en rojo antes de implementar, por la ausencia de specs archivadas, del skill y de la configuración al día. Pasaban 4: la revisión local en `CLAUDE.md` (escrita al decidir D1) y las reglas de `proposal`, `design` y `tasks`, que ya eran textos.

## 2. Reconciliación

- [x] 2.1 Escribir los deltas R1 a R11 del diseño en `specs/<capacidad>/spec.md` de este cambio, con el texto completo de cada exigencia modificada. Verificación: `openspec validate l11-base-v1-1 --strict` en verde.

  *Hecho:* Deltas en 9 capacidades: MODIFIED (security-headers ×2, contact-form, home-page, app-shell, legal-pages, site-navigation, repository-and-ci, production-release), REMOVED (legal-pages «Aviso de borrador», locale-routing «Metadatos por idioma»). R8 sin delta: queda la de `scheduling` y R7 la remite. `openspec validate l11-base-v1-1 --strict` en verde. Primer intento rechazado al probar el archivo: renombrar un escenario cuenta como perderlo; se devolvió su nombre a «Datos de prueba retirados (M)». La exigencia del formulario se acortó por debajo de 500 caracteres.

- [x] 2.2 Contrastar con el código las ~110 exigencias que la revisión previa no cubrió: L1, L4, L7 instrumentación, L8 SEO y L9 mantenimiento y calidad. Lo nuevo se añade como delta y se presenta al fundador. Verificación: tabla anotada aquí.

  *Hecho:* un subagente contrastó ~139 exigencias de L0 a L9 (revisión estática: no ejecutó pruebas). Tres contradicciones y dos exigencias obsoletas: R12 a R16 en `design.md`, ya como deltas. Para R14 se eligió describir lo que hay (la 404 con marco propio) en lugar de cambiar la 404, porque L11 no toca `src/`. Sin contrastar: escenarios E y M de navegador y medidas, y los C contra Supabase. **R1 a R16 aprobados por el fundador el 2026-11-16.** Segunda prueba de archivo en una copia: L10 (24 de 25 tareas) y L11 se archivan sin error; L11 aplica + 5, ~ 15, − 3; `openspec validate --specs --strict` 29 de 29.
- [x] 2.3 Probar el archivo en una copia del repositorio: L0 a L10 y después L11. Comprobar que `legal-pages` y los deltas de L11 se aplican sin error. Verificación: salida anotada aquí.

  *Hecho:* Copia en el scratchpad: archivo de L0 a L11 en orden sin errores; L11 aplica + 4, ~ 9, − 2. `openspec validate --specs --strict`: 29 de 29. Límite visto: OpenSpec no actualiza el `## Purpose` de una spec existente desde un delta; `legal-pages` conserva el de L2, más estrecho. Se acepta: el propósito no es exigible.

## 3. Cierre de L10 y archivo

- [x] 3.1 En `l10-lanzamiento/tasks.md`:
  - 6.5 marcada con su evidencia (envío y CI en verde);
  - 4.1 pasa a «Trasladada a L13» y 5.6 a «Trasladada a L12», sin casilla;
  - 6.4 se marca al archivar.

  Verificación: diff revisado.

  *Hecho:* 4.1 y 5.6 pasan a nota «Trasladada a L13 / L12, no hecha en L10», sin casilla; 6.4 trasladada a L11; 6.5 marcada con la ejecución de CI 43904896392. L10 queda en 24/25: falta 3.7.

- [x] 3.2 Archivar L0 a L9 en orden con `openspec archive <cambio> -y`. Verificación: `openspec list` sin esos cambios y `openspec/specs/` con sus capacidades.

  *Hecho:* L0 a L9 archivados en `openspec/changes/archive/2026-11-16-*`. `openspec/specs/`: 26 capacidades, `openspec validate --specs --strict` 26 de 26.

- [x] 3.3 Después de las 08:17 UTC del 17 de noviembre, comprobar en los registros del Worker el evento `maintenance.done` (tarea 3.7 de L10) y archivar L10. Si no aparece, diagnosticar antes de archivar. Verificación: registro anotado aquí.

  *Hecho:* Evento `maintenance.done` en los registros del Worker `confiahome` (panel de Cloudflare → Observability), 2026-11-17 08:17:55 UTC, disparo `17 8 * * *`, versión `0b5a97dd`: `heartbeat: true`, `contactsPurged: 0`, `eventsPurged: 0`, nivel `info`, sin errores en 24 h. Anotado también en la 3.7 de L10, que queda en 25 de 25. L10 archivado con `openspec archive l10-lanzamiento -y`.

## 4. Guía, configuración y skill

- [x] 4.1 Con el permiso del fundador:
  - descargar con `curl` desde `davila7/claude-code-templates` los archivos de `cli-tool/components/skills/development/code-reviewer`;
  - leerlos;
  - copiarlos a `.claude/skills/aitmpl-code-reviewer/` (al principio, `code-reviewer/`; ver la nota de la tarea).

  Verificación: revisión del contenido anotada aquí y prueba del skill en verde.

  *Hecho:* Con permiso del fundador. Dos archivos (`SKILL.md`, `references/bug-patterns.md`) descargados con `curl` fijando el commit `0a68497`; leídos enteros: no descarga ni instala nada, no publica sin que se pida y remite a `CLAUDE.md`. **Error encontrado en la prueba:** al invocar `code-reviewer` se cargó el skill del plugin `fullstack-dev-skills`, que se llama igual. Corregido: carpeta y nombre `aitmpl-code-reviewer`; la sesión lo detecta en el acto. Procedencia y huellas en `SOURCE.md`. Una sesión nueva sin interfaz no pudo comprobarse: la sesión de `claude` en la terminal había caducado.

- [x] 4.2 Actualizar `CLAUDE.md`:
  - estado de la v1.1 y lotes L11 a L16;
  - rama y pull request desde L12;
  - revisión local según la respuesta del fundador a la pregunta 2 de la propuesta;
  - skills de revisión corregidos;
  - regla roja de `push` sin «la v1 se sube completa al final».

  Verificación: pruebas de la guía en verde.

  *Hecho:* Estado de la v1.1, rama y pull request desde L12, `/code-review` antes de cada `push` y `aitmpl-code-reviewer` al cerrar cada lote, con aviso de no usar `code-reviewer` a secas. Regla roja del `push` reescrita sin «la v1 se sube completa al final». Sin respuesta a la pregunta 2 de la propuesta: se usan los dos, el comando antes de cada `push` y el skill al cerrar el lote.

- [x] 4.3 Corregir `openspec/config.yaml`:
  - poner entre comillas la regla de specs con «: »;
  - contexto con lotes hasta L16 y ADR hasta 0017;
  - quitar «la v1 se sube completa al final».

  Verificación: prueba en verde y `openspec instructions specs --change l11-base-v1-1` sin avisos (M).

  *Hecho:* Regla de specs entre comillas; contexto con v1.1 y ADR-0001 a 0017; guía de `apply` sin «la v1 se sube completa al final». `openspec instructions specs --change l11-base-v1-1`: sin avisos (antes: «Rules for 'specs' must be an array of strings»).

- [x] 4.4 README: quitar la nota «Se corrige en la v1.1» de la tabla de skills, que ya estará corregida. Verificación: diff revisado.

  *Hecho:* Tabla de skills: qué se usó en la v1, qué se usa desde la v1.1 y por qué el nombre con prefijo. Sección de revisión con el skill al cerrar cada lote.

- [x] 4.5 Corrección en producción, añadida el 2026-11-17 por decisión del fundador. Es la única excepción a «L11 no toca `src/»: la versión ligera de la escena salía negra en Chromium. Sin delta de spec: `scene-rendering` ya exige la ilustración con la paleta del tema. Verificación: prueba en rojo antes y puerta de cierre después.

  *Hecho:*
  - **Síntoma, visto por el fundador en Brave:** al recargar `/es`, la ilustración sale negra un instante antes del 3D. En modo ligero sale negra siempre: movimiento reducido, equipo modesto o elección en el pie. Afecta a las tres ranuras (hero, recorrido y cierre). En WebKit no pasa.
  - **Causa:** los bloques son `<use>` de cuatro `<symbol>`. Chromium no aplica las reglas de `globals.css` a las copias del árbol de `<use>`, así que las caras quedaban con `fill` por defecto, negro. Las variables `--face-*` sí llegan.
  - **Corrección:** cada `<polygon>` de `scene-svg.tsx` lleva atributos de presentación que solo remiten a `var(--face-*)`. Las reglas CSS se mantienen para los demás navegadores. Se descartó `style=` porque la CSP (`style-src 'self'`) lo bloquea: lo detectó `e2e:preview` en el primer intento.
  - **Pruebas:**
    - e2e nueva, «las ilustraciones se pintan con su paleta, sin bloques negros». Antes de corregir, en rojo en Chromium (3,1 % de píxeles negros en el hero) y en verde en WebKit.
    - `scene-lite.test.tsx`: los atributos de pintura solo pueden ser `var(--face-*)` y sigue prohibido `style=`.
  - **Comprobación en vivo:** las tres ranuras con su paleta en el build local, y en confia.ing con la CSP real, sin errores de consola.
  - **Puerta de cierre:**
    - en verde: `lint`, `typecheck`, `e2e` (371), `e2e:preview` (35), `build:worker` (1190 KiB) y `measure:js` (164,6 kB);
    - `test`: 1069 pasan y 3 fallan, las de L10 sin archivar.
  - **Revisión:** `aitmpl-code-reviewer`, nivel `medium`, en un subagente independiente sobre el commit `6e5717b`. Sin hallazgos. Un detalle menor, el comentario de cabecera de `scene-svg.tsx` que solo nombraba `globals.css`, se corrigió.
  - **Pendiente:** el despliegue, con la orden del fundador.

## 5. Cierre

- [x] 5.1 Revisión de código en local según D1 y corrección de los hallazgos. Verificación: hallazgos y resolución anotados aquí.

  *Hecho:* `aitmpl-code-reviewer` en un subagente independiente; el skill se cargó por su nombre (prueba real del skill instalado). Veredicto: aprobar con comentarios. Hallazgos confirmados y corregidos: (media) el escenario «Skill presente» pedía la ruta y el nombre antiguos; (baja) `tasks.md` y `design.md` con la ruta antigua; (baja) `CLAUDE.md` y `config.yaml` decían «L0 a L10 archivados» con L10 aún abierto. Menor corregido: la configuración se leía dos veces en la prueba. `/code-review` se ejecutará antes del `push`.
- [x] 5.2 Puerta de cierre (parcial el 2026-11-16: `lint`, `typecheck`, `e2e` 369 pasan, `e2e:preview` 35 pasan, `build:worker` 1190 KiB de 3072, `measure:js` 164,6 kB de 200; `test` 1069 pasan y 3 fallan a la espera de archivar L10): `lint`, `typecheck`, `test`, `e2e`, `e2e:preview`, `build:worker`, `measure:js`. Verificación: salida a la vista.

  *Hecho el 2026-11-17, después de archivar L10:*
  - todo en verde: `lint`, `typecheck`, `test` (1072 de 1072), `e2e` (371), `e2e:preview` (35), `build:worker` (1190 KiB de 3072) y `measure:js` (164,6 kB de 200);
  - `openspec validate --specs --strict`: 28 de 28.
- [x] 5.3 BACKLOG: L11 marcado como hecho. Archivar L11. Verificación: `openspec list` sin cambios abiertos.

  *Hecho:* L11 marcado ✅ en el BACKLOG y el estado del README al día. Tras archivar, `openspec list` solo muestra L12, que es la siguiente y ya está aprobada.
- [x] 5.4 Commit local. El `push`, solo con la orden del fundador.

## Para reanudar (pausa del 2026-11-16, 18:56 UTC)

**Estado.** L11 lleva 11 de 15 tareas. L12 está aprobada y sin empezar.

- `main` local va 4 commits por delante de GitHub. Son la regla de revisión según el riesgo y la propuesta de L12 con sus dos decisiones.
- Árbol de trabajo limpio, sin procesos abiertos, `.dev.vars` en `SERVICES=memory`.
- La última CI subida (`229f156`) está en rojo solo por las 3 pruebas que esperan a archivar L10. `contract`, `e2e` y `e2e-preview` están en verde.
- Decisiones tomadas hoy:
  - D1: `/code-review` antes de cada `push`, con la profundidad según el riesgo, y `aitmpl-code-reviewer` al cerrar cada lote;
  - D2: `www` redirige a `confia.ing`, en L13;
  - R1 a R16: aprobados;
  - L12: protección también para administradores.
- Pendiente: D3, el repositorio privado, antes de L14.

**Pasos, después de las 08:17 UTC del 17 de noviembre:**

1. **Tarea 3.3: comprobar el registro diario.**
   - Abrir los registros del Worker `confiahome` en el panel de Cloudflare (Workers → confiahome → Logs) y buscar `maintenance.done` de hacia las 08:17 UTC.
   - Debe traer `heartbeat`, `contactsPurged` y `eventsPurged`; un `-1` es un borrado fallido. Guía en `docs/operations.md`, «Tarea diaria».
   - `npx wrangler tail` solo muestra registros en vivo: no sirve para uno pasado.
   - Si no aparece, diagnosticar antes de archivar.
2. **Anotar la evidencia en la 3.3 de aquí y en la 3.7 de L10.** Después, `openspec archive l10-lanzamiento -y`.
3. **Puerta de cierre completa (5.2):** `lint`, `typecheck`, `test`, `e2e`, `e2e:preview`, `build:worker` y `measure:js`. Las 3 pruebas de `development-workflow.test.ts` deben pasar ya.
4. **5.3:** BACKLOG con L11 ✅, `openspec archive l11-base-v1-1 -y` y comprobar que `openspec list` solo muestra L12.
5. **5.4:**
   - commit local;
   - `/code-review low`, porque el cambio es de documentación y especificaciones;
   - push a `main` con la orden del fundador. Todavía no hay protección; este es el último push directo;
   - confirmar la CI en verde.
6. **Empezar L12** con `/opsx:apply l12-proteccion-en-github`: rama `lote/l12-proteccion-en-github`, siguiendo su `tasks.md`.
