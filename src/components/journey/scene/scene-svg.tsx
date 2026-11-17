import { BOX_SHAPES, projectScene, type ProjectedBox, type ProjectedCircle, type SceneKind } from "@/domain/scene/projection";

// Versión ligera de la escena: el modelo en proyección isométrica. Solo geometría y
// nombres de rol; los colores los pone globals.css desde --scene-*, así cada tema da su
// propia paleta.
//
// Hay cuatro tipos de bloque y cientos de bloques: cada forma se define una vez
// (<symbol>) y cada bloque la reutiliza (<use>). El tono y el estado llegan a las caras
// por propiedades CSS heredadas (--face-*), que sí atraviesan <use>.

const KINDS = Object.keys(BOX_SHAPES) as (keyof typeof BOX_SHAPES)[];
const FACES = ["left", "right", "top"] as const;

// Chromium no aplica las reglas de globals.css a las copias que crea <use>: sin más, las
// caras salían con el relleno por defecto, negro. Por eso cada cara lleva también sus
// atributos de presentación, que viajan con la copia. Solo apuntan a --face-*, que se
// heredan a través de <use>: ningún color literal. No sirve `style=`: la CSP lo bloquea.
const faceAttributes = (face: (typeof FACES)[number]) => ({
  fill: `var(--face-${face})`,
  stroke: "var(--face-line)",
  strokeWidth: "var(--face-line-width)",
  strokeDasharray: "var(--face-dash)",
  strokeLinejoin: "round" as const,
  opacity: "var(--face-opacity)",
});

function Block({ box, scope }: { box: ProjectedBox; scope: string }) {
  const transform = `translate(${box.x} ${box.y})${box.rotate ? ` rotate(${box.rotate})` : ""}`;
  return <use href={`#${scope}-${box.kind}`} data-tone={box.tone} transform={transform} />;
}

function Circle({ circle }: { circle: ProjectedCircle }) {
  return <circle data-circle={circle.role} cx={circle.cx} cy={circle.cy} r={circle.r} />;
}

export function SceneSvg({ kind }: { kind: SceneKind }) {
  const scene = projectScene(kind);
  // Cada ilustración define sus formas con un prefijo propio: los id no se repiten en la página.
  const scope = `scene-${kind}`;
  return (
    <svg
      data-scene-svg
      viewBox={scene.viewBox.join(" ")}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
      className="absolute inset-0 size-full"
    >
      <defs>
        {KINDS.map((shape) => (
          <symbol key={shape} id={`${scope}-${shape}`} overflow="visible">
            {FACES.map((face) => (
              <polygon key={face} data-face={face} points={BOX_SHAPES[shape][face]} {...faceAttributes(face)} />
            ))}
          </symbol>
        ))}
      </defs>
      {scene.groups.map((group, index) => (
        // Los grupos con data-segment reaccionan a la etapa elegida (globals.css).
        <g key={index} data-role={group.role} data-segment={group.segment ?? undefined}>
          {group.boxes.map((box, position) => (
            <Block key={position} box={box} scope={scope} />
          ))}
          {group.circles.map((circle, position) => (
            <Circle key={position} circle={circle} />
          ))}
          {group.label ? (
            <text x={group.label.x} y={group.label.y}>
              {group.label.text}
            </text>
          ) : null}
        </g>
      ))}
    </svg>
  );
}
