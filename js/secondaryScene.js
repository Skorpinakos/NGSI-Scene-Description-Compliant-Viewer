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
    this.adapter=new EntityAdapter(asset,data);
    this.position=this.adapter.getPosition();
    this.rotation=this.adapter.getRotation();
    if(this.id=="urn:ngsi-ld:Asset:004"){
      this.spatialInfo=this.adapter.getSpatialInfo(); //this will be mandatory in the new version
    }
    this.refAssetData=this.adapter.getRefAssetData();
    this.refupdateSrc=this.adapter.getRefUpdateSrc();
    this.resourceLinks=this.adapter.getResourceLinks();
    this.parent=this.adapter.getParent();
    this.children=this.adapter.getChildren();
    this.refSemantic=this.adapter.getRefSemantic();
    this.object=null;
    this.objLoader = new OBJLoader();
    this.textureLoader = new THREE.TextureLoader();
    this.scenePos=null;
    this.sign=null;
    this.prevPosition=null;
    console.log("Object created with",this.id,this.position,this.rotation,this.parent,this.children,this.refAssetData,this.refSemantic,this.resourceLinks,this.refupdateSrc);
    // Set up periodic data updates based on the sampling period
    //this will be implemented based on the updateMethod
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
    fetch(`http://localhost:5000/v2/entities/${asset_data}/attrs`)
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
        if(this.sign){
        this.sign.updateText(parseFloat(data).toFixed(2)+"°C");
        }
      })
    })
  }
  //TODO based on the Scene Descriptor/ Object Descriptor I will create the signs here
  async createSign(scene) {
    try {
      console.log(this.refAssetData[0]);
      const response = await fetch(`http://localhost:5000/v2/entities/${this.refAssetData[0]}/attrs`);
      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }
      const data = await response.json();
      console.log(data);
      let valueRepresentation = data.valueRepr.value[0].type;
      console.log("valueRepresentation", valueRepresentation);
      if (valueRepresentation === "singularValue") {
        console.log("singular value created");
        this.sign = new DynamicTextSign(scene, this.position, "42°C",data.valueRepr.value[0], this.object, { x: 0, y: 0, z: 0 });
      }
      else if (valueRepresentation === "boolean") {
        console.log("boolean one created");
        this.sign = new DynamicTextSign(scene, this.position, "Available",data.valueRepr.value[0], this.object, { x: 0, y: 0, z: 1.5 });
      }

    } catch (error) {
      console.error('Fetch error:', error);
    }
  }

  startWSPositionUpdates(clientCoordinateSpaceTranslation) {
    // const spatialInfo = this.refAssetData ? this.spatialInfo : null;
    console.log("spatialInfo",this.id,this.spatialInfo);
    const wsInfo = this.spatialInfo.updateMethod.ws;
    // wsInfo.url="ws://localhost:6789/"
    if (!wsInfo || !wsInfo.url) {
      console.warn("No WebSocket URL found for position updates.");
      return;
    }
  
    const ws = new WebSocket(wsInfo.url);
  
    ws.onopen = () => {
      console.log("WebSocket connected for", this.id);
    };
  
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
    
        if (data.lat !== undefined && data.lon !== undefined) {
          const newPos = [data.lat, data.lon, 68.5];
    
          const localPos = getLocalOffset(clientCoordinateSpaceTranslation, newPos);
    
          if (this.object) {
            // Update position
            this.object.position.set(localPos.x, localPos.y, localPos.z);
    
            // Calculate yaw (only if there's a previous position to compare)
            if (this.prevPosition) {
              const prevLocal = getLocalOffset(clientCoordinateSpaceTranslation, this.prevPosition);
              const deltaX = localPos.x - prevLocal.x;
              const deltaY = localPos.y - prevLocal.y;
    
              const yaw = Math.atan2(deltaY, deltaX); // radians
    
              // Rotate the car to face direction of movement
              this.object.rotation.y=yaw -  Math.PI / 2;; // or .y depending on your model orientation
            }
    
            this.prevPosition = newPos; // Save current position for next time
    
            if (this.sign) this.sign.updatePosition();
          }
        }
      } catch (err) {
        console.error("WebSocket message parse error:", err);
      }
    };
    
  
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  
    ws.onclose = () => {
      console.warn("WebSocket closed for", this.id);
    };
  }

  //TODO based on the Scene Descriptor/ Object Descriptor I will update the object here
  updateObject(){
  }

}


// Dynamic Text Sign
class DynamicTextSign {
  constructor(scene, position, initialText,properties, targetObject = null, offset = { x: 0, y: -2, z: 0 }, size = { width: 0.5, height: 0.2 }) {
    this.scene = scene;
    this.targetObject = targetObject; // Optional object to attach to
    this.offset = offset;
    this.height=null;
    this.textCanvas = document.createElement('canvas');
    this.textCanvas.width = 512;
    this.textCanvas.height = 192;
    this.textContext = this.textCanvas.getContext('2d');
    this.properties=properties;
    this.type=properties.type;
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

  //TODO Add parameters such as threshold, boolean etc to set the colors etc.
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

    if (this.type==="singularValue"){
      let minThr=this.properties.threshold.min;
      let maxThr=this.properties.threshold.max;
      console.log("minThr",minThr);
      if (parseFloat(text)<minThr){
        this.textContext.fillStyle = 'rgba(0, 0, 255, 0.75)'; // Blue
      }
      else if (parseFloat(text)>maxThr){
        this.textContext.fillStyle = 'rgba(255, 0, 0, 0.75)'; // Red
      }
      else{
        this.textContext.fillStyle = 'rgba(0, 255, 0, 0.75)'; // Green
      }
    }
    else if (this.type==="boolean"){
      if (text==="Available"){
        this.textContext.fillStyle = 'rgba(0, 255, 0, 0.75)'; // Green
      }
      else{
        this.textContext.fillStyle = 'rgba(255, 0, 0, 0.75)'; // Red
      }
    }
    this.textContext.fillText(text, this.textCanvas.width / 2, this.textCanvas.height / 2);
    this.textContext.resetTransform();

    this.signTexture.needsUpdate = true;
  }

  updateText(newText) {
    if (this.type==="singularValue"){
      newText = parseFloat(newText).toFixed(2) + "°C";
      this.drawSignText(newText);
    }
    else if (this.type==="boolean"){
      newText = newText ? "Available" : "Occupied";
      this.drawSignText(newText);
    }
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

class EntityAdapter{
  constructor(id,entityData){
    this.rawdata=entityData;
    this.id=id;
  }

  getPosition(){
    if(this.id==="urn:ngsi-ld:Asset:004"){
      return [this.rawdata.spatialInfo.value.geoPose.position.lat,this.rawdata.spatialInfo.value.geoPose.position.lon,this.rawdata.spatialInfo.value.geoPose.position.h];
    }
    else{
      return [this.rawdata.geoPose.value.position.lat,this.rawdata.geoPose.value.position.lon,this.rawdata.geoPose.value.position.h];
    }
  }

  getRotation(){
    if(this.id==="urn:ngsi-ld:Asset:004"){
      return [this.rawdata.spatialInfo.value.geoPose.angles.yaw,this.rawdata.spatialInfo.value.geoPose.angles.pitch,this.rawdata.spatialInfo.value.geoPose.angles.roll];
    }
    else{
      return [this.rawdata.geoPose.value.angles.yaw,this.rawdata.geoPose.value.angles.pitch,this.rawdata.geoPose.value.angles.roll];
    }
  }
  getParent(){
    return this.rawdata.refParent.value;
  }
  getChildren(){
    return this.rawdata.refChildren.value;
  }
  getRefAssetData(){
    return this.rawdata.refAssetData.value;
  }
  getRefSemantic(){
    return this.rawdata.refSemanticRepresentation.value;
  }

  getResourceLinks(){
    return this.rawdata.resourceLink.value;
  }

  getRefUpdateSrc(){
    return this.rawdata.updateSrc.value;
  }

  getSpatialInfo(){
    return this.rawdata.spatialInfo.value;
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
  const cubeGeometry = new THREE.BoxGeometry(0.1, 0.1, 8);
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
  let cubeSceneCoords=getLocalOffset(clientCoordinateSpaceTranslation, [38.287965, 21.788632,72]);
  
  cube.position.set(cubeSceneCoords.x, cubeSceneCoords.y, cubeSceneCoords.z);
  sceneManager.addObject(cube);
  //38.288051, 21.788754
  cube2 = new THREE.Mesh(cubeGeometry, cubeMaterial);
  let cubeSceneCoords2=getLocalOffset(clientCoordinateSpaceTranslation, [38.287826, 21.788487,72]);
  cube2.position.set(cubeSceneCoords2.x, cubeSceneCoords2.y, cubeSceneCoords2.z);;
  sceneManager.addObject(cube2);
  

  console.log("coords1:",cubeSceneCoords);
  console.log("coords2:",cubeSceneCoords2);
//////////////FIWARE CODE STARTS//////////////////

//we will parse the scene to look for the assets
//fetch from FIWARE the scene descriptor

let assets=[];
fetch('http://localhost:5000/v2/entities/urn:ngsi-ld:SceneDescriptor:001')
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
  fetch(`http://localhost:5000/v2/entities/${asset}/attrs`)
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
        obj.startWSPositionUpdates(clientCoordinateSpaceTranslation);
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
  //debug
  let cube_speed=0;
  sceneManager.update(delta);
  if (cube){
    cube.rotation.x += 0.01*cube_speed;
    cube.rotation.y += 0.01*cube_speed;
  }
  if (cube2){
    cube2.rotation.x += 0.01*cube_speed;
    cube2.rotation.y += 0.01*cube_speed;
  }
}
