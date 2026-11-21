# Tareas — L13 Cloudflare y dominio

Propuesta aprobada por el fundador el 2026-11-21, con las dos recomendaciones: el servidor comprueba el dominio del token, y el umbral de `/api/events` es de 20 peticiones en 10 s con bloqueo de 10 s.

Rama `lote/l13-cloudflare-y-dominio`. Las tareas marcadas **[fundador]** se hacen en el panel de Cloudflare con los pasos del diseño. Las marcadas **[orden]** esperan la orden expresa del fundador.

## 1. Escenarios y pruebas primero

- [x] 1.1 Sección «L13 — Cloudflare y dominio» en `docs/escenarios.md`, con los escenarios L13-1 a L13-5 de las specs. Verificación: cada `L13-n` de las specs aparece allí.
- [x] 1.2 Pruebas en rojo en `tests/unit/verify-site.test.ts` para «HTTP lleva a HTTPS», «`www` lleva al dominio» y «Solo para el dominio público». El `fetch` simulado distingue el host y el esquema, y cubre la redirección perdida, el 200 por HTTP, `www` que no resuelve y los dos saltos. Verificación: fallan por la ausencia de las comprobaciones.
- [x] 1.3 Pruebas en rojo para «Token de otro dominio» y «Sin dominio configurado» (verificador de Turnstile) y para «Producción exige el dominio» (`tests/unit/container.test.ts`). Verificación: fallan por la ausencia de la opción.

## 2. Implementación

- [x] 2.1 Comprobaciones de la zona en `scripts/lib/verify-site.ts` (diseño, decisión 2). Verificación: pruebas de 1.2 en verde, y las existentes sin cambios.
- [x] 2.2 Opción `hostname` en el verificador de Turnstile, y la composición que la pasa solo con una dirección HTTPS no local (decisión 3). Verificación: pruebas de 1.3 en verde; `npm run test:contract` en verde con Supabase local.
- [x] 2.3 `docs/operations.md`: sección «Configuración de la zona», con el inventario de la decisión 1, dónde se cambia cada ajuste y qué lo comprueba. En «Vigilancia diaria», quién recibe el aviso. `docs/security/audit-v1.md`: S-03 y S-07 pasan a corregidos, con referencia a L13. Verificación: escenario «Inventario de la zona» (M) revisado por el fundador.

  *Hecho, 2026-11-21.* Sección «Configuración de la zona» en `docs/operations.md`, ajustada a lo aplicado en el panel. En «Vigilancia diaria», quién recibe el aviso. S-03 y S-07, corregidos en `audit-v1.md`. **El fundador aprobó la sección el 2026-11-21.**

## 3. Zona de Cloudflare

- [x] 3.1 **[fundador]** «Always Use HTTPS». Verificación: `curl -sI http://confia.ing/es?x=1` → 301 a `https://confia.ing/es?x=1` (escenario «HTTP no sirve contenido»). Se anota el estado previo del ajuste.

  *Hecho, 2026-11-21.* Ya estaba activado: el panel dice que se cambió por última vez «hace 5 días» (el 2026-11-16, en L10). No se tocó. `curl -sI 'http://confia.ing/es?x=1'` → `301`, `Location: https://confia.ing/es?x=1`.
- [x] 3.2 **[fundador]** Registro `AAAA www 100::` con proxy y regla de redirección de `www`. Verificación: `curl -sI` de `https://www.confia.ing/es?x=1` y `http://www.confia.ing/es`, con su salida anotada.

  *Hecho por el agente en el panel, 2026-11-21, a petición del fundador.* Registro `AAAA www 100::` con proxy. Regla «www a confia.ing (L13)»: patrón `https://www.confia.ing/*` → `https://confia.ing/${1}`, 301, conservando la consulta (la plantilla de Cloudflare no la conservaba; se marcó). `curl -sI`: `https://www.confia.ing/es?verificacion=1` → `301` a `https://confia.ing/es?verificacion=1`; `http://www.confia.ing/es` → `301` a `https://www.confia.ing/es` → `301` a `https://confia.ing/es`.
- [x] 3.3 **[fundador]** Regla de frecuencia de `POST /api/events`: 20 en 10 s por IP, bloqueo de 10 s. Verificación: escenario «Ráfaga cortada en el borde» (M). 25 eventos fuera de la lista seguidos: los primeros responden 400 del Worker y los siguientes, 429 de Cloudflare. Se comprueba que `/es` sigue en 200 y, pasado el bloqueo, que vuelve el 400. No se guarda nada.

  *Hecho por el agente en el panel, 2026-11-21.* Regla «Eventos de analitica (L13)», expresión `(http.request.uri.path eq "/api/events" and http.request.method eq "POST")`, por IP, 20 en 10 s, bloquear 10 s, activa. Ráfaga de 25 eventos `no-existe`: 23 × `400` del Worker y 2 × `429` de Cloudflare (`server: cloudflare`, `text/plain`; el Worker responde JSON). `/es` en `200` durante el bloqueo; a los 25 s, `400` de nuevo. No se guardó nada.
- [x] 3.4 **[fundador]** Turnstile: el widget solo admite `confia.ing`. Verificación: escenario «Widget restringido» (M), con captura de la lista de dominios.

  *Hecho, 2026-11-21.* Ya estaba así: el widget «confia.ing home» tiene un solo dominio, `confia.ing` (1 de 10). No se cambió ni se guardó nada.
- [x] 3.5 `npm run verify:site -- https://confia.ing` desde la rama, con las comprobaciones nuevas. Verificación: escenario «La zona real» (M), todas en verde y la salida anotada.

  *Hecho, 2026-11-21.* `node scripts/verify-production.ts https://confia.ing` desde la rama: **24 comprobaciones en verde**, también `http → https conserva ruta y parámetros`, `https://www lleva al dominio con ruta y parámetros` y `http://www lleva a https del dominio`. Antes de configurar `www`: 22 de 24.

## 4. Pendientes de L12

- [x] 4.1 Evidencia de «Un pull request en rojo no se funde»: el PR #5 (TypeScript 7), con los cinco trabajos en rojo y estado `BLOCKED` mientras estuvo abierto. Verificación: salida de `gh pr view 5` anotada aquí.

  *Hecho, 2026-11-21.* `gh pr view 5 --json state,mergeStateStatus,statusCheckRollup` devuelve `state: CLOSED` (cerrado el 2026-11-21 a las 20:42 UTC, sin fundir), `mergeStateStatus: BLOCKED`, y `audit`, `quality`, `contract`, `e2e` y `e2e-preview` en `FAILURE`. Antes de cerrarlo, el 2026-11-18, la consulta ya daba `BLOCKED` con la protección activa: GitHub no lo habría dejado fundir. El fallo era de `npm ci` (`ERESOLVE`: `typescript-eslint` no admite TypeScript 7).

## 5. Cierre por pull request

- [x] 5.1 `/code-review high` (toca Turnstile y el verificador de producción). `aitmpl-code-reviewer` revisa el lote en un subagente. Verificación: hallazgos y resolución anotados aquí.

  *Hecho, 2026-11-21.*
  - **`/code-review high`:** seis hallazgos.
    - Cuatro corregidos:
      1. Ninguna prueba veía que la composición pasara el dominio. Ahora `createContainer(env, siteUrl)` tiene dos pruebas con siteverify simulado.
      2. `npm run preview` con servicios reales rechazaría todo token. Documentado en `docs/development.md` y en los riesgos del diseño.
      3. S-07 figuraba como corregido antes del despliegue. Ahora dice «desde el despliegue de L13».
      4. El diseño no recogía la regla de dos etiquetas para comprobar la zona.
    - Dos aceptados:
      - La zona solo se comprueba en dominios de dos etiquetas: está documentado y basta para `confia.ing`.
      - La detección de direcciones locales está repetida en tres sitios. Unificarla obligaría a `scripts/` a importar de `src/`, y el verificador corre en la CI sin `npm ci`.
  - **`aitmpl-code-reviewer` (high, subagente):** aprobar con comentarios. No encontró hallazgos altos ni medios. Cuatro bajos:
    - La prueba de la composición: ya corregida.
    - El escenario L13-2 y la spec no coincidían con el código (`?origen=prueba` y los saltos de `http://www`). Alineados.
    - El detalle de un fallo de `http://www` describía un salto de más. Ahora lleva la cadena de saltos, con su prueba.
    - S-07: ya corregido.
  - **Lo que señaló el subagente sin confirmar:** un fallo intermitente que no pudo reproducir en 34 ejecuciones. Sospecha de una prueba anterior a L13 que usa temporizadores falsos. Queda en observación en la CI.
  - `verify:site` contra producción con el bucle nuevo: 24 en verde.
- [x] 5.2 Puerta de cierre completa, más `test:contract`. Verificación: salida a la vista.

  *Hecho, 2026-11-21, tras las correcciones de la revisión.* `lint` 0 · `typecheck` 0 · `test` 1127 de 1127 · `e2e` 371 en verde · `e2e:preview` 35 en verde · `build:worker` 1190,5 KiB de 3072 · `measure:js` 164,6 kB de 200 · `test:contract` 52 de 52.

  **Orden de cierre:** push y pull request → revisión de `operations.md` por el fundador (2.3) → archivo, BACKLOG y README en la misma rama → fusión → despliegue (5.5) y vigilancia (5.6), cuya evidencia se anota en el lote siguiente.
- [x] 5.3 Archivo del cambio, README y BACKLOG (L13 ✅) en la rama. Commit. **[orden]** Push y pull request. Verificación: CI del pull request en verde, con enlace.

  *Hecho, 2026-11-21.* [confiaing/confiahome#7](https://github.com/confiaing/confiahome/pull/7), con el archivo del cambio, BACKLOG y README en la misma rama. El enlace a la CI en verde se anota en el lote siguiente.
- [ ] 5.4 **[orden]** Fundir el pull request. Verificación: `main` contiene L13; `openspec list` sin L13.
- [ ] 5.5 **[orden]** Desplegar con `release:check`, `release` y `wrangler deploy`; se recomienda antes `/ultrareview`. Verificación: `verify:site` en verde contra `https://confia.ing` y una consulta real de prueba enviada desde el formulario. Su fila se borra después, con la decisión del fundador anotada.
- [ ] 5.6 Vigilancia diaria lanzada a demanda tras fundir. Verificación: ejecución en verde, con las comprobaciones de la zona, y su enlace anotado.

## Al archivar

Archivado el 2026-11-21, con 15 de 18 tareas. Las tareas 5.4 (fusión), 5.5 (despliegue) y 5.6 (vigilancia) se hacen después de fundir: `main` está protegida y el archivo tiene que entrar en el mismo pull request. Su evidencia se anota en el lote siguiente.
