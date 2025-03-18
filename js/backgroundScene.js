// scene.js: Creates the main Three.js scene and camera
//Initializes and manages a viewer (currently the gsplat viewer) 
import * as THREE from 'three';
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';

import { getRenderer } from './renderer.js';

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




let viewer;

export async function initViewer() {
  // Create and configure the viewer
  viewer = new GaussianSplats3D.Viewer({
    renderer: getRenderer(),
    camera: getCamera(),
    useBuiltInControls: false,
    integerBasedSort: false,//artifacts if true
    ignoreDevicePixelRatio: false,
    enableSIMDInSort: true,
    sharedMemoryForWorkers: true,
    halfPrecisionCovariancesOnGPU: true,
    gpuAcceleratedSort: false, //error if true
    dynamicScene: false,
    logLevel: GaussianSplats3D.LogLevel.None,
    webXRMode: GaussianSplats3D.WebXRMode.None,
    renderMode: GaussianSplats3D.RenderMode.OnChange,
    sceneRevealMode: GaussianSplats3D.SceneRevealMode.Instant,
    antialiased: false,
    focalAdjustment: 1.0,
    logLevel: GaussianSplats3D.LogLevel.Debug,
    selfDrivenMode: false,
    sphericalHarmonicsDegree: 2,
    enableOptionalEffects: false,
    inMemoryCompressionLevel: 0,
    freeIntermediateSplatData: false,
    splatSortDistanceMapPrecision: 16,
    optimizeSplatData: false,
    freeIntermediateSplatData:true,
  });

  // Load the splat scene
  const objectPath = import.meta.env.VITE_3D_OBJECT_PATH;
  const sceneFile = objectPath;
  await viewer.addSplatScene(sceneFile, {
    position: [0, 0, 0],
    scale: [1, 1, 1],
    showLoadingUI: false,
    progressiveLoad: false,
    splatAlphaRemovalThreshold: 10,
    onProgress: (percentComplete, percentCompleteLabel, loaderStatus) => {
      console.log(`Progress: (${percentCompleteLabel}) - Status: ${loaderStatus}`);
      // Perform your custom actions based on progress or status here.
    },
  });
}

export function updateViewer() {
  if (viewer) viewer.update();
}

export function renderViewer() {
  if (viewer) viewer.render();
}
