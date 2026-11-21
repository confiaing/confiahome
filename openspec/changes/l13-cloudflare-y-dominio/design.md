# Diseño — L13 Cloudflare y dominio

## Contexto

Lo que se midió el 2026-11-21 con `curl` y `dig`, sin cambiar nada:

- **Zona:** `confia.ing` está en Cloudflare (servidores `clint` y `sreeni`), en el plan gratuito. El Worker `confiahome` atiende el dominio propio.
- **HTTP:** `http://confia.ing/es?x=1` responde 301 a `https://confia.ing/es?x=1`. No se sabe si lo hace «Always Use HTTPS» o la configuración por defecto del dominio del Worker: se confirma en el panel.
- **`www`:** no tiene registro DNS. El HSTS ya lleva `includeSubDomains`.
- **Verificador:** `scripts/lib/verify-site.ts` solo pide por HTTPS y al dominio base.
- **Turnstile:** `src/adapters/turnstile/verifier.ts` mira solo `success`. La respuesta de siteverify trae también `hostname`, que hoy se ignora.

## Decisiones

### 1. La zona se configura en el panel, con pasos exactos

El plan gratuito no se gestiona desde este repositorio: no hay token de Cloudflare ni Terraform, y crearlos es parte de L14. El fundador aplica estos ajustes; el agente da los pasos y los comprueba desde fuera.

| Ajuste | Dónde | Valor |
|---|---|---|
| Always Use HTTPS | SSL/TLS → Edge Certificates | Activado |
| Registro de `www` | DNS → Records | `AAAA www 100::`, con proxy |
| Redirección de `www` | Rules → Redirect Rules | Si el host es `www.confia.ing`: 301 a `concat("https://confia.ing", http.request.uri.path)`, conservando la consulta |
| Frecuencia de `/api/events` | Security → WAF → Rate limiting rules | Ruta `/api/events` y método `POST`; por IP; 20 peticiones en 10 s; bloqueo de 10 s |
| Dominios del widget | Turnstile → widget → Hostname management | Solo `confia.ing` |

- **`100::`** es la dirección reservada que Cloudflare documenta para nombres que solo redirigen: el proxy responde y no hay servidor detrás.
- **Un `CNAME` a `confia.ing`** también funcionaría, pero haría parecer que `www` sirve el sitio.
- **El umbral, 20 en 10 s,** queda por encima de una visita normal y por debajo de una ráfaga. El Worker sigue con su propio límite de 20 por minuto y origen.

*Alternativa descartada: redirigir `www` en el Worker.* Exigiría una ruta más en el Worker, código y un despliegue, y la regla de Cloudflare lo hace gratis antes de llegar a él.

### 2. `verify:site` comprueba la zona

Comprobaciones nuevas en `scripts/lib/verify-site.ts`. Solo se hacen cuando la dirección base es HTTPS, no es local y no empieza por `www.`:

- `http://<host>/es?verificacion=1` responde 301 a `https://<host>/es?verificacion=1`.
- `https://www.<host>/es?verificacion=1` responde 301 a `https://<host>/es?verificacion=1`.
- `http://www.<host>/es` llega a `https://<host>/es` en dos saltos como máximo, todos 301. Cloudflare puede pasar antes por `https://www`.
- Un error de red, por ejemplo un DNS que no resuelve, cuenta como fallo con su detalle, no como excepción.

Se siguen las redirecciones a mano (`redirect: "manual"`), como ya hace el verificador. Prueba: **unitaria**, en `tests/unit/verify-site.test.ts`, con un `fetch` simulado.

**Orden:** la vigilancia diaria ejecuta `verify:site`. Si estas comprobaciones llegan a `main` antes de configurar `www`, la vigilancia se pondría en rojo. Por eso la zona se configura y se comprueba (tareas 3.x) antes de fundir.

### 3. El servidor exige el dominio del token

Supeditado a la decisión 1 del fundador.

- **Adaptador** (`src/adapters/turnstile/verifier.ts`): la opción nueva `hostname?: string`. Si está presente, `success: true` con otro `hostname` devuelve `false`, igual que un token inválido. El visitante ve la misma respuesta 403.
- **Composición** (`src/lib/server/container.ts`): pasa el host de `siteUrl` (`src/lib/public-env.ts`) solo si la dirección es HTTPS y no local. En desarrollo y en las pruebas de contrato no se comprueba el dominio, porque las claves de prueba de Turnstile no emiten tokens para `localhost`.
- **Pruebas:** **unitarias** para el adaptador y para la composición (`tests/unit/container.test.ts`). Sin red.

Las dependencias se respetan: `lib/server` ya importa `adapters` y `lib`.

### 4. Pendientes de L12

- **Escenario «Un fallo se ve»:** se corrige en la delta de `production-release`.
- **Escenario «Un pull request en rojo no se funde»:** se anota como evidencia (M) el PR #5. Tenía los cinco trabajos en rojo y GitHub lo marcó `BLOCKED` mientras estuvo abierto. La spec no cambia.

## Dónde vive cada pieza

| Pieza | Carpeta | Prueba |
|---|---|---|
| Comprobaciones de la zona | `scripts/lib/verify-site.ts` | Unitaria |
| Dominio del token | `src/adapters/turnstile/` | Unitaria |
| Dominio en producción | `src/lib/server/container.ts` | Unitaria |
| Ajustes de la zona y de Turnstile | Panel de Cloudflare | Manual, con `verify:site` y `curl` |
| Inventario de la zona | `docs/operations.md` | Manual |
| Escenarios L13 | `docs/escenarios.md` | — |

No hace falta un ADR nuevo: D2 decidió la redirección, y lo demás aplica el ADR-0006 y el ADR-0017.

## Riesgos

- **Una regla de redirección mal escrita deja `www` sin servicio, o crea un bucle.** La comprobación de `verify:site` lo detecta, y la regla se desactiva en un clic.
- **La regla de frecuencia puede bloquear a una red compartida,** por ejemplo una oficina tras una sola IP. El umbral es holgado y el bloqueo dura 10 segundos. Solo afecta a la analítica, nunca a la página ni al formulario.
- **Si `hostname` faltara en la respuesta de Turnstile,** el servidor rechazaría tokens válidos en producción. Se mitiga probando un envío real tras desplegar y con la vuelta atrás de siempre (`wrangler rollback`).
- **La configuración del panel no está versionada.** El inventario de `docs/operations.md` y `verify:site` son la red de seguridad hasta L14.
