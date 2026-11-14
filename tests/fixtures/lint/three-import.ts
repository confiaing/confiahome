import { Scene } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export const lazy = () => import("three");
export const scene = new Scene();
export const controls = OrbitControls;
