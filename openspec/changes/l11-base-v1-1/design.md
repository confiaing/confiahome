# Diseño — L11 Base de la v1.1

## Contexto

Once cambios (L0 a L10) con 161 exigencias, todas `ADDED`, nunca archivados. Varias tareas posteriores cambiaron un comportamiento ya especificado sin escribir un delta `MODIFIED`. L10 tiene cinco tareas abiertas: 3.7 (registro diario), 4.1 (panel de Cloudflare), 5.6 (protección de `main`), 6.4 (archivar) y 6.5 (commit y envío, ya hecho).

## Decisiones

### 1. Reconciliar antes de archivar, con deltas de L11

Las specs solo cambian al archivar un cambio aprobado (regla roja de `CLAUDE.md`). Las correcciones van, por tanto, como deltas `MODIFIED` o `REMOVED` de **este** cambio, que se archiva el último y se aplica sobre la base ya archivada.

- La revisión compara cada exigencia con las de lotes posteriores y con el código y las pruebas actuales.
- El resultado (tabla de exigencia, problema, evidencia y delta) se presenta al fundador.
- El fundador aprueba los deltas antes de archivar.

*Alternativas descartadas:*
- Editar a mano los deltas de los lotes viejos: reescribe la historia de lo aprobado.
- Archivar sin revisar: deja en `specs/` exigencias falsas, que L12 a L16 tomarían por ciertas.

#### Hallazgos de la revisión previa

Revisión hecha al preparar esta propuesta: 161 exigencias leídas por su nombre y unas 50 contrastadas con el código. Para el fundador:

| # | Capacidad · exigencia (lote) | Problema | Delta propuesto |
|---|---|---|---|
| R1 | security-headers · HTTPS persistente (L9) | Dice «sin `includeSubDomains`»; el código lo lleva desde L10, por decisión del fundador | MODIFIED: un año como mínimo y `includeSubDomains`, sin `preload` |
| R2 | security-headers · Cabeceras en todas las respuestas (L9) | Una respuesta 304 sale sin CSP (arreglo de L10). Los archivos estáticos no llevan `Permissions-Policy` | MODIFIED: escenario del 304; `Permissions-Policy` solo en lo que sirve el Worker |
| R3 | contact-form · Detalles de cada modo (L5) | Faltan los ejemplos animados y la pregunta encima de la respuesta (L10) | MODIFIED: dos escenarios nuevos |
| R4 | home-page · Cierre con las dos vías (L3) | Falta el título partido por frases (L10) | MODIFIED: escenario nuevo |
| R5 | app-shell · Paridad con Workers (L0) | Falta que las páginas se sirvan del build (arreglo de L10) | MODIFIED: escenario nuevo |
| R6 | legal-pages · Aviso de borrador (L2) y Borrador señalado (L8) | Duplicadas; solo L2 exige el correo | REMOVED la de L2; MODIFIED la de L8 con `hola@confia.ing`. Se recupera el `## Purpose` de L2, que L8 sobrescribe |
| R7 | site-navigation · Agenda sin JavaScript (L2) | Dice «abre en otra pestaña» siempre; con JavaScript, L6 la abre en la página | MODIFIED: sin JavaScript, otra pestaña; con JavaScript, manda `scheduling` |
| R8 | scheduling · Agenda sin JavaScript (L6) | Repite R7 | Se queda la de `scheduling`; R7 la referencia |
| R9 | locale-routing · Metadatos por idioma (L2) | Misma exigencia, con el mismo nombre, en `search-and-agent-discovery` (L8) | REMOVED en `locale-routing` |
| R10 | repository-and-ci · Comprobaciones en cada cambio (L10) | Dice que la puerta y la CI son iguales; la CI añade el contrato | MODIFIED: la puerta más el contrato |
| R11 | production-release · Verificación tras el despliegue (L10) | El escenario «Datos de prueba retirados» no se cumple: el fundador conservó la fila | MODIFIED: «retirados, o conservados por decisión del fundador y anotados» |

Se archivan sin cambios, como objetivos de lotes posteriores:

- «Rama principal protegida» (L10), que cumple L12.
- «README de un proyecto desplegado» (L10), que cumple L16.

El presupuesto de rendimiento repetido en seis exigencias se deja: repetirlo no es contradecirlo.

Quedaron sin contrastar a fondo unas 110 exigencias: marca, escena, instrumentación, SEO y mantenimiento. La tarea 2.2 las cubre.

### 2. Orden de archivo

1. L0 a L9 en orden, con `openspec archive <cambio> -y`.
2. L10 después de anotar 3.7, que se ve tras las 08:17 UTC del 17 de noviembre.
3. Por último, L11.

Antes de archivar L10, sus tareas 4.1 y 5.6 dejan de ser casillas: pasan a una nota «Trasladada a L13» o «Trasladada a L12». No se marcan como hechas.

`legal-pages` llega dos veces como `ADDED` (L2 y L8) con nombres de exigencia distintos. OpenSpec las une; la duplicación de fondo la resuelve la decisión 1.

### 3. Skill de revisión en el repositorio

Se descarga el `SKILL.md` (y su segundo archivo) de `davila7/claude-code-templates`, ruta `cli-tool/components/skills/development/code-reviewer`. Se usa `curl` a GitHub en lugar de `npx claude-code-templates`, para no ejecutar código de terceros. El contenido se lee antes de copiarlo a `.claude/skills/code-reviewer/`.

Convive con `fullstack-dev-skills:code-reviewer` del plugin. `CLAUDE.md` nombra el de aitmpl como el de revisión.

### 4. Pruebas de la guía y de la configuración

Una prueba nueva, `tests/unit/development-workflow.test.ts`, lee archivos del repositorio, como ya hace `ci-workflow.test.ts`. Comprueba:

- en `openspec/changes/`, que no quedan cambios `l0` a `l10`;
- en `openspec/specs/`, que cada capacidad tiene su `spec.md`;
- en `CLAUDE.md`, la revisión local y el estado de la v1.1;
- que existe el skill de revisión;
- que `openspec/config.yaml` es válido: cada regla de `rules` es un texto, no un par clave-valor.

La CLI de OpenSpec está instalada solo en la máquina del fundador, no en la CI, así que esta última no la llama. Lee el YAML con el paquete `yaml`, que se añade como dependencia de desarrollo: hoy solo llega de forma indirecta, a través de OpenNext.

Nivel: unitario (U). Las comprobaciones manuales (M) dejan su evidencia en `tasks.md`.

## Dónde vive cada pieza

| Pieza | Carpeta |
|---|---|
| Specs archivadas | `openspec/specs/`, `openspec/changes/archive/` |
| Guía del agente | `CLAUDE.md` |
| Configuración de OpenSpec | `openspec/config.yaml` |
| Skill de revisión | `.claude/skills/code-reviewer/` |
| Pruebas | `tests/unit/development-workflow.test.ts` |

No se toca `src/`, `worker/` ni `supabase/`. No se necesita un ADR nuevo: la revisión local ya es la decisión D1, registrada en el ADR-0017.

## Riesgos

- **La reconciliación puede ser larga.** Se acota a contradicciones, duplicados y exigencias obsoletas con evidencia; las mejoras de redacción quedan fuera.
- **El skill de aitmpl puede pedir algo prohibido** (por ejemplo, publicar comentarios en GitHub). Si es así, `CLAUDE.md` manda, como ya dice para cualquier skill.
