# Tareas — L13 Cloudflare y dominio

Propuesta aprobada por el fundador el 2026-11-21, con las dos recomendaciones: el servidor comprueba el dominio del token, y el umbral de `/api/events` es de 20 peticiones en 10 s con bloqueo de 10 s.

Rama `lote/l13-cloudflare-y-dominio`. Las tareas marcadas **[fundador]** se hacen en el panel de Cloudflare con los pasos del diseño. Las marcadas **[orden]** esperan la orden expresa del fundador.

## 1. Escenarios y pruebas primero

- [ ] 1.1 Sección «L13 — Cloudflare y dominio» en `docs/escenarios.md`, con los escenarios L13-1 a L13-5 de las specs. Verificación: cada `L13-n` de las specs aparece allí.
- [ ] 1.2 Pruebas en rojo en `tests/unit/verify-site.test.ts` para «HTTP lleva a HTTPS», «`www` lleva al dominio» y «Solo para el dominio público». El `fetch` simulado distingue el host y el esquema, y cubre la redirección perdida, el 200 por HTTP, `www` que no resuelve y los dos saltos. Verificación: fallan por la ausencia de las comprobaciones.
- [ ] 1.3 Pruebas en rojo para «Token de otro dominio» y «Sin dominio configurado» (verificador de Turnstile) y para «Producción exige el dominio» (`tests/unit/container.test.ts`). Verificación: fallan por la ausencia de la opción.

## 2. Implementación

- [ ] 2.1 Comprobaciones de la zona en `scripts/lib/verify-site.ts` (diseño, decisión 2). Verificación: pruebas de 1.2 en verde, y las existentes sin cambios.
- [ ] 2.2 Opción `hostname` en el verificador de Turnstile, y la composición que la pasa solo con una dirección HTTPS no local (decisión 3). Verificación: pruebas de 1.3 en verde; `npm run test:contract` en verde con Supabase local.
- [ ] 2.3 `docs/operations.md`: sección «Configuración de la zona», con el inventario de la decisión 1, dónde se cambia cada ajuste y qué lo comprueba. En «Vigilancia diaria», quién recibe el aviso. `docs/security/audit-v1.md`: S-03 y S-07 pasan a corregidos, con referencia a L13. Verificación: escenario «Inventario de la zona» (M) revisado por el fundador.

## 3. Zona de Cloudflare

- [ ] 3.1 **[fundador]** «Always Use HTTPS». Verificación: `curl -sI http://confia.ing/es?x=1` → 301 a `https://confia.ing/es?x=1` (escenario «HTTP no sirve contenido»). Se anota el estado previo del ajuste.
- [ ] 3.2 **[fundador]** Registro `AAAA www 100::` con proxy y regla de redirección de `www`. Verificación: `curl -sI` de `https://www.confia.ing/es?x=1` y `http://www.confia.ing/es`, con su salida anotada.
- [ ] 3.3 **[fundador]** Regla de frecuencia de `POST /api/events`: 20 en 10 s por IP, bloqueo de 10 s. Verificación: escenario «Ráfaga cortada en el borde» (M). 25 eventos fuera de la lista seguidos: los primeros responden 400 del Worker y los siguientes, 429 de Cloudflare. Se comprueba que `/es` sigue en 200 y, pasado el bloqueo, que vuelve el 400. No se guarda nada.
- [ ] 3.4 **[fundador]** Turnstile: el widget solo admite `confia.ing`. Verificación: escenario «Widget restringido» (M), con captura de la lista de dominios.
- [ ] 3.5 `npm run verify:site -- https://confia.ing` desde la rama, con las comprobaciones nuevas. Verificación: escenario «La zona real» (M), todas en verde y la salida anotada.

## 4. Pendientes de L12

- [ ] 4.1 Evidencia de «Un pull request en rojo no se funde»: el PR #5 (TypeScript 7), con los cinco trabajos en rojo y estado `BLOCKED` mientras estuvo abierto. Verificación: salida de `gh pr view 5` anotada aquí.

## 5. Cierre por pull request

- [ ] 5.1 `/code-review high` (toca Turnstile y el verificador de producción). `aitmpl-code-reviewer` revisa el lote en un subagente. Verificación: hallazgos y resolución anotados aquí.
- [ ] 5.2 Puerta de cierre completa, más `test:contract`. Verificación: salida a la vista.
- [ ] 5.3 Archivo del cambio, README y BACKLOG (L13 ✅) en la rama. Commit. **[orden]** Push y pull request. Verificación: CI del pull request en verde, con enlace.
- [ ] 5.4 **[orden]** Fundir el pull request. Verificación: `main` contiene L13; `openspec list` sin L13.
- [ ] 5.5 **[orden]** Desplegar con `release:check`, `release` y `wrangler deploy`; se recomienda antes `/ultrareview`. Verificación: `verify:site` en verde contra `https://confia.ing` y una consulta real de prueba enviada desde el formulario. Su fila se borra después, con la decisión del fundador anotada.
- [ ] 5.6 Vigilancia diaria lanzada a demanda tras fundir. Verificación: ejecución en verde, con las comprobaciones de la zona, y su enlace anotado.
