// backgroundScene.js: Defines the main Three.js scene, camera, and an abstracted background renderer
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

// --- Abstraction for Background Rendering ---

// Base interface for background renderers
class BackgroundRenderer {
  async init() {
    throw new Error("init() must be implemented by subclass");
  }
  update() {
    throw new Error("update() must be implemented by subclass");
  }
  render() {
    throw new Error("render() must be implemented by subclass");
  }
  dispose() {
    // Optional cleanup
  }
}

// Concrete implementation using Gaussian Splats
class GaussianSplatsRenderer extends BackgroundRenderer {
  constructor() {
    super();
    this.viewer = null;
  }
  async init() {
    const renderer = getRenderer();
    const cam = getCamera();
    // Create and configure the Gaussian Splats viewer
    this.viewer = new GaussianSplats3D.Viewer({
      renderer: renderer,
      camera: cam,
      useBuiltInControls: false,
      integerBasedSort: false,
      ignoreDevicePixelRatio: false,
      enableSIMDInSort: true,
      sharedMemoryForWorkers: true,
      halfPrecisionCovariancesOnGPU: true,
      gpuAcceleratedSort: false,
      dynamicScene: false,
      logLevel: GaussianSplats3D.LogLevel.Debug,
      webXRMode: GaussianSplats3D.WebXRMode.None,
      renderMode: GaussianSplats3D.RenderMode.OnChange,
      sceneRevealMode: GaussianSplats3D.SceneRevealMode.Instant,
      antialiased: false,
      focalAdjustment: 1.0,
      selfDrivenMode: false,
      sphericalHarmonicsDegree: 2,
      enableOptionalEffects: false,
      inMemoryCompressionLevel: 0,
      splatSortDistanceMapPrecision: 16,
      optimizeSplatData: false,
      freeIntermediateSplatData: true,
    });

    // Load the splat scene using the asset path from environment variables
    const objectPath = import.meta.env.VITE_3D_OBJECT_PATH;
    await this.viewer.addSplatScene(objectPath, {
      position: [0, 0, 0],
      scale: [1, 1, 1],
      showLoadingUI: false,
      progressiveLoad: false,
      splatAlphaRemovalThreshold: 10,
      onProgress: (percentComplete, percentCompleteLabel, loaderStatus) => {
        console.log(`Progress: (${percentCompleteLabel}) - Status: ${loaderStatus}`);
      },
    });
  }
  update() {
    if (this.viewer) {
      this.viewer.update();
    }
  }
  render() {
    if (this.viewer) {
      this.viewer.render();
    }
  }
}

// Factory function to create a background renderer based on type
function createBackgroundRenderer(type) {
  if (type === 'gaussianSplats') {
    return new GaussianSplatsRenderer();
  }
  // Additional renderer types can be added here.
  throw new Error(`Unknown background renderer type: ${type}`);
}

let backgroundRenderer = null;

export async function initViewer() {
  // Determine the renderer type from environment variable or default to 'gaussianSplats'
  const rendererType = import.meta.env.VITE_BACKGROUND_RENDERER_TYPE || 'gaussianSplats';
  backgroundRenderer = createBackgroundRenderer(rendererType);
  await backgroundRenderer.init();
}

export function updateViewer() {
  if (backgroundRenderer) {
    backgroundRenderer.update();
  }
}

export function renderViewer() {
  if (backgroundRenderer) {
    backgroundRenderer.render();
  }
}
