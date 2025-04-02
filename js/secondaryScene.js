import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import {getLocalOffset} from './global2local.js';
import mqtt from 'mqtt';
import { cameraFar, roughness } from 'three/tsl';


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
  constructor(data,asset){
    //not initializing with a scene as we may want to add it in many scenes
    this.id=asset;
    this.object=null;
    this.position=[data.geoPose.value.position.lat,data.geoPose.value.position.lon,data.geoPose.value.position.h];
    this.rotation=[data.geoPose.value.angles.yaw,data.geoPose.value.angles.pitch,data.geoPose.value.angles.roll];
    this.parent=data.refParent.value;
    this.children=data.refChildren.value;
    this.refAssetData=data.refAssetData.value;
    this.refSemantic=data.refSemanticRepresentation.value
    this.resourceLinks=data.resourceLink.value;
    this.refupdateSrc=data.updateSrc.value;
    this.objLoader = new OBJLoader();
    this.textureLoader = new THREE.TextureLoader();
    this.scenePos=null;
    this.sign=null;
    console.log("Object created with",this.id,this.position,this.rotation,this.parent,this.children,this.refAssetData,this.refSemantic,this.resourceLinks,this.refupdateSrc);
    // Set up periodic data updates based on the sampling period
    if (this.refupdateSrc && this.refupdateSrc["http"] && this.refupdateSrc["http"]["samplingPeriod"]) {
      const samplingPeriod = this.refupdateSrc["http"]["samplingPeriod"];
      setInterval(() => {
      this.dataHTTPUpdate(this.refAssetData[0], this.refupdateSrc["http"]["url"]);
      }, samplingPeriod);
    }
    
  }

  addObjRepr(scene,clientCoordinateSpaceTranslation,callback=null) {

    
    let resource = this.resourceLinks[0][0]; // Access the first resource
    let model = resource.model; // Extract the model path
    let textures = resource.textures; // Extract the textures array
    
    this.objLoader.load(model, (object) => {
      object.traverse((child) => {
        if (child.isMesh) {
          child.material = new THREE.MeshStandardMaterial({
            map: textures[0] ? this.textureLoader.load(textures[0]) : null,
            color: 0xffffff,
            roughness: 0.5,
            metalness: 0.2,
          });
        }
      });
      
      let objSceneCoords=getLocalOffset(clientCoordinateSpaceTranslation, this.position);
      this.scenePos=objSceneCoords;
      object.position.set(objSceneCoords.x, objSceneCoords.y, objSceneCoords.z);
      console.log('position',objSceneCoords.x, objSceneCoords.y, objSceneCoords.z);
      object.scale.set(...resource.scale); // Use the scale from the resource
      //convert rptation from deg to rads
      this.rotation[0]=this.rotation[0]*Math.PI/180;
      this.rotation[1]=this.rotation[1]*Math.PI/180;
      this.rotation[2]=this.rotation[2]*Math.PI/180;
      object.rotation.set(this.rotation[0],this.rotation[1],this.rotation[2]) // Fix rotation references
      object.scale.set(...resource.scale);
      // object.rotation.y = rotation[0];
      // this.scene.add(object);
      this.object=object;
      scene.add(this.object);
      
      if (callback) callback(this.objects);
    }, undefined, (error) => {
      console.error('Error loading model:', error);
    });
  }
  
  dataHTTPUpdate(asset_data,updateSrc){
    fetch('http://localhost:5000/proxy/urn:ngsi-ld:AssetData:001')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
      console.log(data.refValue.value);
      fetch(data.refValue.value)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
      })
      .then(data => {
        //update the object here based on the data received
        this.sign.updateText(parseFloat(data).toFixed(2)+"°C");
      })
    })
  }
  //TODO based on the Scene Descriptor/ Object Descriptor I will create the signs here
  createSign(scene){
    //TODO here we will insert a check logic based on the asset_data entity and the valueRepresentation
    this.sign=new DynamicTextSign(scene,this.position,"42°C",this.object,{ x: 0, y: 0, z: 0 });
  }
  //TODO based on the Scene Descriptor/ Object Descriptor I will update the object here
  updateObject(){
  }

}


// Dynamic Text Sign
class DynamicTextSign {
  constructor(scene, position, initialText, targetObject = null, offset = { x: 0, y: -2, z: 0 }, size = { width: 0.5, height: 0.2 }) {
    this.scene = scene;
    this.targetObject = targetObject; // Optional object to attach to
    this.offset = offset;
    this.height=null;
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
      this.height=height;
      console.log(this.targetObject.position.x,this.targetObject.position.y,height);
      this.sign.position.set(
        this.targetObject.position.x+this.offset.x,
        this.targetObject.position.y+this.offset.y, //TODO FIX THE - IN THE Y AXIS
        this.targetObject.position.z+this.offset.z+height)
    } else {
      console.log("here")
      this.sign.position.set(...position); // Fixed position if no target
    }
    this.sign.rotation.x = Math.PI/2; // Rotate the sign to face the camera
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
        this.targetObject.position.z + this.offset.z+this.height
      );
    }
  }
}



let cube;
let cube2;
const sceneManager = new SceneManager();
// Scene Creation
export function createSecondaryScene(clientCoordinateSpaceTranslation) {
  //scene will be created based on the scene descriptor and translated to the client coordinate space (dictated by the background chosen)
  const scene = sceneManager.getScene();
  
  // Lights
  const lightManager = new LightManager(scene);
  lightManager.addPointLight(); //possible will be an asset in the scene
  lightManager.addAmbientLight(); //always ambient light

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

  ////lets say the cube is at [38.245105, 21.731640,2] in global (aka gps) coords 
  let cubeSceneCoords=getLocalOffset(clientCoordinateSpaceTranslation, [38.245105, 21.731640,2]);
  cube.position.set(cubeSceneCoords.x, cubeSceneCoords.y, cubeSceneCoords.z);
  sceneManager.addObject(cube);
  //38.288051, 21.788754
  cube2 = new THREE.Mesh(cubeGeometry, cubeMaterial);
  let cubeSceneCoords2=getLocalOffset(clientCoordinateSpaceTranslation, [38.287965, 21.788608,71.5]);
  cube2.position.set(cubeSceneCoords2.x, cubeSceneCoords2.y, cubeSceneCoords2.z);;
  sceneManager.addObject(cube2);
  
//////////////FIWARE CODE STARTS//////////////////

//we will parse the scene to look for the assets
//fetch from FIWARE the scene descriptor

let assets=[];
fetch('http://localhost:5000/proxy/scene')
.then(response => {
  if (!response.ok) {
    throw new Error('Network response was not ok ' + response.statusText);
  }
  return response.json();
})
.then(data => {
  // console.log(data.refAssets.value);
  assets.push(...data.refAssets.value);
  // create asset representation

for (let asset of assets) {
  console.log(asset)
  fetch(`http://localhost:5000/proxy/${asset}`)
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok ' + response.statusText);
    }
    return response.json();
  })
  .then(
    data => {
      let obj = new Object(data,asset);
      obj.addObjRepr(scene,clientCoordinateSpaceTranslation,(loadedObject) => {
        obj.createSign(scene);
      });
    })
  .catch(error => { 
    console.error('Fetch error:', error);
  });
}

})
.catch(error => {
  console.error('Fetch error:', error);
});

//////////////FIWARE CODE STOPS//////////////////

///////DEBUG/////////////////////////////////////////////////////////////////////
  // Add arrow pointing UP (to the sky)
  const arrowUp = new THREE.ArrowHelper(
    new THREE.Vector3(0, 0, 1),  // direction
    new THREE.Vector3(0, 0, 0),  // origin
    5,                           // length
    0xffff00                     // color (yellow)
  );
  scene.add(arrowUp);

  // Add arrow pointing NORTH (positive Y direction)
  const arrowNorth = new THREE.ArrowHelper(
    new THREE.Vector3(0, 1, 0), // direction
    new THREE.Vector3(0, 0, 0),  // origin
    5,                           // length
    0xff0000                     // color (red)
  );
  scene.add(arrowNorth);

  // Add arrow pointing east (positive X direction)
  const arrowWest = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0), // direction
    new THREE.Vector3(0, 0, 0),  // origin
    5,                           // length
    0x0000ff                     // color (blue)
  );
  scene.add(arrowWest);
///////////////////////// ////////////////////////////////////////

  return scene;
}

// Update function
export function updateSecondaryObjects(delta) {
  sceneManager.update(delta);
  if (cube){
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
  }
  if (cube2){
    cube2.rotation.x += 0.01;
    cube2.rotation.y += 0.01;
  }
}
