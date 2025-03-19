import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import mqtt from 'mqtt';

let secondaryScene, cube;

let mqtt_broker = "150.140.186.118";
let mqtt_port = "1883";
let mqtt_topic = "ster/DT/temperature";

// Class for dynamic text signs
class DynamicTextSign {
  constructor(scene, position, initialText, size = { width: 0.5, height: 0.3 }) {
    this.scene = scene;
    this.textCanvas = document.createElement('canvas');
    this.textCanvas.width = 256;
    this.textCanvas.height = 128;
    this.textContext = this.textCanvas.getContext('2d');

    this.signTexture = new THREE.CanvasTexture(this.textCanvas);
    this.signTexture.flipY = false;

    this.signMaterial = new THREE.MeshBasicMaterial({
      map: this.signTexture,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
    });

    this.signGeometry = new THREE.PlaneGeometry(size.width, size.height);
    this.sign = new THREE.Mesh(this.signGeometry, this.signMaterial);
    this.sign.position.set(...position);

    this.scene.add(this.sign);
    this.drawSignText(initialText);
  }

  drawSignText(text) {
    this.textContext.clearRect(0, 0, this.textCanvas.width, this.textCanvas.height);
    this.textContext.fillStyle = 'rgba(20, 20, 30, 0.75)';
    this.textContext.fillRect(0, 0, this.textCanvas.width, this.textCanvas.height);

    const fontSize = this.textCanvas.height * 0.6;
    this.textContext.font = `bold ${fontSize}px Arial`;
    this.textContext.fillStyle = 'cyan';
    this.textContext.textAlign = 'center';
    this.textContext.textBaseline = 'middle';
    this.textContext.shadowColor = 'rgba(0, 255, 255, 0.8)';
    this.textContext.shadowBlur = 8;

    this.textContext.translate(this.textCanvas.width, 0);
    this.textContext.scale(-1, 1);
    this.textContext.fillText(text, this.textCanvas.width / 2, this.textCanvas.height / 2);
    this.textContext.resetTransform();

    this.signTexture.needsUpdate = true;
  }

  updateText(newText) {
    this.drawSignText(newText);
  }
}

// Scene function
export function createSecondaryScene() {
  const secondaryScene = new THREE.Scene();

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

  // Create multiple signs
  const sign1 = new DynamicTextSign(secondaryScene, [2, -1.75, 0], "42°C");
  const sign2 = new DynamicTextSign(secondaryScene, [2, -2, 0], "Cooling");

  // Function to load objects
  function addObjectToScene(obj_src, texture_src, position, scale, rotation) {
    const objLoader = new OBJLoader();
    const textureLoader = new THREE.TextureLoader();
    const texture = texture_src ? textureLoader.load(texture_src) : null;

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

      object.position.set(...position);
      object.scale.set(...scale);
      object.rotation.y = rotation[0];
      secondaryScene.add(object);
    }, undefined, (error) => {
      console.error('An error occurred while loading the model:', error);
    });
  }

  // Add objects
  addObjectToScene('./mesh_data/ws/weather_station.obj', './mesh_data/ws/weather_station.png', [2, -1, 0], [0.5, -0.5, 0.5], [0]);
  addObjectToScene('./mesh_data/aircraft/aircraft.obj', './mesh_data/aircraft/steel.jpg', [-2, -10, 0], [0.5, -0.5, 0.5], [Math.PI / 2]);
  addObjectToScene('./mesh_data/man/FinalBaseMesh.obj', null, [-3, -0.5, 0], [0.1, -0.1, 0.1], [0]);

  // MQTT Connection Function
  function connectToMQTT_WS(ws_url, topic, signToUpdate) {
    const client = mqtt.connect(ws_url);
    client.on('connect', () => {
      console.log('MQTT connected');
      client.subscribe(topic);
    });
    client.on('message', (topic, message) => {
      console.log('MQTT message:', message.toString());
      signToUpdate.updateText(message.toString());
    });
  }

  // Connect signs to MQTT
  connectToMQTT_WS('wss://labserver.sense-campus.gr:9002', "ster/DT/temperature", sign1);

  return secondaryScene;
}

// Update function for animations
export function updateSecondaryObjects(delta) {
  if (cube) {
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
  }
}