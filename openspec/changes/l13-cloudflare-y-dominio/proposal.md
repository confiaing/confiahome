# L13 — Cloudflare y dominio

## Why

La auditoría de la v1 dejó dos riesgos aceptados a la espera de Cloudflare:

- **S-03:** `/api/events` solo tiene el límite del Worker.
- **S-07:** el servidor no comprueba de qué dominio viene el token de Turnstile.

Además, `www.confia.ing` no existe (D2) y nadie vigila la configuración de la zona.

Medido el 2026-11-21: HTTP ya redirige con 301 a HTTPS; `www` no tiene DNS.

## What Changes

Lote **L13** del BACKLOG. Recoge S-03 y S-07 de `docs/security/audit-v1.md`, D2 y dos pendientes de L12.

- **HTTPS en toda la zona:** «Always Use HTTPS» activado y documentado.
- **`www.confia.ing`** redirige con 301 a `confia.ing`, conservando ruta y parámetros: registro DNS con proxy y regla de redirección.
- **Regla de frecuencia de Cloudflare para `POST /api/events`** (S-03): corta las ráfagas antes del Worker.
- **Turnstile solo para `confia.ing`** (S-07): restricción en el panel y, si se decide, comprobación en el servidor.
- **`verify:site`** comprueba HTTP → HTTPS y `www` → dominio, con ruta y parámetros. La vigilancia diaria lo hereda.
- **`docs/operations.md`:** la configuración de la zona y cómo comprobarla.
- **Pendientes de L12:**
  - corregir el escenario «Un fallo se ve»: el aviso llega a quien modificó el `cron` por última vez;
  - anotar como evidencia de «Un pull request en rojo no se funde» el PR #5, que quedó bloqueado.
- **`docs/escenarios.md`:** sección L13.

## Capabilities

### New Capabilities

- Ninguna.

### Modified Capabilities

- `production-release`: la verificación incluye las redirecciones; corrige quién recibe el aviso de la vigilancia.
- `security-headers`: HTTP nunca sirve contenido.
- `analytics-events`: límite también en el borde.
- `contact-submission`: el token debe ser del dominio.

## Fuera de alcance

- L14 y D3.
- La precarga de HSTS.
- Detectar Supabase pausado.
- WAF y planes de pago.

## ADR aplicables

ADR-0006, ADR-0016 y ADR-0017. Ninguno se contradice. No hace falta un ADR nuevo: D2 ya decidió la redirección.

## Impact

- **Código, con sus pruebas:** `scripts/lib/verify-site.ts`, `src/adapters/turnstile/verifier.ts` y `src/lib/server/container.ts`.
- **Documentación:** `operations.md`, `escenarios.md`, `audit-v1.md`, README y BACKLOG.
- **Panel de Cloudflare:** lo configura el fundador con los pasos exactos.
- **Despliegue:** el cambio de Turnstile exige desplegar, con orden del fundador.

## Decisiones del fundador

**Decidido el 2026-11-21: las dos recomendaciones.**

1. **¿El servidor comprueba el dominio del token?**
   - **Sí (recomendado):** rechaza tokens de otros sitios aunque cambie el panel. Exige desplegar.
   - **No:** basta el panel.
2. **Umbral de `/api/events`.** El plan gratuito cuenta por IP en ventanas de 10 segundos.
   - **Recomendado:** 20 peticiones en 10 segundos, con bloqueo de 10 segundos.
