import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import {getLocalOffset} from '../global2local.js';
import {EntityAdapter} from './entityAdapter.js';
import {DynamicTextSign} from './DynamicTextSign.js';
import {AssetData}  from './assetData.js';

export class Asset{
  constructor(data,asset){
    //not initializing with a scene as we may want to add it in many scenes
    this.id=asset;
    this.adapter=new EntityAdapter(asset,data,"Asset");
    this.position=this.adapter.getPosition();
    this.rotation=this.adapter.getRotation();
    this.refAssetData=this.adapter.getRefAssetData();
    //create the AssetData object here
    
    this.assetDataEntities = this.refAssetData.map(assetData => {
      const assetDataEntity = new AssetData(assetData);
      return assetDataEntity;
    });
    
    let test= this.assetDataEntities[0].getInfo();
    console.log("TEST ENTITY CREATION",test)
    // console.log(this.id,"MY ASSET DATA CHILDREM",this.assetDataEntities);
    // this.refupdateSrc = this.adapter.getRefUpdateSrc();
    this.resourceLinks=this.adapter.getResourceLinks();
    this.parent=this.adapter.getParent();
    this.children=this.adapter.getChildren();
    this.refSemantic=this.adapter.getRefSemantic();
    this.object=null;
    this.objLoader = new OBJLoader();
    this.textureLoader = new THREE.TextureLoader();
    this.scenePos=null;
    // this.sign=null;
    this.prevPosition=null;
    console.log("Object created with",this.id,this.position,this.rotation,this.parent,this.children,this.refAssetData,this.refSemantic,this.resourceLinks,this.refupdateSrc);
    // Set up periodic data updates based on the sampling period
    //this will be implemented based on the updateMethod
    // if (this.refupdateSrc && this.refupdateSrc["http"] && this.refupdateSrc["http"]["samplingPeriod"]) {
    //   const samplingPeriod = this.refupdateSrc["http"]["samplingPeriod"];
    //   setInterval(() => {
    //   this.dataHTTPUpdate(this.refAssetData[0], this.refupdateSrc["http"]["url"]);
    //   }, samplingPeriod);
    // }
    
  }

  addObjRepr(scene,clientCoordinateSpaceTranslation,callback=null) {

    
    let resource = this.resourceLinks[0]; // Access the first resource
    console.log("resource scale",resource.scale);
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
      
      if (callback) callback(this.object);
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
          const newPos = [data.lat, data.lon, 68  ];
    
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