# Entorno de desarrollo local

Para quien programa en `confia.ing`. Cómo montar el entorno en una máquina nueva, qué arrancar según lo que vayas a hacer y cómo apagarlo al terminar un lote o una versión. Las cuentas y los accesos de producción están en [setup.md](setup.md); el día a día del sitio publicado, en [operations.md](operations.md).

Ningún paso de esta guía toca producción: en desarrollo, los servicios son los de memoria o un Supabase local en Docker.

## Qué necesitas

| Herramienta | Para qué | Cuándo |
|---|---|---|
| Node 26 y npm | Todo: la CI usa Node 26 | Siempre |
| git y `gh` | Ramas y pull requests | Siempre |
| Docker Desktop | Supabase local | Solo para `test:contract` o `SERVICES=real` |
| Navegadores de Playwright | `e2e` y `e2e:preview` | Al pasar la puerta de cierre |

La CLI de Supabase y Wrangler vienen con `npm install`: se llaman con `npx`.

## Montarlo por primera vez

1. Clona el repositorio e instala las dependencias:

   ```bash
   git clone https://github.com/confiaing/confiahome.git
   ```

   ```bash
   cd confiahome && npm install
   ```

2. Instala los navegadores de las pruebas de extremo a extremo:

   ```bash
   npx playwright install chromium webkit
   ```

3. Crea los archivos de entorno locales. Ninguno se sube a git:
   - **`.env.development.local`**, copiado de [`.env.example`](../.env.example). Deja `SERVICES=memory` y las claves de prueba oficiales de Turnstile que trae la plantilla. Si vas a usar Supabase local, pon `SUPABASE_URL` y `SUPABASE_SECRET_KEY` con lo que imprime `npx supabase status` (paso de abajo). Nunca pongas aquí valores de producción.
   - **`.dev.vars`**, para `preview` y `e2e:preview`, con una sola línea:

     ```bash
     echo "SERVICES=memory" > .dev.vars
     ```

   `.env` y `.env.local` no llevan secretos: `build:worker` falla si encuentra alguno.

4. Comprueba que todo funciona:

   ```bash
   npm run dev
   ```

   Abre http://localhost:3000/es. Con servicios en memoria el formulario funciona sin base de datos.

## Qué arrancar según lo que hagas

| Vas a… | Arranca | Docker |
|---|---|---|
| Cambiar la interfaz o los textos | `npm run dev` | No |
| Pasar pruebas unitarias, de integración o e2e | `npm test`, `npm run e2e` | No |
| Probar cabeceras, CSP o el Worker | `npm run preview` o `npm run e2e:preview` | No |
| Probar los adaptadores contra la base | `npx supabase start` y `npm run test:contract` | Sí |
| Ver la app con la base local | `npx supabase start` y `SERVICES=real` en `.env.development.local` | Sí |

**Formulario con servicios reales: solo con `npm run dev`.** `npm run preview` construye para producción: sin `NEXT_PUBLIC_SITE_URL` usa `https://confia.ing` y el servidor exige que el token de Turnstile sea de ese dominio. Las claves de prueba emiten tokens de `example.com`, así que con `SERVICES=real` en `.dev.vars` cada envío respondería 403. En `npm run dev` la dirección es local y no se exige el dominio.

### Supabase local

1. Abre Docker Desktop y espera a que indique que está activo.
2. Arranca la base. La primera vez descarga las imágenes (varios GB) y tarda unos minutos; después, segundos:

   ```bash
   npx supabase start
   ```

   Aplica las migraciones de `supabase/migrations/`. La API queda en el puerto 54321, Postgres en el 54322 y Studio en http://localhost:54323.

3. Para ver la dirección y las claves locales (son de esta máquina, no de producción):

   ```bash
   npx supabase status
   ```

4. Para volver a una base limpia, con las migraciones aplicadas desde cero:

   ```bash
   npx supabase db reset
   ```

Las pruebas de contrato piden la dirección a `supabase status` y se niegan a correr si no es `localhost`.

## Apagarlo al terminar

Al cerrar un lote, una versión o la jornada, apaga lo que arrancaste. Supabase local mantiene una docena de contenedores en marcha, que consumen memoria y batería aunque no los uses.

### Servidores de Node

`npm run dev` y `npm run preview` se detienen con `Ctrl+C` en su terminal. `e2e:preview` cierra solo su Worker local al terminar. Si quedó algo escuchando en el puerto de desarrollo:

```bash
lsof -ti tcp:3000 -sTCP:LISTEN | xargs kill
```

### Supabase local: tres niveles

1. **Detener, conservando los datos.** Es lo habitual al acabar un lote:

   ```bash
   npx supabase stop
   ```

   Para los contenedores de este proyecto y guarda la base en un volumen de Docker. El próximo `npx supabase start` la recupera tal cual.

2. **Detener y borrar los datos locales.** Al cerrar una versión, o si la base local quedó en un estado raro:

   ```bash
   npx supabase stop --no-backup
   ```

   Borra los volúmenes de este proyecto. El próximo `start` crea una base nueva con las migraciones. No afecta a producción.

3. **Liberar disco.** Las imágenes de Supabase ocupan varios GB y se quedan aunque los contenedores estén parados. Si no vas a desarrollar en una temporada, primero el paso 2 y después:

   ```bash
   docker image prune -a
   ```

   Borra **todas** las imágenes de Docker que no use ningún contenedor, también las de otros proyectos. Docker pide confirmación. El próximo `npx supabase start` las vuelve a descargar.

Después puedes cerrar Docker Desktop.

**Comprobar que quedó apagado:**

```bash
docker ps --filter name=confia.ing-home
```

Sin filas, no queda nada de este proyecto en marcha.

**No uses `docker stop $(docker ps -q)` ni `docker system prune`:** detienen o borran también los contenedores de otros proyectos de la máquina. `npx supabase stop` solo toca los de este.

### Lista de cierre de un lote o una versión

- [ ] La puerta de cierre pasó, y el pull request está abierto o fundido.
- [ ] `dev` y `preview` detenidos.
- [ ] `npx supabase stop` (lote) o `npx supabase stop --no-backup` (versión).
- [ ] `docker ps --filter name=confia.ing-home` sin filas.
- [ ] Docker Desktop cerrado, si no lo usa otro proyecto.
