import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import mqtt from 'mqtt';


// Scene Manager
class SceneManager {
  constructor() {
    this.scene = new THREE.Scene();
    this.objects = [];
  }

  addObject(object) {
    this.scene.add(object);
    this.objects.push(object);
  }

  removeObject(object) {
    this.scene.remove(object);
    this.objects = this.objects.filter(obj => obj !== object);
  }

  update(delta) {
    this.objects.forEach(obj => {
      if (typeof obj.update === 'function') {
        obj.update(delta);
      }
    });
  }

  getScene() {
    return this.scene;
  }
}

// Light Manager
class LightManager {
  constructor(scene) {
    this.scene = scene;
  }

  addPointLight(color = 0xffffff, intensity = 4, position = [0, -3, 0]) {
    const light = new THREE.PointLight(color, intensity);
    light.position.set(...position);
    this.scene.add(light);
  }

  addAmbientLight(color = 0xffffff, intensity = 0.4) {
    const ambientLight = new THREE.AmbientLight(color, intensity);
    this.scene.add(ambientLight);
  }
}

class Object{
  constructor(){
    //not initializing with a scene as we may want to add it in many scenes
    this.object=null;
    this.objLoader = new OBJLoader();
    this.textureLoader = new THREE.TextureLoader();
  }

  addObjRepr(scene,objSrc, textureSrc, position, scale, rotation,callback=null) {
    const texture = textureSrc ? this.textureLoader.load(textureSrc) : null;

    this.objLoader.load(objSrc, (object) => {
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
      // this.scene.add(object);
      this.object=object;
      scene.add(this.object);
      
      if (callback) callback(this.object);
    }, undefined, (error) => {
      console.error('Error loading model:', error);
    });
  }
  
  //TODO based on the Scene Descriptor/ Object Descriptor I will create the signs here
  createSigns(){
  }
  //TODO based on the Scene Descriptor/ Object Descriptor I will update the object here
  updateObject(){
  }

}
// Object Loader
class ObjectLoaderManager {
  constructor(scene) {
    this.scene = scene;
    this.objLoader = new OBJLoader();
    this.textureLoader = new THREE.TextureLoader();
  }

  addObject(objSrc, textureSrc, position, scale, rotation,callback=null) {
    const texture = textureSrc ? this.textureLoader.load(textureSrc) : null;

    this.objLoader.load(objSrc, (object) => {
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
      this.scene.add(object);
      //TODO ADD THE SIGN HERE MAYBE BASED ON THE FIWARE DESCRIPTOR
      //TODO ESTABLISH HERE THE WAY THAT THE SIGN OR THE OBJECT CAN BE UPDATED 
      if (callback) callback(object);
    }, undefined, (error) => {
      console.error('Error loading model:', error);
    });
  }
}

// Dynamic Text Sign
class DynamicTextSign {
  constructor(scene, position, initialText, targetObject = null, offset = { x: 0, y: 0.5, z: 0 }, size = { width: 0.5, height: 0.2 }) {
    this.scene = scene;
    this.targetObject = targetObject; // Optional object to attach to
    this.offset = offset;
    
    this.textCanvas = document.createElement('canvas');
    this.textCanvas.width = 512;
    this.textCanvas.height = 192;
    this.textContext = this.textCanvas.getContext('2d');

    this.signTexture = new THREE.CanvasTexture(this.textCanvas);
    this.signTexture.flipY = true;

    this.signMaterial = new THREE.MeshBasicMaterial({
      map: this.signTexture,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
    });

    this.signGeometry = new THREE.PlaneGeometry(size.width, size.height);
    this.sign = new THREE.Mesh(this.signGeometry, this.signMaterial);

    if (this.targetObject) {
      let bbox=new THREE.Box3().setFromObject(this.targetObject);
      let height=bbox.max.y-bbox.min.y;
      this.sign.position.set(
        this.targetObject.position.x + this.offset.x,
        this.targetObject.position.y - height+this.offset.y, //TODO FIX THE - IN THE Y AXIS
        this.targetObject.position.z + this.offset.z
      );
    } else {
      this.sign.position.set(...position); // Fixed position if no target
    }

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


    this.textContext.fillText(text, this.textCanvas.width / 2, this.textCanvas.height / 2);
    this.textContext.resetTransform();

    this.signTexture.needsUpdate = true;
  }

  updateText(newText) {
    this.drawSignText(newText);
  }

  updatePosition() {
    if (this.targetObject) {
      this.sign.position.set(
        this.targetObject.position.x + this.offset.x,
        this.targetObject.position.y + this.offset.y,
        this.targetObject.position.z + this.offset.z
      );
    }
  }
}


// MQTT Manager
class MQTTManager {
  constructor(brokerUrl, topic, callback) {
    this.client = mqtt.connect(brokerUrl);
    this.topic = topic;

    this.client.on('connect', () => {
      console.log('MQTT connected to', brokerUrl);
      this.client.subscribe(topic);
    });

    this.client.on('message', (topic, message) => {
      console.log('MQTT message:', message.toString());
      if (callback) callback(message.toString());
    });
  }
}

let cube;
const sceneManager = new SceneManager();
// Scene Creation
export function createSecondaryScene() {
  const scene = sceneManager.getScene();

  // Lights
  const lightManager = new LightManager(scene);
  lightManager.addPointLight();
  lightManager.addAmbientLight();

  // Rotating Cube
  const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
  const textureLoader = new THREE.TextureLoader();
  const cubeTexture = textureLoader.load('https://threejs.org/examples/textures/crate.gif');
  const cubeMaterial = new THREE.MeshStandardMaterial({
    map: cubeTexture,
    color: 0x00ffcc,
    transparent: true,
    opacity: 0.9,
    roughness: 0.5,
    metalness: 0.3,
  });

  cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
  cube.position.set(0, +2, 0);
  sceneManager.addObject(cube);

  let ws=new Object();
  ws.addObjRepr(scene,'./virtual_assets/ws/weather_station.obj', './virtual_assets/ws/weather_station.png', [2, 1, 0], [0.5, 0.5, 0.5], [0]);
  // objectLoader.addObject('./virtual_assets/ws/weather_station.obj', './virtual_assets/ws/weather_station.png', [2, -1, 0], [0.5, -0.5, 0.5], [0]);
  // objectLoader.addObject('./virtual_assets/aircraft/aircraft.obj', './virtual_assets/aircraft/steel.jpg', [-2, -10, 0], [0.5, -0.5, 0.5], [Math.PI / 2]);
  let aircraft=new Object();
  aircraft.addObjRepr(scene,'./virtual_assets/aircraft/aircraft.obj', './virtual_assets/aircraft/steel.jpg', [-2, 10, 0], [0.5, 0.5, 0.5], [Math.PI / 2]);
  
  let man=new Object();
  man.addObjRepr(scene,'./virtual_assets/man/FinalBaseMesh.obj',null, [-3, 0.5, 0], [0.1, 0.1, 0.1], [0],(obj)=>{
    const manSign=new DynamicTextSign(scene,[-3, 3, 0],"Person 1");
  }
  );


  // objectLoader.addObject('./virtual_assets/man/FinalBaseMesh.obj', null, [-3, -0.5, 0], [0.1, -0.1, 0.1], [0],(obj)=>{
  //   const manSign=new DynamicTextSign(scene,null,"Person 1",obj);
  // }
  // );

  // Create Signs
  const sign1 = new DynamicTextSign(scene, [2, 1.75, 0], "42°C");
  const sign2 = new DynamicTextSign(scene, [2, 2, 0], "Cooling");

  // MQTT for real-time updates
  new MQTTManager('wss://labserver.sense-campus.gr:9002', "ster/DT/temperature", (msg) => {
    sign1.updateText(msg);
  });

///////DEBUG/////////////////////////////////////////////////////////////////////
  // Add arrow pointing vertically upward (to the sky)
  const arrowUp = new THREE.ArrowHelper(
    new THREE.Vector3(0, 1, 0),  // direction
    new THREE.Vector3(0, 0, 0),  // origin
    5,                           // length
    0xffff00                     // color (yellow)
  );
  scene.add(arrowUp);

  // Add arrow pointing north (negative Z direction)
  const arrowNorth = new THREE.ArrowHelper(
    new THREE.Vector3(0, 0, -1), // direction
    new THREE.Vector3(0, 0, 0),  // origin
    5,                           // length
    0xff0000                     // color (red)
  );
  scene.add(arrowNorth);

  // Add arrow pointing west (negative X direction)
  const arrowWest = new THREE.ArrowHelper(
    new THREE.Vector3(-1, 0, 0), // direction
    new THREE.Vector3(0, 0, 0),  // origin
    5,                           // length
    0x0000ff                     // color (blue)
  );
  scene.add(arrowWest);
/////////////////////////////////////////////////////////////////

  return scene;
}

// Update function
export function updateSecondaryObjects(delta) {
  sceneManager.update(delta);
  if (cube){
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
  }
}
