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

// --- PLY Loader Implementation ---
// This loader supports both ASCII and binary_little_endian PLY files.
// It reads the header (as ASCII) from the ArrayBuffer and then parses the rest accordingly.
// Both position and color (red, green, blue) are extracted if present.
class PLYLoader {
  constructor(manager) {
    this.manager = manager !== undefined ? manager : THREE.DefaultLoadingManager;
  }
  load(url, onLoad, onProgress, onError) {
    const loader = new THREE.FileLoader(this.manager);
    // Request an ArrayBuffer so we can handle binary PLY files.
    loader.setResponseType('arraybuffer');
    loader.load(url, (data) => {
      try {
        const geometry = this.parse(data);
        onLoad(geometry);
      } catch (error) {
        if (onError) onError(error);
      }
    }, onProgress, onError);
  }
  parse(data) {
    const textDecoder = new TextDecoder();
    // Assume header is contained within the first 1024 bytes.
    const headerText = textDecoder.decode(data.slice(0, 1024));
    const headerEndIndex = headerText.indexOf("end_header");
    if (headerEndIndex === -1) {
      throw new Error("PLYLoader: No end_header found.");
    }
    // Extract header lines.
    const header = headerText.substring(0, headerEndIndex + "end_header".length);
    const headerLines = header.split('\n').map(line => line.trim());
    let format = null;
    let vertexCount = 0;
    let properties = [];
    for (let line of headerLines) {
      if (line.startsWith("format")) {
        // e.g., "format binary_little_endian 1.0" or "format ascii 1.0"
        const parts = line.split(/\s+/);
        format = parts[1];
      }
      if (line.startsWith("element vertex")) {
        const parts = line.split(/\s+/);
        vertexCount = parseInt(parts[2]);
      }
      if (line.startsWith("property")) {
        // e.g., "property float x" or "property uchar red"
        const parts = line.split(/\s+/);
        properties.push({ type: parts[1], name: parts[2] });
      }
    }
    // Determine the offset where binary data begins.
    const uint8 = new Uint8Array(data);
    const headerEndMarker = "end_header";
    const headerEndPos = headerText.indexOf(headerEndMarker);
    let headerEndOffset = 0;
    if (headerEndPos !== -1) {
      headerEndOffset = headerEndPos + headerEndMarker.length;
      // Skip newline characters after end_header.
      while (headerEndOffset < uint8.length && (uint8[headerEndOffset] === 10 || uint8[headerEndOffset] === 13)) {
        headerEndOffset++;
      }
    }

    if (format === "ascii") {
      // Decode the whole file as text and process line by line.
      const text = textDecoder.decode(data);
      const lines = text.split('\n');
      let startIndex = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() === "end_header") {
          startIndex = i + 1;
          break;
        }
      }
      let vertexData = [];
      let colorData = [];
      let parsedVertices = 0;
      for (let i = startIndex; i < lines.length && parsedVertices < vertexCount; i++) {
        const line = lines[i].trim();
        if (line === "" || line.startsWith("#")) continue;
        const tokens = line.split(/\s+/);
        if (tokens.length < properties.length) {
          console.warn(`PLYLoader: Skipping vertex line ${parsedVertices} due to insufficient tokens: "${line}"`);
          continue;
        }
        let x, y, z, r, g, b;
        for (let p = 0; p < properties.length; p++) {
          const prop = properties[p];
          const token = tokens[p];
          if (prop.name === "x") {
            x = parseFloat(token);
          } else if (prop.name === "y") {
            y = parseFloat(token);
          } else if (prop.name === "z") {
            z = parseFloat(token);
          } else if (prop.name === "red") {
            r = parseFloat(token);
          } else if (prop.name === "green") {
            g = parseFloat(token);
          } else if (prop.name === "blue") {
            b = parseFloat(token);
          }
        }
        if (x === undefined || y === undefined || z === undefined) {
          console.warn(`PLYLoader: Skipping vertex line ${parsedVertices} because position is missing.`);
          continue;
        }
        vertexData.push(x, y, z);
        if (r !== undefined && g !== undefined && b !== undefined) {
          // Normalize from 0-255 to 0-1.
          colorData.push(r / 255, g / 255, b / 255);
        }
        parsedVertices++;
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertexData, 3));
      if (colorData.length === vertexData.length) {
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colorData, 3));
      }
      return geometry;
    } else if (format === "binary_little_endian") {
      // Parse the binary data starting at headerEndOffset.
      const dataView = new DataView(data, headerEndOffset);
      let offset = 0;
      let vertexData = [];
      let colorData = [];
      for (let i = 0; i < vertexCount; i++) {
        let x, y, z, r, g, b;
        for (let p = 0; p < properties.length; p++) {
          const prop = properties[p];
          if (prop.type === "float" || prop.type === "float32") {
            const value = dataView.getFloat32(offset, true);
            offset += 4;
            if (prop.name === "x") {
              x = value;
            } else if (prop.name === "y") {
              y = value;
            } else if (prop.name === "z") {
              z = value;
            }
          } else if (prop.type === "uchar" || prop.type === "uint8") {
            const value = dataView.getUint8(offset);
            offset += 1;
            if (prop.name === "red") {
              r = value;
            } else if (prop.name === "green") {
              g = value;
            } else if (prop.name === "blue") {
              b = value;
            }
          } else if (prop.type === "int" || prop.type === "int32") {
            offset += 4;
          } else {
            offset += 4;
          }
        }
        if (x === undefined || y === undefined || z === undefined) {
          console.warn(`PLYLoader: Skipping vertex ${i} due to missing position properties.`);
          continue;
        }
        vertexData.push(x, y, z);
        if (r !== undefined && g !== undefined && b !== undefined) {
          colorData.push(r / 255, g / 255, b / 255);
        }
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertexData, 3));
      if (colorData.length === vertexData.length) {
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colorData, 3));
      }
      return geometry;
    } else {
      throw new Error(`PLYLoader: Unsupported format: ${format}`);
    }
  }
}

// Concrete implementation that loads a PLY point cloud
class PlyPointCloudRenderer extends BackgroundRenderer {
  constructor() {
    super();
    this.pointCloud = null;
  }
  async init() {
    // Use our inline PLYLoader to load a PLY file.
    const loader = new PLYLoader();
    // Use an environment variable to define the PLY asset path.
    const plyPath = import.meta.env.VITE_PLY_OBJECT_PATH;
    await new Promise((resolve, reject) => {
      loader.load(plyPath, (geometry) => {
        // Create a simple points material.
        // Enable vertexColors if a color attribute is available.
        const material = new THREE.PointsMaterial({
          size: 0.05,
          color: 0xffffff,
          vertexColors: geometry.getAttribute('color') ? true : false
        });
        this.pointCloud = new THREE.Points(geometry, material);
        this.pointCloud.position.set(0, 0, 0);  
        this.pointCloud.rotation.set(+Math.PI/2,-0*Math.PI/15,0);  
        this.pointCloud.scale.set(1, 1, 1);       
        console.log("Total points: "+this.pointCloud.geometry.attributes.position.count);


        // Add the point cloud to the main scene.
        mainScene.add(this.pointCloud);
        resolve();
      }, undefined, (err) => {
        console.error("Error loading PLY file:", err);
        reject(err);
      });
    });
  }
  update() {
    // For example, we can slowly rotate the point cloud for a simple animation. OR NOT?
    if (this.pointCloud) {
      this.pointCloud.rotation.y += 0*0.001;
    }
  }
  render() {
    // Render the main scene (which now contains our point cloud)
    const renderer = getRenderer();
    renderer.render(mainScene, getCamera());
  }
  dispose() {
    if (this.pointCloud) {
      mainScene.remove(this.pointCloud);
      this.pointCloud.geometry.dispose();
      this.pointCloud.material.dispose();
      this.pointCloud = null;
    }
  }
}

// --- Factory Function ---
function createBackgroundRenderer(type) {
  if (type === 'gaussianSplats') {
    return new GaussianSplatsRenderer();
  } else if (type === 'ply') {
    return new PlyPointCloudRenderer();
  }
  throw new Error(`Unknown background renderer type: ${type}`);
}

let backgroundRenderer = null;

export async function initViewer() {
  // Determine the renderer type from environment variables; default to 'gaussianSplats'
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
