# ADR-0012: El cambio de idioma pasa por un punto del servidor

**Estado:** Aceptada · **Fecha:** 2026-11-14 · **Decide:** fundador de Confia.ing (propuesta del lote L2)

## Contexto

El [ADR-0004](0004-internacionalizacion.md) fijó que el selector de idioma «guarda la cookie `locale` y navega a la ruta equivalente», sin decir quién escribe la cookie. Las páginas son estáticas y no hay middleware, así que ninguna página puede escribirla al servirse. El PRD pide que la elección persista entre visitas y que no haya cambios repetidos de idioma.

## Decisión

El selector es un enlace normal a `GET /api/locale?to=<idioma>`. Ese Route Handler:

1. Acepta solo `es` o `en`. Con cualquier otro valor redirige a `/` sin guardar nada.
2. Averigua de qué página viene el visitante por la cabecera `Referer`, solo si es del mismo sitio, y busca su equivalente en la tabla de rutas (`src/i18n/routes.ts`). Si no la reconoce, usa la home del idioma elegido.
3. Responde con una redirección 307 **relativa** y la cookie `locale` (`Path=/`, un año, `SameSite=Lax`, `HttpOnly` y `Secure` salvo en la máquina de desarrollo), sin caché.

El destino sale siempre de la tabla de rutas: ningún dato de la petición se copia a la cabecera `Location`.

## Opciones consideradas

| Opción | Sin JavaScript | Duración de la cookie | Coste |
|---|---|---|---|
| **Punto del servidor (elegida)** | Funciona | Un año: la escribe el servidor | Un salto de redirección al cambiar de idioma |
| Enlace directo a la página equivalente y cookie escrita con JavaScript | Navega, pero no recuerda la elección | Safari limita a 7 días las cookies escritas por script | Un componente de cliente más en cabecera y pie |
| Sin cookie: recordar solo por la URL | Funciona | — | Al volver a `/` se pierde la elección |
| Pasar la página de origen como parámetro (`?from=`) | Funciona | Un año | La cabecera y el pie tendrían que conocer la ruta actual, que el layout no recibe; y es un dato más que validar |

## Consecuencias

- El selector no necesita JavaScript ni saber en qué página está: el mismo enlace vale en la cabecera, el pie y la página 404.
- **Depende de la `Referrer-Policy`.** Con la política por defecto de los navegadores funciona. Si el lote L9 fija una, debe ser `strict-origin-when-cross-origin` o `same-origin`; con `no-referrer`, `origin` o `strict-origin` el selector llevaría siempre a la home. Hay una prueba E2E que lo detectaría.
- Si el navegador no envía `Referer` (algunas extensiones de privacidad), el cambio de idioma lleva a la home en lugar de a la página equivalente.
- Cambiar de idioma no conserva el ancla (`#como`): el servidor no la recibe.
- Es un `GET` que escribe una cookie. Un precargador que siguiera el enlace cambiaría la preferencia de ese navegador; se mitiga con un `<a>` normal (sin precarga) y `rel="nofollow"`. El efecto se corrige con un clic.
- Los buscadores no dependen de este enlace: cada página declara sus alternos `hreflang` en la cabecera HTML.
- Cualquier sitio puede fijar el idioma de un visitante enlazando a este punto, y una petición `HEAD` también escribe la cookie. El único efecto es el idioma.
- `/` y `/api/locale` son las primeras rutas que se ejecutan en el Worker en cada petición. Comprobado en el runtime de Workers el 2026-11-14; la salida está en `openspec/changes/l2-idiomas-y-estructura/tasks.md`, sección «Evidencia».
