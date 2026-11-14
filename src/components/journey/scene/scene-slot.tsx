import { SceneSvg } from "@/components/journey/scene/scene-svg";
import type { SceneKind } from "@/domain/scene/projection";
import { cx } from "@/lib/cx";

type SceneSlotProps = { kind: SceneKind; className?: string };

/**
 * Ranura de la escena. Trae la ilustración SVG en el HTML (versión ligera) y es donde
 * la versión completa coloca su lienzo. Quien la usa fija con `className` su posición
 * (`relative` o `absolute`) y su tamaño, que debe estar reservado para que la página no
 * salte cuando llega el 3D.
 * Es decorativa: lo que cuenta la escena ya lo dice el texto de las etapas.
 */
export function SceneSlot({ kind, className }: SceneSlotProps) {
  return (
    <div data-scene={kind} aria-hidden="true" className={cx("overflow-hidden", className)}>
      <SceneSvg kind={kind} />
    </div>
  );
}
