// Record the start time immediately when the script loads
const startTime = performance.now();

import { hideViewerContainer, showViewerContainer, removeWelcomeScreen, setupPointerLock, createControlsOverlay } from './loading_helper.js';
import { createRenderer, adjustRendererSize, getRenderer, getRenderTarget } from './renderer.js';
import { createMainScene, getCamera, initViewer, updateViewer, renderViewer } from './backgroundScene.js';
import { setupUI, getDynamicConfig } from './ui.js';
import { createSecondaryScene, updateSecondaryObjects } from './secondaryScene.js';
import { handleControls } from './controls.js';

import * as THREE from 'three';

// Configuration object - replace environment variables with direct configuration
const config = {
  // Background renderer configuration
  background: {
    rendererType: import.meta.env.VITE_BACKGROUND_RENDERER_TYPE, // 'gaussianSplats' or 'ply'
    filePath: import.meta.env.VITE_OBJECT_PATH, // Path to the 3D file
    
    // PLY specific options
    pointSize: null, // Auto-calculate based on point count if null
    pointColor: 0xffffff,
    position: [0, 0, 0],
    rotation: [Math.PI/2, 0, 0],
    scale: [1, 1, 1],
    animate: false,
    
    // GaussianSplats specific options
    showLoadingUI: false,
    progressiveLoad: false,
    
    // Common options
    onProgress: (percentComplete, percentCompleteLabel, loaderStatus) => {
      const loadingMessage = document.getElementById('loading-message');
      if (loadingMessage) {
        loadingMessage.textContent = `Loading: ${percentCompleteLabel}`;
      }
    }
  },
  
  // Movement constraints
  movementBoundaries: [
    new THREE.Box3(
      new THREE.Vector3(-30, -3.5, -2), // minX, minY, minZ
      new THREE.Vector3(20, -1.5, 2)    // maxX, maxY, maxZ
    )
  ]
};

// Initially hide the viewer container until loaded
hideViewerContainer();

// Global variables for animation and timing
let lastCameraMovementTime = 0;
let inMovementMode = false;
const movementStopDelay = 0.5; // seconds

// Create renderer, scene, and camera
createRenderer();
const renderer = getRenderer();
const renderTarget = getRenderTarget();
const mainScene = createMainScene();
const camera = getCamera();

// Set up pointer lock and keyboard/mouse event handling
const container = document.getElementById('viewer-container');
let keys = {};
let yaw = 0;
let pitch = 0;

document.addEventListener('mousemove', (event) => {
  if (document.pointerLockElement === container) {
    yaw += event.movementX * 0.002;
    pitch += event.movementY * 0.002;
    pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
    camera.rotation.set(pitch, yaw, Math.PI);
  }
});

document.addEventListener('keydown', (event) => {
  keys[event.code] = true;
});

document.addEventListener('keyup', (event) => {
  keys[event.code] = false;
});

// Initialize the background viewer with the config options
initViewer(config.background).then(() => {
  // Set up pointer lock on the viewer container
  setupPointerLock();

  // Create secondary scene (e.g., a rotating cube, sign, etc.)
  const secondaryScene = createSecondaryScene();

  // Unhide the viewer container
  showViewerContainer('flex');

  // Force an initial full-resolution render immediately
  window.effectiveResolutionScale = window.fullResolutionScale;
  adjustRendererSize();
  renderer.setRenderTarget(renderTarget);
  renderer.clear();
  updateViewer();
  renderViewer();
  renderer.setRenderTarget(null);

  // Log elapsed time since script load
  const elapsedTime = (performance.now() - startTime) / 1000; // seconds
  console.log(`First render done after ${elapsedTime.toFixed(2)} seconds`);

  // Remove the welcome screen immediately after the first render
  removeWelcomeScreen();

  // Create and append the controls overlay to the viewer container
  createControlsOverlay();

  // Set up additional UI controls and event listeners
  setupUI(adjustRendererSize);

  // Variables to track camera state changes
  let lastCamPosition = camera.position.clone();
  let lastCamRotation = camera.rotation.clone();

  function cameraChanged() {
    return !lastCamPosition.equals(camera.position) || !lastCamRotation.equals(camera.rotation);
  }

  function updateLastCameraTransforms() {
    lastCamPosition.copy(camera.position);
    lastCamRotation.copy(camera.rotation);
  }
  updateLastCameraTransforms();

  // Main animation loop
  const clock = new THREE.Clock();
  
  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    // Process keyboard movement controls
    handleControls(delta, keys, camera, config.movementBoundaries);

    // Update secondary scene animations
    updateSecondaryObjects(delta);

    // Update background viewer based on camera movement
    if (cameraChanged()) {
      lastCameraMovementTime = clock.elapsedTime;
      const { dynamicResolutionEnabled, movementResolutionScale, fullResolutionScale } = getDynamicConfig();
      if (dynamicResolutionEnabled && !inMovementMode) {
        inMovementMode = true;
        window.effectiveResolutionScale = movementResolutionScale;
        adjustRendererSize();
      }
      renderer.setRenderTarget(renderTarget);
      renderer.clear();
      updateViewer();
      renderViewer();
      renderer.setRenderTarget(null);
      updateLastCameraTransforms();
    } else {
      const { dynamicResolutionEnabled, fullResolutionScale } = getDynamicConfig();
      if (dynamicResolutionEnabled && inMovementMode && (clock.elapsedTime - lastCameraMovementTime) > movementStopDelay) {
        inMovementMode = false;
        window.effectiveResolutionScale = fullResolutionScale;
        adjustRendererSize();
        renderer.setRenderTarget(renderTarget);
        renderer.clear();
        updateViewer();
        renderViewer();
        renderer.setRenderTarget(null);
      }
    }

    // Render the offscreen background via a fullscreen quad
    renderer.autoClear = false;
    renderer.clear();
    renderer.render(window.fullscreenScene, window.fullscreenCamera);
    // Render the secondary scene on top
    renderer.clearDepth();
    renderer.render(secondaryScene, camera);
  }

  animate();
});