// scene.js: Creates the main Three.js scene and camera
import * as THREE from 'three';

let mainScene, camera;

export function createMainScene() {
  mainScene = new THREE.Scene();
  // Set up the primary camera
  camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(0, 3, 0);
  camera.rotation.order = 'YXZ';
  camera.up.set(0, 1, 0);
  camera.rotation.set(0, 0, Math.PI);
  return mainScene;
}

export function getCamera() {
  return camera;
}
