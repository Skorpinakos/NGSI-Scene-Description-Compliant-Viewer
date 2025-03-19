// secondaryScene.js: Builds the secondary scene with additional objects
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { add } from 'three/tsl';

let secondaryScene, cube, sign, signTexture, signMessages, messageIndex = 0;

export function createSecondaryScene() {
  secondaryScene = new THREE.Scene();

  // Lighting
  const light = new THREE.PointLight(0xffffff, 4);
  light.position.set(0, -3, 0);
  secondaryScene.add(light);
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  secondaryScene.add(ambientLight);

  // Rotating cube
  const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
  const textureLoader = new THREE.TextureLoader();
  const cubeTexture = textureLoader.load('https://threejs.org/examples/textures/crate.gif');
  const cubeMaterial = new THREE.MeshStandardMaterial({
    map: cubeTexture,
    color: 0x00ffcc,
    transparent: true,
    opacity: 0.9,
    roughness: 0.5,
    metalness: 0.3
  });
  cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
  cube.position.set(0, -2, 0);
  secondaryScene.add(cube);

  // Dynamic text sign
  const textCanvas = document.createElement('canvas');
  textCanvas.width = 256;
  textCanvas.height = 128;
  const textContext = textCanvas.getContext('2d');

  function drawSignText(text) {
    textContext.clearRect(0, 0, textCanvas.width, textCanvas.height);
    textContext.fillStyle = 'rgba(20, 20, 30, 0.75)';
    textContext.fillRect(0, 0, textCanvas.width, textCanvas.height);
    const fontSize = textCanvas.height * 0.6;
    textContext.font = `bold ${fontSize}px Arial`;
    textContext.fillStyle = 'cyan';
    textContext.textAlign = 'center';
    textContext.textBaseline = 'middle';
    textContext.shadowColor = 'rgba(0, 255, 255, 0.8)';
    textContext.shadowBlur = 8;
    textContext.translate(textCanvas.width, 0);
    textContext.scale(-1, 1);
    textContext.fillText(text, textCanvas.width / 2, textCanvas.height / 2);
    textContext.resetTransform();
  }

  // Initial sign text
  signMessages = ["42°C", "39.2°C", "45°C", "41.3°C", "43°C", "39.7°C"];
  drawSignText(signMessages[0]);
  signTexture = new THREE.CanvasTexture(textCanvas);
  signTexture.flipY = false;
  const signMaterial = new THREE.MeshBasicMaterial({
    map: signTexture,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.75
  });
  const signGeometry = new THREE.PlaneGeometry(0.5, 0.3);
  sign = new THREE.Mesh(signGeometry, signMaterial);
  sign.position.set(2, -1.75, 0);
  secondaryScene.add(sign);

  function addObjectToScene(obj_src,tecture_src, position, scale, rotation) {
    const objLoader = new OBJLoader();
    const textureLoader = new THREE.TextureLoader();
     const texture = textureLoader.load(tecture_src);
    
    objLoader.load(obj_src, (object) => {
          object.traverse((child) => {
              if (child.isMesh) {
                  child.material = new THREE.MeshStandardMaterial({
                      map: texture,
                      color: 0xffffff,
                      roughness: 0.5,
                      metalness: 0.2,
                  });
              }
          });
        object.position.set(position[0], position[1], position[2]);
        object.scale.set(scale[0], scale[1], scale[2]);
        object.rotation.y = rotation[0];
        secondaryScene.add(object);
    }, undefined, (error) => {
        console.error('An error occurred while loading the model:', error);
    });
  }

  addObjectToScene('./mesh_data/ws/weather_station.obj','./mesh_data/ws/weather_station.png',[2, -1, 0],[0.5, -0.5, 0.5],[0]);
  addObjectToScene('./mesh_data/aircraft/aircraft.obj','./mesh_data/aircraft/steel.jpg',[-2, -10, 0],[0.5, -0.5, 0.5],[Math.PI/2]);
  addObjectToScene('./mesh_data/man/FinalBaseMesh.obj',null,[-3, -0.5, 0],[0.1, -0.1, 0.1],[0]);  

  // Update sign text every 3 seconds
  setInterval(() => {
    messageIndex = (messageIndex + 1) % signMessages.length;
    drawSignText(signMessages[messageIndex]);
    signTexture.needsUpdate = true;
  }, 3000);

  return secondaryScene;
}

export function updateSecondaryObjects(delta) {
  // Example: rotate the cube for a simple animation
  if (cube) {
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
  }
}
