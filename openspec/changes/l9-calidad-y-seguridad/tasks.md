# Tasks

Cada tarea de implementación va precedida por su prueba en rojo. Entre paréntesis, la spec y el requisito que cubre.

## 1. Prueba de concepto (decide si el lote sigue)

- [x] 1.1 Envolver la entrada de OpenNext desde `worker/index.ts` y servir `/es` en `preview`. Verificación: respuesta 200 con una cabecera de prueba; anotado aquí cómo se importa el manejador.
- [x] 1.2 Calcular las huellas de los scripts en línea del HTML generado y servir la home con una CSP solo por huellas. Verificación: la página funciona entera y la consola no registra infracciones; anotado si las huellas son estables entre dos builds.
- [x] 1.3 Confirmar en la documentación de wrangler la opción que desactiva los registros de invocación y cómo se dispara a mano una tarea programada en local. Verificación: enlace y nombre exacto anotados aquí.
- [x] 1.4 **Si 1.1 o 1.2 no son viables: detener el lote y consultar al fundador con las alternativas de design.md D3.** Verificación: decisión anotada aquí.

## 2. Cabeceras y CSP (L9-5)

- [x] 2.1 Pruebas unitarias en rojo de `headers.ts`: directivas, orígenes admitidos y en su directiva, sin `unsafe-inline` ni comodines en `script-src`, HSTS, `Referrer-Policy`, `Permissions-Policy`, respuestas HTML frente a las demás (security-headers). Verificación: `npm test` falla.
- [x] 2.2 Implementar `src/lib/server/security/headers.ts`. Verificación: `npm test` en verde.
- [x] 2.3 Escribir `worker/index.ts` (cabeceras y sellado de scripts con `HTMLRewriter`), `public/_headers` para los archivos estáticos y cambiar `main` en `wrangler.jsonc`. Verificación: `npm run build:worker` en verde; el sellado se prueba en `e2e:preview` (5.4).

## 3. Mantenimiento programado (L9-8)

- [x] 3.1 Pruebas en rojo de `cutoff` y `runMaintenance` con adaptadores en memoria: fechas de corte; borra solo lo vencido; falla el latido y sigue; falla un borrado y sigue el otro; registro con cuentas y sin contenido; plazos iguales a los de la política (scheduled-maintenance). Verificación: `npm test` falla.
- [x] 3.2 Implementar `src/domain/maintenance/` y los adaptadores en memoria. Verificación: `npm test` en verde.
- [x] 3.3 Pruebas de contrato en rojo contra la base local: latido sin leer datos personales; borrado de filas de prueba antiguas dejando las recientes; sin fecha válida no se envía nada (Latido real; Se borra lo vencido; Sin condición no se borra). Verificación: `npm run test:contract` falla.
- [x] 3.4 Implementar `adapters/supabase/{health,purger}.ts`, ampliar `container.ts`, conectar `scheduled` y añadir el disparo diario. Verificación: `npm run test:contract` y `npm test` en verde.
- [x] 3.5 Registros de la plataforma: prueba sobre `wrangler.jsonc` y cambio de configuración (Registros de la plataforma sin datos del visitante). Verificación: `npm test` en verde.

## 4. Endurecimientos pendientes

- [x] 4.1 Pruebas en rojo y cambio en el esquema de la consulta: etiquetas de campaña con el formato estricto, ausentes si no encajan (release-quality: Datos de entrada acotados). Verificación: `npm test` y `test:contract` en verde.

## 5. Pruebas de conjunto (L9-1 a L9-4)

- [x] 5.1 Mover los simuladores de Calendly a `tests/e2e/support/` y escribir `journeys.spec.ts`: los dos flujos por idioma; recorrido completo con teclado en escritorio; menú con teclado en móvil; movimiento reducido (release-quality). Verificación: `npm run e2e` en verde.
- [x] 5.2 Matriz de accesibilidad: home y cuatro legales, dos anchos, dos versiones de la escena. Verificación: `npm run e2e` en verde; combinaciones listadas aquí.
- [x] 5.3 Rendimiento: LCP, CLS y JS inicial con el perfil del proyecto. Verificación: valores anotados aquí.
- [x] 5.4 `tests/preview/`, `playwright.preview.config.ts` y `npm run e2e:preview`: cabeceras por tipo de respuesta; recorrido completo sin infracciones de CSP; flujo de consulta; agenda; cambio de idioma desde una página legal; un tercero no declarado se bloquea (security-headers: La página funciona entera; Compatibilidad con el cambio de idioma). Verificación: `npm run e2e:preview` en verde.
- [x] 5.5 Disparar la tarea programada en `preview` contra la base local y comprobar latido y borrado. Verificación: salida anotada aquí.

## 6. Auditoría y revisión (L9-6, L9-7)

- [x] 6.1 Auditoría con `security-audit` sobre todo el repositorio; informe en `docs/security/audit-v1.md`. Verificación: informe escrito.
- [x] 6.2 Revisión de código de toda la v1 con `fullstack-dev-skills:code-reviewer`, en subagentes independientes por área. Verificación: hallazgos anotados en el informe.
- [x] 6.3 Corregir, con prueba, cada hallazgo alto o medio; los que no se corrijan, presentarlos al fundador para su aceptación escrita. Verificación: tabla de hallazgos completa.
- [x] 6.4 Buscar secretos en el repositorio y en su historial local. Verificación: resultado anotado aquí.

## 7. Cierre del lote

- [x] 7.1 Escribir el ADR-0016. Verificación: enlazado desde README y arquitectura.
- [x] 7.2 Puerta de cierre: `lint`, `typecheck`, `test`, `test:contract`, `e2e`, `e2e:preview`, `build:worker`, `measure:js`. Verificación: todo en verde; cifras anotadas aquí.
- [x] 7.3 Actualizar README, BACKLOG, CLAUDE.md (comandos y puerta de cierre, con aprobación del fundador), `docs/architecture/`, `docs/setup.md`, `docs/legal/README.md` y `.env.example`. Verificación: enlaces comprobados.
- [x] 7.4 Commit local del lote, sin `push`. Verificación: `git status` limpio y `git log -1` muestra el commit.

## Evidencia

**Prueba de concepto (1.1 a 1.4), 2026-11-14.** Detalle en design.md D3.

- 1.1 Viable: `worker/index.ts` importa `../.open-next/worker.js` y delega; `/es` 200 con cabecera de prueba. Los estáticos no pasan por el Worker.
- 1.2 **No viable por huella:** 44 scripts en línea en el HTML del build frente a 7 en el servido; la home no se activaba (4 scripts bloqueados). Viable con código por respuesta sellado por `HTMLRewriter`: cero infracciones en Chromium y WebKit, ambas versiones de la escena, formulario, agenda, legales y 404.
- 1.3 Disparo programado en local: `GET /cdn-cgi/handler/scheduled` (200, manejador ejecutado). La opción de registros se confirma al tocar esa tarea.
- 1.4 Consultado el fundador: eligió el código por respuesta sellado en el Worker.

**Puerta de cierre (7.2), 2026-11-14, sobre el código final.**

| Comprobación | Resultado |
|---|---|
| `npm run lint` · `npm run typecheck` | Sin errores |
| `npm test` | 955 pruebas en 55 archivos, todas en verde |
| `npm run test:contract` (Supabase local) | 52 en verde |
| `npm run e2e` | 355 en verde, 23 omitidas (solo aplican en Chromium de escritorio) |
| `npm run e2e:preview` (Workers local) | 31 en verde, 1 omitida; sin procesos ni puerto abiertos al terminar |
| `npm run build:worker` | 1186,7 KiB de 3072; bloques de desarrollo y pruebas vaciados; sin secretos; sin Three.js |
| `npm run measure:js` (5.3) | 164,3 kB de 200 |
| LCP y CLS de `/es`, móvil simulado (5.3) | 0,76 s y 0,0060 en ambas versiones |

**Accesibilidad (5.2).** Sin infracciones de axe en: home `/es` y `/en` a 375 y 1280 px en versión completa y ligera (`scene.spec.ts`); las cuatro páginas legales a 375 y 1280 px (`legal.spec.ts`); formulario en ambos modos, vacío, con errores y enviado (`contact.spec.ts`); agenda en reposo, cargando, con calendario, con reserva y sin servicio (`agenda.spec.ts`). Las páginas legales no tienen escena: sus dos «versiones» son la misma página.

**Tarea diaria en Workers local contra la base local (5.5).** Con una consulta de 2023 y otra de 2026, y un evento de enero de 2025 y otro de noviembre de 2026: el disparo respondió 200 y registró `maintenance.done` con latido correcto, una consulta y un evento borrados. Quedaron las dos filas recientes. Un segundo disparo borró cero. `.dev.vars` se restauró.

**Secretos (6.4).** Solo `.env.example` está versionado; `.env.prod`, `.dev.vars`, `.env.development.local` y `.env.local` están ignorados. Cero coincidencias de claves en el árbol de trabajo y en el historial local. El correo del fundador no aparece en el repositorio ni en el historial.

**Auditoría y revisión (6.1 a 6.3).** Informe completo en `docs/security/audit-v1.md`. Auditoría de seguridad: sin hallazgos críticos, altos ni medios; cuatro bajos y cuatro informativos. Revisiones de código: sin altos; los medios, corregidos con prueba salvo tres aceptados que dependen de la configuración de producción (L10) o son un límite documentado.

Encontrado al escribir la prueba que pedía la auditoría: Next.js copia la ruta y los parámetros pedidos en un script de datos. Va codificado y dentro de una cadena; no encontré forma de ejecutarlo. Corregí el ADR, que afirmaba que el HTML no llevaba nada de la petición.

**`CLAUDE.md` (7.3).** Con el visto bueno del fundador, `npm run e2e:preview` entra en los comandos y en la puerta de cierre, donde sustituye a la carga manual de `/es` en `preview`.

**Desviaciones de TDD**

- La prueba de concepto (tarea 1) fue código exploratorio sin pruebas, sustituido después.
- `tests/unit/maintenance-deps.test.ts` se escribió junto con su implementación.
- La suite contra Workers se escribió después de la entrada del Worker: no hay forma de probarla antes de que exista.

**No verificado**

- Nada de producción: cabeceras tras el proxy real de Cloudflare, el disparo programado real, los registros con la opción nueva, el límite de frecuencia de 20 por minuto.
- `npm audit` de las dependencias.
- Lectores de pantalla reales.
- El recorrido con tabulador en Safari: se prueba en Chromium.

## Workflow follow-up

- `/opsx:verify` del cambio.
- `/opsx:archive` cuando el fundador lo apruebe.
