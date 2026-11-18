# L12 — Protección en GitHub

## Why

Hoy un push a `main` entra aunque la CI esté en rojo. Nadie se entera si producción se rompe después de un despliegue, ni si una dependencia publica una vulnerabilidad. La v1 está en producción y el repositorio es público: estas tres vigilancias son baratas, gratuitas en un repositorio público y no necesitan secretos.

## What Changes

Lote **L12** del BACKLOG («v1.1 — Plan»). Recoge la tarea 5.6 de L10, trasladada aquí.

- **Protección de `main`.** Exige los cuatro trabajos de la CI (`quality`, `contract`, `e2e`, `e2e-preview`) y que el cambio llegue por pull request. Prohíbe forzar el historial y borrar la rama. Se activa con `gh api` y con la orden del fundador.
- **Trabajo por rama y pull request.** Cada lote, en una rama `lote/<nombre>`. El propio L12 es el primer pull request que pasa por la protección.
- **Comprobación diaria de producción** (`.github/workflows/verify-production.yml`):
  - ejecuta `verify:site` contra `https://confia.ing` cada día y a demanda;
  - sin secretos y con permisos de solo lectura;
  - si falla, GitHub avisa por correo.
- **Dependencias vigiladas.**
  - `dependabot.yml`: npm y Actions, una vez por semana, con las actualizaciones menores agrupadas.
  - `audit.yml`: `npm audit` semanal y en cada cambio de dependencias; falla si hay vulnerabilidades altas o críticas.
- **Pruebas unitarias** de los workflows nuevos: disparos, permisos, ningún secreto, ningún despliegue y el dominio correcto.
- **Documentación.** El flujo de rama, pull request y fusión, en README y `CLAUDE.md`. Qué hacer cuando falla la comprobación diaria, en `docs/operations.md`.

## Capabilities

### New Capabilities
- Ninguna.

### Modified Capabilities
- `repository-and-ci`:
  - «Rama principal protegida» pasa a concretar qué se exige.
  - Nueva exigencia: «Dependencias vigiladas».
- `production-release`: nueva exigencia «Vigilancia diaria de producción».

## Fuera de alcance

- Cloudflare, `www` y Turnstile (L13); despliegue desde GitHub (L14).
- Revisión automática de código en GitHub: descartada en D1.
- Fusionar o actualizar dependencias: Dependabot abre pull requests, el fundador decide cada uno.
- Repositorio privado (D3, L16). En un repositorio privado del plan Free, la protección deja de aplicarse.

## ADR aplicables

ADR-0017 (CI sin secretos; comprobación continua de producción). No lo contradice: lo implementa en parte.

## Impact

`.github/` (dos workflows y `dependabot.yml`), ajustes del repositorio en GitHub, `tests/unit/`, README, `CLAUDE.md`, `docs/operations.md` y BACKLOG. No cambia `src/`, `worker/` ni producción.

## Decisión del fundador

**Decidido el 2026-11-16: sí, también a los administradores** (`enforce_admins: true`).

**¿La protección se aplica también a los administradores?**

- **Sí (recomendado):** nadie, ni tú, empuja directo a `main`; todo pasa por pull request con la CI en verde.
- **No:** tú puedes empujar directo en una urgencia, pero la regla deja de ser una garantía.

En ambos casos, un pull request tuyo no necesita aprobación de otra persona: eres el único revisor.
