# Diseño — L12 Protección en GitHub

## Contexto

Repositorio público `confiaing/confiahome`, cuenta personal en el plan Free. `main` no tiene protección (la API responde «Branch not protected»). La CI (`ci.yml`) tiene cuatro trabajos y ya corrió en `main`, así que GitHub conoce sus nombres. El verificador (`scripts/verify-production.ts` y `scripts/lib/verify-site.ts`) no importa paquetes: solo usa `fetch`. La sesión de `gh` del fundador tiene los permisos `repo` y `workflow`.

## Decisiones

### 1. Protección clásica de rama, por API

```
gh api -X PUT repos/confiaing/confiahome/branches/main/protection --input <json>
```

Contenido del JSON:

- `required_status_checks`: `strict: true` y los contextos `quality`, `contract`, `e2e` y `e2e-preview`;
- `required_pull_request_reviews` con 0 aprobaciones (el fundador es el único revisor);
- `enforce_admins: true`: decisión del fundador del 2026-11-16;
- sin forzar historial ni borrar la rama.

El JSON vive en `.github/branch-protection.json`, para que se pueda revisar y volver a aplicar. La CLI de `gh` no tiene un comando propio para esto.

*Alternativa descartada: reglas de repositorio (rulesets).* Hacen lo mismo y son más nuevas, pero la protección clásica es más sencilla de consultar y de documentar. En el plan Free, ambas dejan de aplicarse si el repositorio pasa a privado (D3).

### 2. Orden para no bloquearse

1. Trabajo en la rama `lote/l12-proteccion-en-github`.
2. Push de la rama y apertura del pull request, con la orden del fundador.
3. CI en verde.
4. Activar la protección.
5. Fundir el pull request de L12: es la prueba real de que la protección funciona.

Con la protección activa, cerrar un lote significa fundir su pull request, no hacer push a `main`.

### 3. `verify-production.yml`

- Disparo `schedule` a las 09:37 UTC, una hora después de la tarea diaria del Worker (08:17). Si Supabase o la tarea fallan, se ve el mismo día.
- Disparo `workflow_dispatch` para lanzarlo a mano.
- Un solo trabajo: `checkout` y `setup-node` 26, sin `npm ci`, seguido de `node scripts/verify-production.ts https://confia.ing`.
- `permissions: contents: read` y `concurrency` para no solaparse.

**Aviso:** GitHub suspende los workflows programados de un repositorio público tras 60 días sin actividad. Se documenta en `docs/operations.md`.

### 4. Dependencias

- **`.github/dependabot.yml`:**
  - `npm` semanal, con un grupo para las versiones menores y de parche y como máximo 5 pull requests abiertos;
  - `github-actions` semanal.
  - Las versiones mayores llegan sueltas: suelen romper algo y conviene revisarlas una a una.
- **`.github/workflows/audit.yml`:**
  - `schedule` semanal, `workflow_dispatch` y `pull_request` con filtro de rutas (`package.json`, `package-lock.json`);
  - `npm audit --audit-level=high` tras `npm ci`;
  - solo lectura.
  - No se añade a la puerta de cierre: depende de la red y de avisos ajenos al cambio.

### 5. Pruebas

Una prueba nueva, `tests/unit/github-automation.test.ts`, lee los YAML con `yaml`, como en L11, y comprueba:

- disparos;
- permisos de solo lectura;
- que no hay `secrets.`, `wrangler deploy` ni `git push`;
- el dominio `https://confia.ing`;
- los ecosistemas de Dependabot;
- el nivel de `npm audit`;
- que el JSON de protección nombra exactamente los trabajos de `ci.yml`.

Nivel: unitario. La protección real, la primera vigilancia y la primera auditoría son comprobaciones manuales (M), con evidencia en `tasks.md`.

## Dónde vive cada pieza

| Pieza | Carpeta |
|---|---|
| Workflows y Dependabot | `.github/` |
| Reglas de protección | `.github/branch-protection.json` |
| Pruebas | `tests/unit/github-automation.test.ts` |
| Operación | `docs/operations.md` |

No se necesita un ADR nuevo: el ADR-0017 ya recoge la decisión; se actualiza su lista de pendientes.

## Riesgos

- **Un fallo del verificador que no viene del sitio** (red de GitHub, límite de Cloudflare). Se acepta un rojo ocasional. Si se repite, el verificador ganará reintentos en otro lote.
- **Dependabot puede abrir pull requests que fallen la CI.** Es lo esperado: la CI decide.
- **`enforce_admins` activado.** Una urgencia también pasa por pull request, y la CI tarda unos 10 minutos. `docs/operations.md` explica cómo desactivarlo temporalmente si hiciera falta.
