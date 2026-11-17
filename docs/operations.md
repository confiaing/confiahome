# Operación del sitio

Para quien atiende `confia.ing`. Los pasos de cuentas y accesos están en [docs/setup.md](setup.md). Ningún valor secreto va en el chat ni en git.

## Desplegar

Desde la máquina con sesión de `wrangler` y con `.env.prod` ([ADR-0017](architecture/adr/0017-integracion-continua-y-despliegue.md)):

```bash
npm run release:check   # comprueba el entorno de producción; no muestra valores
npm run release         # repite la comprobación y construye el Worker (build:worker)
npx wrangler deploy     # despliega ese build
npm run verify:site -- https://confia.ing
```

`verify:site` es de solo lectura: revisa respuestas, cabeceras, `robots`, `sitemap` y `llms.txt`, y que una consulta sin token se rechace.

**Nunca uses `opennextjs-cloudflare deploy`**: reconstruye sin las comprobaciones de `release`.

## Volver atrás

```bash
npx wrangler rollback
```

Vuelve a la versión anterior del Worker. Las tablas de Supabase no se borran: quedan como están.

## Secretos

Se cargan en el Worker con `wrangler secret put`; no están en `wrangler.jsonc`:

| Secreto | Para qué |
|---|---|
| `SUPABASE_SECRET_KEY` | Guardar consultas y eventos |
| `TURNSTILE_SECRET_KEY` | Verificar el antispam |
| `SUPABASE_URL` | Dirección de la base |
| `NOTIFY_TO` | Buzón verificado que recibe el aviso |

```bash
npx wrangler secret put SUPABASE_SECRET_KEY
```

Para rotar uno:

1. Genera el valor nuevo en el proveedor (Supabase o Turnstile; pasos 3 y 5 de [setup.md](setup.md)).
2. Cárgalo con `npx wrangler secret put <NOMBRE>`.
3. Verifica con `npm run verify:site -- https://confia.ing` y una consulta de prueba.

## Leer y responder consultas

- **En Supabase:** panel del proyecto, tabla `contact_requests`.
- **Por correo:** cada consulta genera un aviso a `NOTIFY_TO` (hola@confia.ing). Responde desde ese buzón: el correo del visitante va en `Reply-To` ([setup.md](setup.md), sección 7).

## Atender una petición de supresión de datos

1. Borra la fila de la persona en `contact_requests` (panel de Supabase).
2. Borra su correo del buzón de avisos: el sitio no puede hacerlo.
3. Confirma a la persona.

Los eventos de analítica son anónimos y no se asocian a nadie. Más en [docs/legal/README.md](legal/README.md).

## Analítica

Qué se mide y cómo consultarlo: [docs/analytics.md](analytics.md).

## Tarea diaria

El Worker ejecuta cada día a las 08:17 UTC (`triggers.crons` en `wrangler.jsonc`) una consulta mínima a la base, contra la pausa de Supabase, y borra por fecha las consultas con más de 24 meses y los eventos con más de 13 ([ADR-0016](architecture/adr/0016-entrada-propia-del-worker-cabeceras-y-tarea-diaria.md)).

Para comprobarla, mira los registros del Worker (panel de Cloudflare, o `npx wrangler tail` en vivo) y busca `maintenance.done`: indica `heartbeat`, `contactsPurged` y `eventsPurged`. Un `-1` significa que ese borrado falló. También existen `maintenance.heartbeat-failed` y `maintenance.not-started` (configuración incompleta).

## Vigilancia diaria

GitHub ejecuta cada día a las 09:37 UTC, después de la tarea diaria, las mismas comprobaciones que `verify:site` tras un despliegue ([`verify-production.yml`](../.github/workflows/verify-production.yml)). Solo lee: no usa secretos ni crea datos. Para lanzarla a mano:

```bash
gh workflow run verify-production.yml
```

**Si falla**, GitHub avisa por correo a la cuenta que modificó por última vez el `cron` del workflow (hoy, la del fundador), si tiene activadas las notificaciones de Actions. Si otra cuenta lo cambia, pasa a avisarla a ella. En la ejecución, cada línea `✗` dice qué comprobación falló. Revisa en este orden:

1. **¿Es el sitio o es la red?** Abre https://confia.ing/es y relanza el workflow. Un fallo aislado de red de GitHub se acepta; si se repite, es el sitio.
2. **Respuestas que no son 200, o cabeceras que faltan:** registros del Worker y versión desplegada. Si coincide con un despliegue reciente, vuelve atrás con `npx wrangler rollback`.
3. **La consulta sin token no se rechaza:** trátalo como urgente; el antispam no se está aplicando. Revisa el secreto `TURNSTILE_SECRET_KEY` y [Si el formulario falla](#si-el-formulario-falla).
**Lo que no ve:** la vigilancia no llega a la base. La consulta sin token se rechaza en el antispam, antes de guardar nada, así que Supabase pausado, un `SUPABASE_SECRET_KEY` caducado o un fallo de la tarea diaria la dejan en verde. Eso se comprueba en los registros del Worker ([Tarea diaria](#tarea-diaria)) y con una consulta de prueba real tras cada cambio de secretos.

**GitHub suspende los workflows programados** de un repositorio público tras 60 días sin actividad en él, y avisa por correo antes. Para reactivarlos: pestaña Actions del repositorio, elige el workflow y pulsa «Enable workflow», o:

```bash
gh workflow enable verify-production.yml
```

```bash
gh workflow enable audit.yml
```

## Dependencias

- **Dependabot** ([`dependabot.yml`](../.github/dependabot.yml)) abre cada semana pull requests para npm y las acciones de GitHub. Las menores y de parche de npm llegan juntas; cada versión mayor, suelta.
- **Auditoría** ([`audit.yml`](../.github/workflows/audit.yml)): `npm audit --audit-level=high` cada lunes, a demanda y en cada pull request que cambia `package.json` o `package-lock.json`. En rojo si hay una vulnerabilidad alta o crítica conocida.

**Cómo revisar un pull request de Dependabot:**

1. Espera la CI. En rojo, no se funde: se corrige en la misma rama o se cierra con un comentario del motivo.
2. Lee las notas de la versión, sobre todo en las mayores, y fíjate en Next.js, OpenNext, Wrangler y Three.js: son las que cambian el tamaño del Worker o del JS inicial.
3. En verde y sin sorpresas, se funde. Lo que llega a producción es lo que se despliega después, no la fusión.

**Si la auditoría falla:** actualiza el paquete si hay versión corregida (`npm audit fix`, sin `--force`, en una rama). Si no la hay o el fallo no afecta al sitio (por ejemplo, una dependencia solo de desarrollo), anótalo como aceptado, con el motivo, en el lote en curso.

## Protección de `main`

`main` solo acepta cambios por pull request, con `quality`, `contract`, `e2e` y `e2e-preview` en verde y la rama al día. No se puede forzar su historial ni borrarla. La regla vale también para los administradores. La configuración está en [`branch-protection.json`](../.github/branch-protection.json).

Consultarla:

```bash
gh api repos/confiaing/confiahome/branches/main/protection
```

Aplicarla, o volver a aplicarla tras cambiar el JSON:

```bash
gh api -X PUT repos/confiaing/confiahome/branches/main/protection --input .github/branch-protection.json
```

**En una urgencia** que no pueda esperar a la CI (unos 10 minutos), suspende solo la parte de administradores, empuja y vuelve a activarla en cuanto termines:

```bash
gh api -X DELETE repos/confiaing/confiahome/branches/main/protection/enforce_admins
```

```bash
gh api -X POST repos/confiaing/confiahome/branches/main/protection/enforce_admins
```

Si el repositorio pasa a privado en el plan Free (D3), GitHub deja de aplicar la protección.

## Si el formulario falla

1. **Registros del Worker:** busca los códigos `contact.*`:
   - `contact.limiter-failed`: el límite de frecuencia.
   - `contact.verify-failed`: Turnstile.
   - `contact.save-failed`: la base.
   - `contact.notify-failed`: el correo. La consulta ya está guardada.
2. **Supabase:** el plan gratuito se pausa tras 7 días sin actividad. Si está pausado, reactívalo desde el panel; la tarea diaria existe para evitarlo.
3. **Turnstile:** el widget debe permitir `confia.ing`, y la site key debe estar en el build (`release:check` lo comprueba).
4. **Límite de frecuencia:** 5 consultas por minuto y origen. Un visitante que prueba varias veces seguidas puede toparse con él.
5. Si nada de esto lo explica, vuelve atrás con `npx wrangler rollback`.

## Textos legales

La política y los términos están como borrador hasta tener los datos del responsable y la revisión de un abogado. Cómo pasarlos a vigentes: [docs/legal/README.md](legal/README.md).
