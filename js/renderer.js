// renderer.js: Handles the WebGLRenderer and resolution adjustments
import * as THREE from 'three';
import { getCamera } from './scene.js';

let renderer, renderTarget;

export function createRenderer() {
  const container = document.getElementById('viewer-container');
  renderer = new THREE.WebGLRenderer({ antialias: true });
  // Set clear color to black
  renderer.setClearColor(0x000000, 1);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.outputEncoding = THREE.LinearEncoding;
  container.appendChild(renderer.domElement);

  // Create offscreen render target
  renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat
  });

  // Setup fullscreen quad scene (global for main.js to access)
  window.fullscreenScene = new THREE.Scene();
  window.fullscreenCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quadGeometry = new THREE.PlaneGeometry(2, 2);
  const quadMaterial = new THREE.ShaderMaterial({
    uniforms: { tDiffuse: { value: renderTarget.texture } },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform sampler2D tDiffuse;
      void main() {
        gl_FragColor = texture2D(tDiffuse, vUv);
      }
    `
  });
  const fullscreenQuad = new THREE.Mesh(quadGeometry, quadMaterial);
  window.fullscreenScene.add(fullscreenQuad);

  // Default resolution scales
  window.fullResolutionScale = 1.0;
  window.effectiveResolutionScale = window.fullResolutionScale;

  // Default base resolution values (can be updated via UI)
  window.MAX_WIDTH = 1280;
  window.MAX_HEIGHT = 720;

  // Handle window resize
  window.addEventListener('resize', adjustRendererSize);
}

export function adjustRendererSize() {
  let baseWidth = window.MAX_WIDTH;
  let baseHeight = window.MAX_HEIGHT;
  let scaleFactor = window.effectiveResolutionScale;
  let renderWidth = Math.floor(baseWidth * scaleFactor);
  let renderHeight = Math.floor(baseHeight * scaleFactor);

  // Respect actual window aspect ratio
  const aspectRatio = window.innerWidth / window.innerHeight;
  if (renderWidth / renderHeight > aspectRatio) {
    renderWidth = Math.floor(renderHeight * aspectRatio);
  } else {
    renderHeight = Math.floor(renderWidth / aspectRatio);
  }

  renderer.setSize(renderWidth, renderHeight, false);
  const scaleX = window.innerWidth / renderWidth;
  const scaleY = window.innerHeight / renderHeight;
  const scale = Math.min(scaleX, scaleY);
  renderer.domElement.style.width = `${renderWidth * scale}px`;
  renderer.domElement.style.height = `${renderHeight * scale}px`;

  renderTarget.setSize(renderWidth, renderHeight);

  // Update camera aspect (imported camera should be updated in scene.js)
  const camera = getCamera();
  camera.aspect = renderWidth / renderHeight;
  camera.updateProjectionMatrix();
}

export function getRenderer() {
  return renderer;
}

export function getRenderTarget() {
  return renderTarget;
}
