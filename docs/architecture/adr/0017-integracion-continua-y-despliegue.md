# ADR-0017: Integración continua en GitHub Actions y despliegue manual

**Estado:** Aceptada · **Fecha:** 2026-11-16 · **Decide:** fundador de Confia.ing (propuesta del lote L10)

## Contexto

Al subir el repositorio a GitHub hay que impedir que un cambio rompa lo que hoy funciona. La puerta de cierre de `CLAUDE.md` ya existe en local; falta que se ejecute en cada pull request y en cada push a `main`.

Desplegar es otra cuestión. Un despliegue automático obliga a guardar en GitHub un token de Cloudflare y las claves públicas del build. El Worker escribe en una base con datos de personas que han enviado una consulta.

## Decisión

1. **CI en GitHub Actions (`.github/workflows/ci.yml`)** con la misma puerta de cierre que en local, en cuatro trabajos: `quality` (lint, tipos, pruebas, build del Worker y JS inicial), `contract` (Supabase local), `e2e` y `e2e-preview`.
2. **Sin secretos y sin despliegue.** Permisos de solo lectura. Las pruebas usan servicios en memoria o Supabase local.
3. **El despliegue sigue siendo manual**, desde la máquina del fundador: `npm run release` y después `npx wrangler deploy`. `release` comprueba el entorno de producción antes de construir (variables públicas, clave de Turnstile que no sea de prueba, estado de los textos legales) y no muestra valores. Se despliega ese build, no `opennextjs-cloudflare deploy`, que reconstruiría sin las comprobaciones.
4. **Una prueba unitaria** compara los comandos del workflow con la línea de la puerta de cierre de `CLAUDE.md` y vigila que el workflow no tenga secretos ni comandos de despliegue.

## Opciones consideradas

| Opción | Resultado |
|---|---|
| **CI sin secretos + despliegue manual (elegida)** | Ninguna credencial de Cloudflare ni de Supabase sale de la máquina del fundador. El despliegue es deliberado y verificado |
| Despliegue automático al fundir en `main` | Exige un token de Cloudflare en GitHub y publica cualquier cambio fundido, sin revisión humana final |
| Despliegue manual desde GitHub (`workflow_dispatch`) | Es lo que se diseña para la v1.1; no se implementa en la v1 |
| Sin CI | La puerta de cierre dependería de que alguien la ejecute |

## Consecuencias

- La CI tarda: levanta Docker y dos navegadores. Se acepta, porque es la misma puerta que en local.
- Quien despliega es quien tiene sesión de `wrangler` y `.env.prod`. No hay despliegue si el fundador no está.
- El workflow fija Node 26 porque los scripts son `.ts` que `node` ejecuta directamente. `package.json` solo exige `>=24`.
- Las acciones son las oficiales de GitHub, fijadas a su versión mayor.

## Diseño del despliegue continuo para la v1.1

Sin implementar. Un `deploy.yml` con estas piezas:

- **Disparo:** solo `workflow_dispatch`, nunca por push.
- **Entorno `production`** protegido, con aprobación obligatoria de un revisor antes de que el trabajo empiece.
- **Secreto del entorno:** un token de Cloudflare de alcance mínimo (solo desplegar este Worker). No se guarda a nivel de repositorio.
- **Variables del entorno:** las `NEXT_PUBLIC_*` (son públicas: se incrustan en la página).
- **Pasos:** `npm run release:check`, build, `npx wrangler deploy`, `npm run verify:site -- https://confia.ing`.
- **Vuelta atrás:** `npx wrangler rollback`, también manual.
- **Pendiente de decidir entonces:** cómo se cargan los secretos del Worker (`SUPABASE_SECRET_KEY` y los demás); hoy se cargan una vez con `wrangler secret put` y no cambian al desplegar.

## Comprobación continua de producción para la v1.1

Añadido el 2026-11-16, tras revisar cómo se verifica que el sitio sigue funcionando después de cada cambio. Sin implementar.

La CI prueba el código con servicios en memoria, y `verify:site` solo corre cuando alguien despliega. Un fallo que aparezca más tarde en producción (un secreto caducado, Supabase pausado, un servicio externo caído) no lo detecta nadie. Se cubre así:

- **Protección de `main` primero.** Ningún pull request se funde con alguno de los cuatro trabajos en rojo.
- **`verify-production.yml`:** una vez al día (`schedule`) y a demanda (`workflow_dispatch`), ejecuta `npm run verify:site -- https://confia.ing`. Solo lee: sin secretos y con permisos de solo lectura. Si falla, la ejecución queda en rojo y GitHub avisa por correo a quien tenga activadas las notificaciones de Actions.
- **Opcional, por decidir:** una prueba de punta a punta del formulario en producción que envíe una consulta marcada como prueba y la borre después. Exige guardar secretos en un entorno protegido de GitHub y escribe en la base real; solo se hará con una decisión expresa del fundador y su propio ADR.

## Pendiente para la v1.1

- El workflow `deploy.yml` descrito arriba.
- El workflow `verify-production.yml` descrito arriba.
- Protección de la rama `main` que exija los cuatro trabajos de la CI.
- ~~Revisión automática de código en cada pull request.~~ Descartada el 2026-11-16 (decisión D1): `/code-review` en local antes de cada `push`.
- `npm audit` programado cada semana.
- Dependabot para dependencias y acciones.
