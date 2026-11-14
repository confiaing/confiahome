import {
  BoxGeometry,
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PCFShadowMap,
  PerspectiveCamera,
  Quaternion,
  Scene,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
} from "three";
import { SCENE_ITEMS, STAGE_STOPS, curve, tangent, type ItemTone } from "@/domain/scene/model";
import { buildAmount } from "@/domain/scene/state";

// Versión completa de la escena: el modelo en 3D. Es el ÚNICO archivo que importa
// three (lo impone una regla de lint) y solo se carga con import() dinámico, después
// de que la página es legible (ADR-0009). Portado del diseño finalista.
//
// Un solo lienzo que se muda a la ranura más visible (hero, recorrido o cierre). Los
// colores salen de los roles --scene-* de esa ranura: no hay ningún color en este archivo.

export type SceneHandle = { destroy(): void };

export type SceneOptions = {
  /** Las ranuras ([data-scene]) de la página. */
  slots: HTMLElement[];
  /** Etapa seleccionada en el recorrido, de 1 a 5. */
  getStage(): number;
  /** El navegador perdió el contexto gráfico: hay que volver a la versión ligera. */
  onContextLost(): void;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const BEADS = 12;

export function createScene({ slots, getStage, onContextLost }: SceneOptions): SceneHandle {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.dataset.sceneCanvas = "";
  canvas.dataset.rendering = "false";

  const small = window.matchMedia("(max-width: 767px)").matches || window.matchMedia("(pointer: coarse)").matches;
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2));
  renderer.setClearAlpha(0);
  // Sombras solo en pantallas grandes: en móvil cuestan más de lo que aportan.
  const useShadows = !small;
  renderer.shadowMap.enabled = useShadows;
  renderer.shadowMap.type = PCFShadowMap;

  const scene = new Scene();
  const fog = new Fog(new Color(), 20, 60);
  scene.fog = fog;
  const camera = new PerspectiveCamera(32, 1, 0.1, 220);
  const hemisphere = new HemisphereLight();
  hemisphere.intensity = 1.5;
  scene.add(hemisphere);
  const sun = new DirectionalLight();
  sun.intensity = 2.6;
  scene.add(sun, sun.target);
  if (useShadows) {
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    const shadow = sun.shadow.camera;
    shadow.left = -17;
    shadow.right = 17;
    shadow.top = 17;
    shadow.bottom = -17;
    shadow.near = 1;
    shadow.far = 70;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.03;
  }

  // Todos los bloques en una sola malla instanciada.
  const count = SCENE_ITEMS.length;
  const blockGeometry = new BoxGeometry(1, 1, 1);
  const blockMaterial = new MeshStandardMaterial({ roughness: 0.9, metalness: 0 });
  const blocks = new InstancedMesh(blockGeometry, blockMaterial, count);
  blocks.frustumCulled = false;
  blocks.castShadow = useShadows;
  blocks.receiveShadow = useShadows;
  scene.add(blocks);

  const up = new Vector3(0, 1, 0);
  const placed = SCENE_ITEMS.map((item) => {
    const [x, y, z] = curve(item.t);
    const [ux, uz] = tangent(item.t);
    const [nx, nz] = [-uz, ux];
    const origin = new Vector3(x + ux * item.along + nx * item.side, y + item.lift, z + uz * item.along + nz * item.side);
    return {
      item,
      origin,
      rotation: new Quaternion().setFromAxisAngle(up, Math.atan2(-uz, ux)),
      size: new Vector3(...item.size),
      scattered: new Vector3(origin.x + item.scatter[0], origin.y + item.scatter[1], origin.z + item.scatter[2]),
      axis: new Vector3(...item.axis).normalize(),
    };
  });

  // Las dos esferas que recorren el camino, y las cuentas que marcan lo andado.
  const sphere = new SphereGeometry(0.21, 28, 18);
  const companionA = new Mesh(sphere, new MeshStandardMaterial({ roughness: 0.55 }));
  const companionB = new Mesh(sphere, new MeshStandardMaterial({ roughness: 0.55 }));
  companionA.castShadow = companionB.castShadow = useShadows;
  scene.add(companionA, companionB);
  const beadGeometry = new SphereGeometry(0.11, 12, 8);
  const beadMaterial = new MeshBasicMaterial();
  const beads = new InstancedMesh(beadGeometry, beadMaterial, BEADS);
  beads.frustumCulled = false;
  scene.add(beads);

  let active: HTMLElement | null = null;
  let view = "hero";
  let running = false;
  let frameId = 0;
  let last = 0;
  let time = 0;
  let progress = 0.02;
  let snap = true;
  let destroyed = false;
  let pointerX = 0;
  let pointerY = 0;
  let targetPointerX = 0;
  let targetPointerY = 0;

  const scratchPosition = new Vector3();
  const scratchRotation = new Quaternion();
  const position = new Vector3();
  const rotation = new Quaternion();
  const matrix = new Matrix4();
  const cameraPosition = new Vector3();
  const cameraLook = new Vector3();
  const wantedPosition = new Vector3();
  const wantedLook = new Vector3();
  const point = new Vector3();
  const scale = new Vector3(1, 1, 1);

  const tokenColor = (style: CSSStyleDeclaration, name: string) => {
    const value = style.getPropertyValue(name).trim();
    return value ? new Color(value) : new Color();
  };

  /** Lee la paleta del tema de la ranura: cada banda da a la escena sus propios colores. */
  const applyTheme = (slot: HTMLElement) => {
    const style = getComputedStyle(slot);
    const tones: Record<ItemTone, Color> = {
      stone: tokenColor(style, "--scene-top"),
      alt: tokenColor(style, "--scene-alt"),
      dark: tokenColor(style, "--scene-dark"),
      accent: tokenColor(style, "--scene-accent"),
    };
    SCENE_ITEMS.forEach((item, index) => blocks.setColorAt(index, tones[item.tone]));
    if (blocks.instanceColor) blocks.instanceColor.needsUpdate = true;
    const background = tokenColor(style, "--color-background");
    fog.color.copy(background);
    hemisphere.groundColor.copy(background).lerp(new Color(), 0.25);
    companionA.material.color.copy(tokenColor(style, "--scene-comp-a"));
    companionB.material.color.copy(tokenColor(style, "--scene-comp-b"));
    beadMaterial.color.copy(tokenColor(style, "--scene-bead"));
  };

  const resize = () => {
    if (!active) return;
    const { clientWidth: width, clientHeight: height } = active;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const resizeObserver = new ResizeObserver(resize);

  const attach = (slot: HTMLElement) => {
    if (active) {
      delete active.dataset.hasCanvas;
      resizeObserver.unobserve(active);
    }
    active = slot;
    view = slot.dataset.scene ?? "hero";
    slot.append(canvas);
    slot.dataset.hasCanvas = "";
    resizeObserver.observe(slot);
    resize();
    applyTheme(slot);
    snap = true;
  };

  /** Hasta dónde debe estar construido el camino en la ranura actual. */
  const targetProgress = (scrollIn: number) => {
    if (view === "journey") return STAGE_STOPS[clamp(getStage(), 1, STAGE_STOPS.length) - 1]!;
    if (view === "closing") return 0.8 + 0.2 * clamp(scrollIn * 1.5, 0, 1);
    return 0.03 + 0.09 * clamp(scrollIn - 0.55, 0, 1);
  };

  const placeCamera = (scrollOffset: number) => {
    const aspect = camera.aspect;
    if (view === "journey") {
      const [x, y, z] = curve(clamp(progress, 0, 1));
      const k = clamp(1.45 / aspect, 1, 2.1);
      // Al avanzar, la cámara rodea a la pareja y termina mirando atrás: todo el camino recorrido.
      const eased = clamp((progress - 0.12) / 0.88, 0, 1);
      const yaw = -0.28 + 1.3 * eased * eased + pointerX * 0.07;
      const offsetX = -5.2 * k;
      const offsetZ = 13.5 * k;
      wantedPosition.set(
        x + offsetX * Math.cos(yaw) + offsetZ * Math.sin(yaw),
        y + (4.4 + 4.2 * eased * eased) * k - pointerY * 0.5 + scrollOffset * 1.6,
        z - offsetX * Math.sin(yaw) + offsetZ * Math.cos(yaw),
      );
      wantedLook.set(x + 1.2 - 5.2 * eased * eased, y + 0.2 - 0.6 * eased * eased, z);
    } else if (view === "closing") {
      const [x, y, z] = curve(0.5);
      const k = clamp(3 / aspect, 1, 3);
      const angle = Math.sin(time * 0.13) * 0.14 + pointerX * 0.05;
      wantedPosition.set(x + Math.sin(angle) * 18 * k, y + 6 * k + scrollOffset * 2, z + Math.cos(angle) * 18 * k);
      wantedLook.set(x, y + 0.6, z);
    } else {
      const [x, y, z] = curve(0);
      const k = clamp(1.5 / aspect, 1, 2.2);
      // Ancho: el inicio del camino queda a la derecha del texto; estrecho: centrado.
      const shift = aspect > 1.25 ? -2.5 : 4.5;
      wantedPosition.set(x + shift - 5.5 * k + pointerX * 1.3, y + 6.2 * k - pointerY * 0.7 + scrollOffset * 3.5, z + 16.5 * k);
      wantedLook.set(x + shift, y + 2.2, z);
    }
  };

  const frame = (now: number) => {
    frameId = 0;
    if (!running || !active) return;
    frameId = requestAnimationFrame(frame);
    const delta = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    time += delta;

    // La cámara acompaña el desplazamiento: solo se LEE la posición de la ranura.
    const rect = active.getBoundingClientRect();
    const viewportHeight = window.innerHeight || 1;
    const scrollIn = clamp((viewportHeight - rect.top) / (viewportHeight + rect.height), 0, 1);
    const scrollOffset = clamp((rect.top + rect.height / 2 - viewportHeight / 2) / viewportHeight, -1, 1);

    const goal = targetProgress(scrollIn);
    // Para las pruebas: hasta dónde quiere llegar la escena.
    canvas.dataset.goal = goal.toFixed(2);
    if (snap && view !== "closing") progress = goal;
    else progress += (goal - progress) * (1 - Math.exp(-delta * 1.7));
    pointerX += (targetPointerX - pointerX) * (1 - Math.exp(-delta * 3));
    pointerY += (targetPointerY - pointerY) * (1 - Math.exp(-delta * 3));

    for (let index = 0; index < count; index += 1) {
      const block = placed[index]!;
      const built = buildAmount(block.item, progress);
      if (built >= 1) {
        matrix.compose(block.origin, block.rotation, block.size);
      } else {
        scratchPosition.copy(block.scattered);
        scratchPosition.y += Math.sin(time * 0.6 + block.item.phase) * 0.35;
        scratchPosition.x += Math.cos(time * 0.43 + block.item.phase) * 0.22;
        scratchRotation.setFromAxisAngle(block.axis, block.item.angle + time * block.item.spin);
        position.lerpVectors(scratchPosition, block.origin, built);
        rotation.slerpQuaternions(scratchRotation, block.rotation, built);
        matrix.compose(position, rotation, block.size);
      }
      blocks.setMatrixAt(index, matrix);
    }
    blocks.instanceMatrix.needsUpdate = true;

    const at = clamp(progress, 0, 1);
    const [x, y, z] = curve(at);
    const [ux, uz] = tangent(at);
    const hop = Math.abs(goal - progress) > 0.004 ? Math.abs(Math.sin(time * 9)) * 0.09 : 0;
    companionA.position.set(x - uz * -0.27 - ux * 0.12, y + 0.34 + hop, z + ux * -0.27 - uz * 0.12);
    companionB.position.set(
      x - uz * 0.27 + ux * 0.12,
      y + 0.34 + (hop ? Math.abs(Math.sin(time * 9 + 1.2)) * 0.09 : 0),
      z + ux * 0.27 + uz * 0.12,
    );

    let flow = clamp((progress - 0.6) / 0.35, 0, 1);
    flow = flow * flow * (3 - 2 * flow);
    for (let bead = 0; bead < BEADS; bead += 1) {
      const beadAt = ((time * 0.045 + bead / BEADS) % 1) * at;
      const [bx, by, bz] = curve(beadAt);
      const edge = Math.min(1, beadAt * 30, (at - beadAt) * 30);
      point.set(bx, by + 0.5 + Math.sin(time * 2 + bead) * 0.05, bz);
      matrix.compose(point, rotation.identity(), scale.setScalar(Math.max(0.0001, flow * edge)));
      beads.setMatrixAt(bead, matrix);
    }
    beads.instanceMatrix.needsUpdate = true;

    placeCamera(scrollOffset);
    if (snap) {
      cameraPosition.copy(wantedPosition);
      cameraLook.copy(wantedLook);
      snap = false;
    } else {
      const ease = 1 - Math.exp(-delta * 4);
      cameraPosition.lerp(wantedPosition, ease);
      cameraLook.lerp(wantedLook, ease);
    }
    camera.position.copy(cameraPosition);
    camera.lookAt(cameraLook);
    const distance = cameraPosition.distanceTo(cameraLook);
    fog.near = distance * 0.8;
    fog.far = distance * 2.3;
    sun.position.set(cameraLook.x + 7, cameraLook.y + 16, cameraLook.z + 9);
    sun.target.position.copy(cameraLook);

    renderer.render(scene, camera);
  };

  const start = () => {
    if (running) return;
    running = true;
    canvas.dataset.rendering = "true";
    last = performance.now();
    frameId = requestAnimationFrame(frame);
  };
  const stop = () => {
    running = false;
    canvas.dataset.rendering = "false";
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
  };

  // Solo se dibuja si alguna ranura está en pantalla y la pestaña es visible.
  const visible = new Map<Element, number>();
  const pick = () => {
    if (destroyed) return;
    let best: HTMLElement | null = null;
    let bestHeight = 0;
    visible.forEach((height, element) => {
      if (height > bestHeight) {
        bestHeight = height;
        best = element as HTMLElement;
      }
    });
    if (!best || document.hidden) {
      stop();
      return;
    }
    if (best !== active) attach(best);
    start();
  };
  const intersection = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) visible.set(entry.target, entry.isIntersecting ? entry.intersectionRect.height : 0);
      pick();
    },
    { threshold: [0, 0.05, 0.2, 0.4, 0.6, 0.8, 1] },
  );
  for (const slot of slots) intersection.observe(slot);
  document.addEventListener("visibilitychange", pick);

  const onPointer = (event: PointerEvent) => {
    targetPointerX = (event.clientX / window.innerWidth) * 2 - 1;
    targetPointerY = (event.clientY / window.innerHeight) * 2 - 1;
  };
  if (window.matchMedia("(pointer: fine)").matches) window.addEventListener("pointermove", onPointer, { passive: true });

  const onLost = (event: Event) => {
    event.preventDefault();
    onContextLost();
  };
  canvas.addEventListener("webglcontextlost", onLost);

  return {
    destroy() {
      destroyed = true;
      stop();
      intersection.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", pick);
      window.removeEventListener("pointermove", onPointer);
      canvas.removeEventListener("webglcontextlost", onLost);
      if (active) delete active.dataset.hasCanvas;
      canvas.remove();
      blockGeometry.dispose();
      blockMaterial.dispose();
      sphere.dispose();
      companionA.material.dispose();
      companionB.material.dispose();
      beadGeometry.dispose();
      beadMaterial.dispose();
      sun.shadow.map?.dispose();
      renderer.dispose();
      // dispose() no suelta el contexto gráfico: sin esto se acumulan al alternar de versión.
      renderer.forceContextLoss();
    },
  };
}
