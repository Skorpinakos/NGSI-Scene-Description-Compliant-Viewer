// backgroundScene.js: Defines the main Three.js scene, camera, and an abstracted background renderer
import * as THREE from 'three';
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';
import { getRenderer } from './renderer.js';
import { rotate } from 'three/tsl';
import {getLocalOffset} from './global2local.js';

let mainScene, camera;

export function createMainScene() {
  mainScene = new THREE.Scene();
  mainScene.up.set(0, 0, 1);
  // Set up the primary camera
  camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(0, 0, 0);
  camera.rotation.order = 'ZXY';
  camera.up.set(0, 0, 1);
  camera.rotation.set(Math.PI/2, 0, 0);
  return mainScene;
}

export function getCamera() {
  return camera;
}

// --- Abstraction for Background Rendering ---

// Base interface for background renderers
class BackgroundRenderer {
  constructor(options = {}) {
    this.options = options;
  }
  
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
  constructor(options = {}) {
    super(options);
    this.viewer = null;
    this.filePath = options.filePath || null;
    this.rendererOptions = options.rendererOptions || {};
  }
  
  async init() {
    const renderer = getRenderer();
    const cam = getCamera();
    
    // Merge default options with any custom options provided
    const viewerOptions = {
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
      ...this.rendererOptions
    };
    
    // Create and configure the Gaussian Splats viewer
    this.viewer = new GaussianSplats3D.Viewer(viewerOptions);

    if (!this.filePath) {
      throw new Error("No file path provided for Gaussian Splats renderer");
    }

    // Load the splat scene using the provided file path
    
    await this.viewer.addSplatScene(this.filePath, {
      position: getLocalOffset(this.options.translation,this.options.translation)-getLocalOffset(this.options.translation,this.options.translation) || [0, 0, 0],
      scale: this.options.scale || [1, 1, 1],
      rotation: this.options.rotation //this propably neeeds some remapping //TODO
      ? new THREE.Quaternion().setFromEuler(new THREE.Euler(...this.options.rotation, 'XYZ')).toArray() 
      : [0, 0, 0, 1],
      showLoadingUI: this.options.showLoadingUI !== undefined ? this.options.showLoadingUI : false,
      progressiveLoad: this.options.progressiveLoad !== undefined ? this.options.progressiveLoad : false,
      splatAlphaRemovalThreshold: this.options.splatAlphaRemovalThreshold || 10,
      onProgress: (percentComplete, percentCompleteLabel, loaderStatus) => {
        console.log(`Progress: (${percentCompleteLabel}) - Status: ${loaderStatus}`);
        if (this.options.onProgress) {
          this.options.onProgress(percentComplete, percentCompleteLabel, loaderStatus);
        }
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
  
  dispose() {
    if (this.viewer) {
      this.viewer.dispose();
      this.viewer = null;
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
  constructor(options = {}) {
    super(options);
    this.pointCloud = null;
    this.filePath = options.filePath || null;
    this.pointSize = options.pointSize || null;
    this.pointColor = options.pointColor || 0xffffff;
    this.position = getLocalOffset(this.options.translation,this.options.translation)-getLocalOffset(this.options.translation,this.options.translation) || [0, 0, 0], //lol
    this.rotation = options.rotation || [0, 0, 0];
    this.scale = options.scale || [1, 1, 1];
  }
  
  async init() {
    if (!this.filePath) {
      throw new Error("No file path provided for PLY point cloud renderer");
    }
    
    // Use our inline PLYLoader to load a PLY file.
    const loader = new PLYLoader();
    
    await new Promise((resolve, reject) => {
      loader.load(this.filePath, (geometry) => {
        // Create a simple points material.
        // Enable vertexColors if a color attribute is available.
        const pointCount = geometry.attributes.position.count;
        
        // Calculate point size based on point count if not explicitly provided
        const calculatedPointSize = this.pointSize || ((10000000/pointCount)**0.25)*0.03;
        
        const material = new THREE.PointsMaterial({
          size: calculatedPointSize,
          color: this.pointColor,
          vertexColors: geometry.getAttribute('color') ? true : false
        });
        
        this.pointCloud = new THREE.Points(geometry, material);
        this.pointCloud.position.set(...this.position);  
        this.pointCloud.rotation.set(...this.rotation);  
        this.pointCloud.scale.set(...this.scale);       
        
        console.log("Total points: " + pointCount);

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
    // Animation can be controlled through options
    if (this.pointCloud && this.options.animate) {
      //nothing yet
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
function createBackgroundRenderer(type, options = {}) {
  if (type === 'gaussianSplats') {
    return new GaussianSplatsRenderer(options);
  } else if (type === 'ply') {
    return new PlyPointCloudRenderer(options);
  }
  throw new Error(`Unknown background renderer type: ${type}`);
}

let backgroundRenderer = null;

export async function initViewer(options = {}) {
  // Use options.rendererType instead of environment variables
  const rendererType = options.rendererType || 'gaussianSplats';
  backgroundRenderer = createBackgroundRenderer(rendererType, options);
  await backgroundRenderer.init();
  return backgroundRenderer;
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

export function getBackgroundRenderer() {
  return backgroundRenderer;
}