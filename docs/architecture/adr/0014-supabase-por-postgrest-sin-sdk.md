# ADR-0014: Supabase por PostgREST con `fetch`, sin SDK

**Estado:** Aceptada · **Fecha:** 2026-11-14 · **Decide:** fundador de Confia.ing (propuesta del lote L5)

## Contexto

El formulario de consulta guarda una fila en `contact_requests`. Es la única operación de la v1 contra la base de datos, junto con el latido diario que evita la pausa del proyecto. El código corre en un Worker de Cloudflare cuyo tamaño comprimido no puede pasar de 3 MiB en el plan gratuito, y Next.js ya ocupa cerca de un tercio.

Supabase expone cada tabla por HTTP con PostgREST. El SDK oficial (`@supabase/supabase-js`) es una capa sobre esa misma API que añade autenticación de usuarios, tiempo real y almacenamiento de archivos, nada de lo cual usa la v1.

## Decisión

El adaptador `src/adapters/supabase/contact-repository.ts` llama a PostgREST con `fetch`: un `POST` a `/rest/v1/contact_requests` con la secret key en las cabeceras y `Prefer: return=representation`. No se instala el SDK.

La secret key solo existe en el servidor (`src/lib/server/env.ts`); el navegador nunca habla con Supabase (ADR-0002).

## Opciones consideradas

| Opción | Peso en el Worker | Superficie | Coste |
|---|---|---|---|
| **`fetch` a PostgREST (elegida)** | Ninguno | Una función de unas cuarenta líneas | La forma de la petición y de los errores se mantiene a mano; lo cubre la prueba de contrato |
| `@supabase/supabase-js` | Decenas de kB comprimidos, más sus dependencias | Cliente completo: auth, realtime, storage | Peso y código sin uso; un cliente pensado también para el navegador invita a usarlo allí |
| `@supabase/postgrest-js` solo | Menor que el SDK | Constructor de consultas | Una dependencia más para una sola inserción |
| Conexión Postgres directa (Hyperdrive) | Controlador de Postgres | SQL libre | Salta RLS y PostgREST; Hyperdrive no entra en el plan elegido |

## Consecuencias

- El Worker no crece por la base de datos: 1030 KiB de 3072 con todos los adaptadores reales.
- El contrato con Supabase se comprueba con `npm run test:contract` contra la base local: inserción, restricciones, RLS sin políticas y rechazo de las claves anónimas.
- Si la v2 necesita consultas variadas, autenticación de usuarios o tiempo real, se revisa esta decisión; el puerto `ContactRepository` aísla el cambio en un archivo.
- Un cambio de PostgREST en el formato de errores no rompe el flujo: cualquier respuesta que no sea 201 se trata como fallo del almacén y el visitante ve el aviso con el correo.
