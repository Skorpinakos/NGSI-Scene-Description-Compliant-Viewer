// Record the start time immediately when the script loads
const startTime = performance.now();

import { hideViewerContainer, showViewerContainer, removeWelcomeScreen, setupPointerLock, createControlsOverlay, loadScenesList } from './loading_helper.js';
import { createRenderer, adjustRendererSize, getRenderer, getRenderTarget } from './renderer.js';
import { createMainScene, getCamera, initViewer, updateViewer, renderViewer, getBackgroundRenderer } from './backgroundScene.js';
import { setupUI, getDynamicConfig } from './ui.js';
import { createSecondaryScene, updateSecondaryObjects } from './secondaryScene.js';
import { handleControls } from './controls.js';

import * as THREE from 'three';
import { OBB } from 'three/examples/jsm/math/OBB.js';

// Configuration object - removed movementBoundaries from global config
let config = {
  // Background renderer configuration
  background: {
    rendererType: 'gaussianSplats', // Default
    filePath: '', // Will be populated from scenes.json
    translation: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    animate: false,
    showLoadingUI: false,
    progressiveLoad: false,
    onProgress: (percentComplete, percentCompleteLabel, loaderStatus) => {
      const loadingMessage = document.getElementById('loading-message');
      if (loadingMessage) {
        loadingMessage.textContent = `Loading: ${percentCompleteLabel}`;
      }
    }
  }
};



// Initially hide the viewer container until loaded
hideViewerContainer();

// Global variables for animation and timing
let lastCameraMovementTime = 0;
let inMovementMode = false;
const movementStopDelay = 0.5; // seconds
let animationFrameId = null;
let isInitialized = false;

// Create renderer, scene, and camera
createRenderer();
const renderer = getRenderer();
const renderTarget = getRenderTarget();
const mainScene = createMainScene();
const camera = getCamera();
let secondaryScene = null;
let currentMovementBoundaries = [];

// Function to handle scene changes
async function changeScene(sceneData) {
  // Show loading screen
  if (isInitialized) {
    // Create a loading overlay if we're already initialized
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loading-overlay';
    loadingOverlay.innerHTML = '<div id="loading-message">Loading new scene...</div>';
    loadingOverlay.style.position = 'absolute';
    loadingOverlay.style.top = '0';
    loadingOverlay.style.left = '0';
    loadingOverlay.style.width = '100%';
    loadingOverlay.style.height = '100%';
    loadingOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    loadingOverlay.style.display = 'flex';
    loadingOverlay.style.justifyContent = 'center';
    loadingOverlay.style.alignItems = 'center';
    loadingOverlay.style.color = 'white';
    loadingOverlay.style.fontSize = '24px';
    loadingOverlay.style.zIndex = '1000';
    document.getElementById('viewer-container').appendChild(loadingOverlay);
    
    // Cancel the existing animation loop
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    
    // Dispose of the current background renderer
    const currentRenderer = getBackgroundRenderer();
    if (currentRenderer) {
      currentRenderer.dispose();
    }
  }
  
  // Update config with new scene data
  config.background.rendererType = sceneData.type;
  config.background.filePath = sceneData.filePath;
  
  // Merge options from scene data
  if (sceneData.options) {
    //console.log(sceneData.options);
    for (const [key, value] of Object.entries(sceneData.options)) {
      config.background[key] = value;
    }
    //console.log(config.background);
  }
  
  
  if (sceneData.movementBoundaries && Array.isArray(sceneData.movementBoundaries)) {
    currentMovementBoundaries = sceneData.movementBoundaries.map(boundary => {
      // Create min and max vectors
      const min = new THREE.Vector3(boundary.min[0], boundary.min[1], boundary.min[2]);
      const max = new THREE.Vector3(boundary.max[0], boundary.max[1], boundary.max[2]);
      // Compute center and half-size (extent)
      const center = new THREE.Vector3().addVectors(min, max).multiplyScalar(0.5);
      const halfSize = new THREE.Vector3().subVectors(max, center);
      
      // Use provided rotation (in radians), or default to zero rotation if not specified.
      let euler;
      if (boundary.rotation && boundary.rotation.length === 3) {
        euler = new THREE.Euler(boundary.rotation[0], boundary.rotation[1], boundary.rotation[2]);
      } else {
        euler = new THREE.Euler(0, 0, 0);
      }
      // Create a rotation matrix from the Euler angles.
      const rotationMatrix = new THREE.Matrix3().setFromMatrix4(
        new THREE.Matrix4().makeRotationFromEuler(euler)
      );
      
      // Create an oriented bounding box (OBB)
      return new OBB(center, halfSize, rotationMatrix);
    });
  } else {
    alert("Failed to load the scene's movement box. Please try another one.");
    console.error('Invalid movement boundaries:', sceneData.movementBoundaries);
  }

  
  // Initialize the background viewer with the new config options
  try {
    await initViewer(config.background);

    
    // If this is the first initialization
    if (!isInitialized) {
      // Set up pointer lock on the viewer container
      setupPointerLock();
    
      // Create secondary scene (e.g., a rotating cube, sign, etc.)
      //console.log(config.background.translation); 
      //secondaryScene = createSecondaryScene(config.background.translation);
    
      // Unhide the viewer container
      showViewerContainer('flex');
    
      // Force an initial full-resolution render immediately
      window.effectiveResolutionScale = window.fullResolutionScale;
      adjustRendererSize();
    
      // Set up additional UI controls and event listeners
      setupUI(adjustRendererSize);
    
      isInitialized = true;
    }
    
    // Log elapsed time since script load or scene change
    const elapsedTime = (performance.now() - startTime) / 1000; // seconds
    console.log(`Scene loaded after ${elapsedTime.toFixed(2)} seconds`);
    
    // Remove the welcome screen or loading overlay
    if (!isInitialized) {
      removeWelcomeScreen();
    } else {
      const loadingOverlay = document.getElementById('loading-overlay');
      if (loadingOverlay) {
        loadingOverlay.remove();
      }
    }

  if (secondaryScene) {
    // Optional: Remove old objects or dispose of the scene
    while (secondaryScene.children.length > 0) {
      const child = secondaryScene.children[0];
      secondaryScene.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    }
  }
  // Recreate secondary scene with the new configuration

  console.log(config.background.translation);
  secondaryScene = createSecondaryScene(config.background.translation);
    
    // Start the animation loop
    startAnimationLoop();
  } catch (error) {
    console.error('Error loading scene:', error);
    alert('Failed to load scene. Please try another one.');
    
    // Remove loading overlay if there was an error
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.remove();
    }
  }


}

// Set up pointer lock and keyboard/mouse event handling
const container = document.getElementById('viewer-container');
let keys = {};
// Initialize yaw (rotation around z) and pitch (rotation around x)
let yaw = camera.rotation.z;
let pitch = camera.rotation.x;

document.addEventListener('mousemove', (event) => {
  if (document.pointerLockElement === container) {
    yaw -= event.movementX * 0.002;   // Horizontal movement rotates around z
    pitch -= event.movementY * 0.002;  // Vertical movement rotates around x
    pitch = Math.max(0 , Math.min(Math.PI, pitch));
    // With 'ZXY' order, set rotation.x to pitch and rotation.z to yaw (set rotation.y to 0 unless you need roll)
    camera.rotation.set(pitch, 0, yaw);
  }
});

document.addEventListener('keydown', (event) => {
  keys[event.code] = true;
});

document.addEventListener('keyup', (event) => {
  keys[event.code] = false;
});

// Main animation loop function
function startAnimationLoop() {
  // Variables to track camera state changes
  const lastCamPosition = camera.position.clone();
  const lastCamRotation = camera.rotation.clone();

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
  let lastBackgroundUpdateTime = 0; // Track when background was last updated
  const backgroundUpdateInterval = 0.5; // 500ms in seconds

  function animate() {
    animationFrameId = requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const currentTime = clock.elapsedTime;

    // Process keyboard movement controls using the scene-specific boundaries
    //console.log(currentMovementBoundaries);
    handleControls(delta, keys, camera, currentMovementBoundaries);

    // Update secondary scene animations
    // updateSecondaryObjects(delta);

    // Check if we need to update the background
    const timeSinceLastBackgroundUpdate = currentTime - lastBackgroundUpdateTime;
    const cameraHasMoved = cameraChanged();
    const timeIntervalExceeded = timeSinceLastBackgroundUpdate > backgroundUpdateInterval;
    
    // Update background viewer if camera moved OR if enough time has passed
    if (cameraHasMoved || timeIntervalExceeded) {
      if (cameraHasMoved) {
        lastCameraMovementTime = currentTime;
      }
      
      // Update the time of the last background render
      lastBackgroundUpdateTime = currentTime;
      
      const { dynamicResolutionEnabled, movementResolutionScale, fullResolutionScale } = getDynamicConfig();
      if (dynamicResolutionEnabled && !inMovementMode && !timeIntervalExceeded) {
        inMovementMode = true;
        window.effectiveResolutionScale = movementResolutionScale;
        adjustRendererSize();
      }
      
      renderer.setRenderTarget(renderTarget);
      renderer.clear();
      updateViewer();
      renderViewer();
      renderer.setRenderTarget(null);
      
      if (cameraHasMoved) {
        updateLastCameraTransforms();
      }
    } else {
      const { dynamicResolutionEnabled, fullResolutionScale } = getDynamicConfig();
      if (dynamicResolutionEnabled && inMovementMode && (currentTime - lastCameraMovementTime) > movementStopDelay) {
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
}

// Initialize the application
async function init() {
  try {
    // Load scenes list from JSON file
    const { scenes } = await loadScenesList();
    
    if (scenes && scenes.length > 0) {
      // Create controls overlay with scene change handler
      await createControlsOverlay((selectedScene) => {
        changeScene(selectedScene);
      });
      
      // Initialize with the first scene
      await changeScene(scenes[0]);
    } else {
      console.error('No scenes available in scenes.json');
      document.getElementById('loading-message').textContent = 'Error: No scenes available';
    }
  } catch (error) {
    console.error('Initialization error:', error);
    document.getElementById('loading-message').textContent = 'Error loading application';
  }
}

// Start the initialization process
init();