// Reglas de arquitectura del proyecto (CLAUDE.md · «Dependencias permitidas», ADR-0007, ADR-0008).
// Los imports entre carpetas usan el alias "@/…"; los relativos, solo dentro de la misma carpeta.
// Cada regla cubre import/export … from, import() dinámico y require().

const EXT = "{ts,tsx,js,jsx,mjs,mts,cts}";

/** Rodeos que ninguna carpeta puede usar para saltarse su regla. */
const TRAVERSAL = {
  regex: "^\\./\\.\\./|(?:^|/)(?!\\.{1,2}/)[^/]+/\\.{1,2}(?:/|$)",
  message: "Ruta con segmentos «./» o «../» intercalados: escribe la ruta directa.",
};
const ESCAPE = {
  regex: "^(?:\\.\\./)+(?:src|app|components|domain|adapters|i18n|lib|styles|worker)(?:/|$)",
  message: "Usa el alias @/ para importar desde otra carpeta; las rutas relativas son solo para la propia.",
};

const COLOR =
  "(?<![\\w&])#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})(?![0-9a-z_-])" +
  "|\\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb|color)\\((?=\\s*(?:[\\d.+-]|from\\b|var\\(|calc\\(|none\\b|display-p3|srgb|rec2020|a98-rgb|prophoto-rgb|xyz))";
const COLOR_MESSAGE = "Color literal fuera de src/styles/tokens.css. Usa un rol semántico (--color-* o --scene-*).";
const inSelector = (regex) => regex.replace(/\//g, "\\/");

const colorSelectors = [
  { selector: `Literal[value=/${inSelector(COLOR)}/i]`, message: COLOR_MESSAGE },
  { selector: `TemplateElement[value.raw=/${inSelector(COLOR)}/i]`, message: COLOR_MESSAGE },
  { selector: "Literal[raw=/^0x[0-9a-f]{6}([0-9a-f]{2})?$/i]", message: COLOR_MESSAGE },
  { selector: `JSXText[value=/${inSelector(COLOR)}/i]`, message: COLOR_MESSAGE },
];

// Three.js pesa: solo se importa en el módulo de la escena, que se carga con import()
// dinámico cuando la página ya es legible (ADR-0009). Si otro archivo lo importara,
// entraría en el JS inicial.
const THREE_MODULE = "src/components/journey/scene/three-scene.ts";
const THREE = {
  regex: "^three(?:/|$)",
  message: `three solo se importa desde ${THREE_MODULE}, que se carga de forma diferida.`,
};

/** Construye el bloque de una carpeta: sus imports prohibidos y, si procede, la regla de colores. */
function folder({ files, ignores, forbidden = [], colors = true, three = false }) {
  const patterns = [...forbidden, TRAVERSAL, ESCAPE, ...(three ? [] : [THREE])];
  const dynamic = patterns.flatMap(({ regex, message }) => [
    { selector: `ImportExpression[source.value=/${inSelector(regex)}/]`, message },
    {
      selector: `CallExpression[callee.name='require'][arguments.0.value=/${inSelector(regex)}/]`,
      message,
    },
  ]);
  return {
    files,
    ...(ignores ? { ignores } : {}),
    rules: {
      "no-restricted-imports": ["error", { patterns }],
      "no-restricted-syntax": ["error", ...dynamic, ...(colors ? colorSelectors : [])],
    },
  };
}

const SERVER_SIDE = [
  { regex: "^@/(?:app|components)(?:/|$)", message: "El código de servidor no puede importar rutas ni componentes." },
];

export const architecture = [
  // Base: todo src/ sin colores literales ni rodeos, aunque la carpeta no tenga regla propia.
  folder({ files: [`src/**/*.${EXT}`] }),

  // domain → solo zod y el propio dominio
  folder({
    files: [`src/domain/**/*.${EXT}`],
    forbidden: [
      {
        regex: "^(?!zod$|zod/|\\./|\\.\\./|@/domain/)",
        message: "El dominio solo puede importar `zod` y módulos del propio dominio.",
      },
    ],
  }),

  // components → domain, i18n, lib (nunca lib/server, adapters ni rutas)
  folder({
    files: [`src/components/**/*.${EXT}`],
    forbidden: [
      {
        regex: "^@/(?:adapters|lib/server|app)(?:/|$)",
        message: "Un componente no puede importar adaptadores, código de servidor ni rutas.",
      },
    ],
  }),
  // La única excepción a la regla de three: el módulo de la escena 3D.
  folder({
    files: [THREE_MODULE],
    forbidden: [
      {
        regex: "^@/(?:adapters|lib/server|app)(?:/|$)",
        message: "Un componente no puede importar adaptadores, código de servidor ni rutas.",
      },
    ],
    three: true,
  }),

  // adapters → domain
  folder({
    files: [`src/adapters/**/*.${EXT}`],
    forbidden: [
      {
        regex: "^@/(?!adapters/|domain/)",
        message: "Un adaptador solo puede importar del dominio y de otros adaptadores.",
      },
    ],
  }),

  // i18n → nada del proyecto
  folder({
    files: [`src/i18n/**/*.${EXT}`],
    forbidden: [{ regex: "^@/(?!i18n/)", message: "i18n no puede importar otras carpetas del proyecto." }],
  }),
  // Los diccionarios son texto: pueden contener «#» sin que sea un color.
  folder({
    files: [`src/i18n/dictionaries/**/*.${EXT}`],
    forbidden: [{ regex: "^@/(?!i18n/)", message: "i18n no puede importar otras carpetas del proyecto." }],
    colors: false,
  }),

  // lib (segura para el cliente) → nada del proyecto, y nunca lib/server
  folder({
    files: [`src/lib/**/*.${EXT}`],
    ignores: ["src/lib/server/**"],
    forbidden: [
      {
        regex: "^@/(?!lib/)|^@/lib/server(?:/|$)|^(?:\\./|\\.\\./)+(?:.*/)?server(?:/|$)",
        message: "lib/ es segura para el cliente: no puede importar otras carpetas ni lib/server.",
      },
    ],
  }),

  // lib/server y worker → adapters, domain, i18n, lib
  folder({ files: [`src/lib/server/**/*.${EXT}`, `worker/**/*.${EXT}`], forbidden: SERVER_SIDE }),

  // app → components, lib, lib/server, domain, i18n (nunca adapters)
  folder({
    files: [`src/app/**/*.${EXT}`],
    forbidden: [
      {
        regex: "^@/adapters(?:/|$)",
        message: "Las rutas piden sus dependencias a lib/server, no a los adaptadores.",
      },
    ],
  }),
];
