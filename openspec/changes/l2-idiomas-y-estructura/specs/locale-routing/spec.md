# Spec Delta

## Purpose

Define en qué idioma entra cada visitante, cómo cambia de idioma, cómo se recuerda su elección y qué página de un idioma equivale a cada página del otro.

## ADDED Requirements

### Requirement: La raíz lleva al idioma del visitante
Una petición a `/` MUST redirigir a `/es` o `/en` según, por este orden: la cookie `locale` si contiene un idioma admitido, la cabecera `Accept-Language`, y español. La respuesta no MUST poder guardarse en cachés compartidas.

#### Scenario: Navegador en inglés (I · L2-1)
- **GIVEN** una petición a `/` sin cookie con `Accept-Language: en-US,en;q=0.9`
- **WHEN** responde
- **THEN** redirige a `/en`

#### Scenario: Idioma no admitido (I · L2-1)
- **GIVEN** una petición a `/` sin cookie con `Accept-Language: fr-FR`
- **WHEN** responde
- **THEN** redirige a `/es`

#### Scenario: La cookie manda sobre el navegador (I · L2-1)
- **GIVEN** la cookie `locale=en` y `Accept-Language: es`
- **WHEN** se pide `/`
- **THEN** redirige a `/en`

#### Scenario: Sin cabecera ni cookie (I)
- **GIVEN** una petición a `/` sin cookie y sin `Accept-Language`
- **WHEN** responde
- **THEN** redirige a `/es`

#### Scenario: Cookie con un valor no admitido (I)
- **GIVEN** la cookie `locale=fr` y `Accept-Language: en`
- **WHEN** se pide `/`
- **THEN** la cookie se ignora y redirige a `/en`

#### Scenario: La consulta de la URL se conserva (I)
- **GIVEN** una petición a `/?utm_source=boletin`
- **WHEN** responde
- **THEN** redirige a la home del idioma con la misma consulta

#### Scenario: Redirección temporal y sin caché compartida (I)
- **GIVEN** cualquier petición a `/`
- **WHEN** responde
- **THEN** el estado es 302 o 307
- **AND** la respuesta indica que no se guarde en cachés compartidas

### Requirement: Negociación del idioma del navegador
La elección a partir de `Accept-Language` MUST respetar las preferencias ponderadas, aceptar variantes regionales de un idioma admitido y ignorar entradas mal formadas.

#### Scenario: Preferencias ponderadas (U)
- **GIVEN** `Accept-Language: fr;q=0.9, en;q=0.8, es;q=0.7`
- **WHEN** se negocia
- **THEN** el resultado es `en`

#### Scenario: Variante regional (U)
- **GIVEN** `Accept-Language: es-CO`
- **WHEN** se negocia
- **THEN** el resultado es `es`

#### Scenario: Cabecera mal formada o comodín (U)
- **GIVEN** `Accept-Language` vacío, `*` o con texto que no es una lista de idiomas
- **WHEN** se negocia
- **THEN** el resultado es `es`

#### Scenario: Idioma con peso cero (U)
- **GIVEN** `Accept-Language: en;q=0, es`
- **WHEN** se negocia
- **THEN** el resultado es `es`

### Requirement: La URL manda sobre la detección
Una página pedida con su idioma en la URL MUST servirse en ese idioma sin redirigir, sea cual sea la cookie o el idioma del navegador.

#### Scenario: Entrada directa a /en (E · L2-1)
- **GIVEN** una petición directa a `/en` con `Accept-Language: es` y la cookie `locale=es`
- **WHEN** responde
- **THEN** sirve `/en` con `lang="en"` sin redirigir

### Requirement: Página equivalente en el otro idioma
Cada página MUST tener una equivalente en el otro idioma: la home con la home, privacidad con privacidad y términos con términos. Una ruta sin equivalente MUST llevar a la home del idioma elegido.

#### Scenario: Rutas equivalentes (U)
- **GIVEN** las rutas `/es`, `/es/privacidad` y `/es/terminos`
- **WHEN** se pide su equivalente en inglés
- **THEN** son `/en`, `/en/privacy` y `/en/terms`, y a la inversa

#### Scenario: Ruta desconocida (U)
- **GIVEN** la ruta `/es/no-existe`
- **WHEN** se pide su equivalente en inglés
- **THEN** es `/en`

### Requirement: Cambio manual de idioma
El selector de idioma MUST llevar a la página equivalente en el idioma elegido y guardar la elección en la cookie `locale`. MUST funcionar sin JavaScript.

#### Scenario: Cambiar desde una página legal (E · L2-2)
- **GIVEN** el visitante en `/es/privacidad`
- **WHEN** elige EN
- **THEN** llega a `/en/privacy`
- **AND** la cookie `locale` vale `en`

#### Scenario: La elección se recuerda (E · L2-2)
- **GIVEN** que eligió EN
- **WHEN** vuelve a `/`
- **THEN** es llevado a `/en`

#### Scenario: Sin JavaScript (E)
- **GIVEN** el navegador con JavaScript desactivado en `/es`
- **WHEN** elige EN
- **THEN** llega a `/en` y la cookie `locale` vale `en`

#### Scenario: El idioma activo está señalado (I)
- **GIVEN** el selector en una página en español
- **WHEN** se renderiza
- **THEN** ES está marcado como idioma actual y EN es un enlace con `hreflang="en"` y `lang="en"`

### Requirement: El cambio de idioma no redirige fuera del sitio
El punto que guarda la elección MUST aceptar solo idiomas admitidos y MUST redirigir únicamente a rutas del propio sitio, calculadas en el servidor.

#### Scenario: Destino externo (I)
- **GIVEN** una petición de cambio a `en` que indica como origen `https://otro.sitio/` o `//otro.sitio`
- **WHEN** responde
- **THEN** redirige a `/en` y a ningún otro origen

#### Scenario: Idioma no admitido (I)
- **GIVEN** una petición de cambio al idioma `fr`
- **WHEN** responde
- **THEN** no guarda ninguna cookie y redirige a `/`

### Requirement: Cookie de preferencia
La cookie `locale` MUST contener solo `es` o `en`, valer para todo el sitio, durar un año, enviarse solo por HTTPS en producción y no identificar al visitante.

#### Scenario: Atributos de la cookie (I)
- **GIVEN** un cambio de idioma a `en`
- **WHEN** se inspecciona la cookie de la respuesta
- **THEN** su valor es `en`, con `Path=/`, `Max-Age` de un año y `SameSite=Lax`

#### Scenario: Solo por HTTPS fuera de la máquina de desarrollo (I)
- **GIVEN** un cambio de idioma en un host que no es local
- **WHEN** se inspecciona la cookie
- **THEN** lleva `Secure`, aunque el servidor vea la petición por HTTP

### Requirement: Metadatos por idioma
Cada página MUST declarar su idioma, su URL canónica y los enlaces alternos a su equivalente en cada idioma, con `x-default` apuntando a la versión en español.

#### Scenario: Alternos de la home (E)
- **GIVEN** `/en`
- **WHEN** se lee su cabecera HTML
- **THEN** la canónica termina en `/en`
- **AND** hay alternos `es` → `/es`, `en` → `/en` y `x-default` → `/es`

#### Scenario: Alternos de una página legal (E)
- **GIVEN** `/es/privacidad`
- **WHEN** se lee su cabecera HTML
- **THEN** el alterno `en` apunta a `/en/privacy`
