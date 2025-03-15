// viewer.js: Initializes and manages the Gaussian Splats viewer
import * as THREE from 'three';
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';

import { getRenderer } from './renderer.js';
import { getCamera } from './scene.js';

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
  const sceneFile = './splat_data/4500k_bodegas.ksplat';
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
