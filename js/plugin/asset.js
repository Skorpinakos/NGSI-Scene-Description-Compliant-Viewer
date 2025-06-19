import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import {getLocalOffset} from '../global2local.js';
import {EntityAdapter} from './entityAdapter.js';
import {DynamicTextSign} from './dynamicTextSign.js';
import {AssetData}  from './assetData.js';
import mqtt from 'mqtt';

export class Asset{
  constructor(data,asset,scene,clientCoordinateSpaceTranslation){
    //not initializing with a scene as we may want to add it in many scenes
    console.log("Asset to becreated with data",data);
    this.id=asset;
    this.clientCoordinateSpaceTranslation=clientCoordinateSpaceTranslation;
    this.adapter=new EntityAdapter(asset,data,"Asset");
    this.position=this.adapter.getPosition(); //always holds the pos in lat,lon,height
    this.spatialUpdate=this.adapter.getSpatialUpdateMethod(); 
    console.log("Update method pos:", this.spatialUpdate);
    this.rotation=this.adapter.getRotation();
    this.orientation=this.adapter.getAngle();
    this.speed=this.adapter.getSpeed();
    this.scene=scene;
    this.refAssetData=this.adapter.getRefAssetData();
    //create the AssetData object here
    
    this.previousPosition = null;
    this.targetPosition = null;
    this.lerpDuration = 500; // milliseconds
    this.lerpStartTime = null;
    this.animating = false;
    
    
    // let test= this.assetDataEntities[0].getInfo();
    // console.log("TEST ENTITY CREATION",test)
    // console.log(this.id,"MY ASSET DATA CHILDREM",this.assetDataEntities);
    // this.refupdateSrc = this.adapter.getRefUpdateSrc();
    this.resourceLinks=this.adapter.getResourceLinks();
    this.parent=this.adapter.getParent();
    this.children=this.adapter.getChildren();
    this.refSemantic=this.adapter.getRefSemantic();
    this.asset=null; //asset.position has the scene pos
    this.scenePos=null;
    // this.sign=null;
    this.prevPosition=null;
    console.log("asset created with",this.id,this.position,this.rotation,this.parent,this.children,this.refAssetData,this.refSemantic,this.resourceLinks,this.refupdateSrc);
    
    // Set up periodic updates for the object
    setInterval(() => {
      this.updateObject();
    }, 5000);

    // Set up updates for the object position
    this.updateObjectPosition();

    // Set up periodic data updates based on the sampling period
    //this will be implemented based on the updateMethod
    // if (this.refupdateSrc && this.refupdateSrc["http"] && this.refupdateSrc["http"]["samplingPeriod"]) {
    //   const samplingPeriod = this.refupdateSrc["http"]["samplingPeriod"];
    //   setInterval(() => {
    //   this.dataHTTPUpdate(this.refAssetData[0], this.refupdateSrc["http"]["url"]);
    //   }, samplingPeriod);
    // }
    
  }

  addAssetRepr(clientCoordinateSpaceTranslation,callback=null) {
    // this.scene=scene;
    this.objLoader = new OBJLoader();
    this.textureLoader = new THREE.TextureLoader();
    let resource = this.resourceLinks[0]; // Access the first resource
    // console.log("resource scale",this.id,resource.transformation.scale);
    let model = resource.model; // Extract the model path
    let textures = resource.textures; // Extract the textures array
    console.log("textures",textures)
      // if (model.startsWith("http://labserver.sense-campus.gr:7300/")) {
      //   model = model.replace("http://labserver.sense-campus.gr:7300/", "http://localhost:5001/");
      // }
    
    console.log("Model path",model);
   
   
    this.objLoader.load(model, (asset) => {
      asset.traverse((child) => {
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
      asset.position.set(objSceneCoords.x, objSceneCoords.y, objSceneCoords.z);
      console.log('position',objSceneCoords.x, objSceneCoords.y, objSceneCoords.z);
      asset.scale.set(...resource.transformation.scale); // Use the scale from the resource
      //convert rptation from deg to rads
      console.log(this.id,"rotation",this.rotation);
      this.rotation[0]=this.rotation[0]*Math.PI/180;
      this.rotation[1]=this.rotation[1]*Math.PI/180;
      this.rotation[2]=this.rotation[2]*Math.PI/180;
      asset.rotation.set(this.rotation[0],this.rotation[1],this.rotation[2]) // Fix rotation references
      asset.scale.set(...resource.transformation.scale);
      // asset.rotation.y = rotation[0];
      // this.scene.add(asset);
      this.asset=asset;
      this.scene.add(this.asset);
      // console.log("ASSET: ",this.asset);
      this.assetDataEntities = this.refAssetData.map(assetData => {
        const assetDataEntity = new AssetData(assetData,this.asset,this.scene);
        return assetDataEntity;
      });

      if (callback) callback(this.asset);
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
        //update the asset here based on the data received
        if(this.sign){
        this.sign.updateText(parseFloat(data).toFixed(2)+"°C");
        }
      })
    })
  }
  //TODO based on the Scene Descriptor/ asset Descriptor I will create the signs here
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
        this.sign = new DynamicTextSign(scene, this.position, "42°C",data.valueRepr.value[0], this.asset, { x: 0, y: 0, z: 0 });
      }
      else if (valueRepresentation === "boolean") {
        console.log("boolean one created");
        this.sign = new DynamicTextSign(scene, this.position, "Available",data.valueRepr.value[0], this.object, { x: 0, y: 0, z: 1.5 });
      }

    } catch (error) {
      console.error('Fetch error:', error);
    }
  }

 
  //TODO based on the Scene Descriptor/ Object Descriptor I will update the object here
  updateObject(){
    if (this.id) {
      console.log("updating object",this.id);
      fetch(`http://localhost:5000/v2/entities/${this.id}/attrs`)
      .then(response => {
        if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
      })
      .then(data => {
        this.newAdapter=new EntityAdapter(this.id,data,"Asset");
        let newResourceLinks=this.newAdapter.getResourceLinks();
        console.log("new",typeof newResourceLinks ,newResourceLinks);
        console.log("old" ,typeof this.resourceLinks ,this.resourceLinks);
        // only for 3d representation now
        if (this.resourceLinks && newResourceLinks && JSON.stringify(this.resourceLinks) !== JSON.stringify(newResourceLinks)) {
          this.resourceLinks = newResourceLinks;
          this.replaceModel(newResourceLinks[0].model, newResourceLinks[0].textures, newResourceLinks[0].scale);
          console.log(`Updated someAttribute to ${newResourceLinks}`);
        }
        //check if ref AssetData has changed
        let newRefAssetData=this.newAdapter.getRefAssetData();
        // console.log("newRefAssetData",newRefAssetData);
        // console.log("oldRefAssetData",this.refAssetData);
        if (this.refAssetData && newRefAssetData && JSON.stringify(this.refAssetData) !== JSON.stringify(newRefAssetData)) {
          this.refAssetData = newRefAssetData;
          //update the asset data here
            const oldIds = this.refAssetData || [];
            const newIds = newRefAssetData || [];
            
            // Find IDs that are in newIds but not in oldIds
            const addedIds = newIds.filter(newId => !oldIds.includes(newId));
            console.log("addedIds",addedIds);
            // Create new AssetData entities for the added IDs
            addedIds.forEach((newId) => {
              const newAssetDataEntity = new AssetData(newId, this.asset, this.scene);
              this.assetDataEntities.push(newAssetDataEntity);
            });
            
            // Update this.refAssetData to the new list
            this.refAssetData = newRefAssetData;
          console.log(`Updated someAttribute to ${newRefAssetData}`);
        }
      })
      .catch(error => {
        console.error('Error fetching or updating asset data:', error);
      });
    }
  }


   updateObjectPosition() {
    if (this.spatialUpdate && this.spatialUpdate.mqttwss) {
      const client = mqtt.connect(this.spatialUpdate.mqttwss.url);
  
      client.on('connect', () => {
        console.log('Connected to MQTT over WebSocket');
  
        const topic = this.spatialUpdate.mqttwss.topic;
        client.subscribe(topic, (err) => {
          if (!err) {
            console.log('Subscribed to topic:', topic);
          } else {
            console.error('Subscription error:', err);
          }
        });
      });
  
      client.on('message', (topic, message) => {
        try {
          console.log(this.id,"MQTT message received:");
          const parsedMessage = JSON.parse(message.toString());
          const vehicleData = parsedMessage.data[0];
          console.log("vehicleData",vehicleData);
          const lat = vehicleData.GeoPose.value.position.lat;
          const lon = vehicleData.GeoPose.value.position.lon;
          const alt = vehicleData.GeoPose.value.position.h;
          const speed = vehicleData.speed.value;
          const angle = vehicleData.GeoPose.value.angles.yaw;
  
          const newPos = [lat, lon, alt];
          // const localPosdict = getLocalOffset(this.clientCoordinateSpaceTranslation, newPos);
          // const localPos=[localPosdict.x, localPosdict.y, localPosdict.z];
          console.log("Position updated from", this.position, "to", newPos);
          this.position = newPos;
          this.speed = speed;
          console.log("Orientation updated from", this.orientation, "to", angle);
          this.orientation[1] = angle;
          
          
        } catch (err) {
          console.error('Error parsing MQTT message:', err);
        }
      });
  
      client.on('error', (err) => {
        console.error('MQTT Error:', err);
      });
    }
  }
  
  updateVisualPosition(delta) {
   
    if (!this.asset || !this.asset.position || !this.position) return;
    // console.log("UPDATE VISUAL","target",this.position,"current",this.asset.position);
    const current = this.asset.position;
    const current_rot= this.asset.rotation;
    const visualspeed=this.speed*delta/1000;
    // speed_vector=[x,y,z]
    //calculate 
    const target = this.position; 
    // Convert target position to scene coordinates
    const sceneTargetdict = getLocalOffset(this.clientCoordinateSpaceTranslation, target);
    const sceneTarget =[sceneTargetdict.x, sceneTargetdict.y, sceneTargetdict.z];

    // Lerp factor – controls how smooth the movement is
    const lerpFactor = 0.1; // tweak as needed; 0.1 is smooth but not too slow
    // Smoothly update position in scene coordinates
    current.x+= (sceneTarget[0] - current.x) * lerpFactor;
    current.y+= (sceneTarget[1] - current.y) * lerpFactor;
    current.z+= (sceneTarget[2] - current.z) * lerpFactor;
  
    // Smoothly update rotation in scene coordinates
    const targetRotation = this.orientation[1] * Math.PI / 180; // Convert to radians
    const rotationLerpFactor = 1; // tweak as needed; 0.1 is smooth but not too slow
    const adjustedOrientation = targetRotation - this.rotation[1]; // Adjust for alignment with north
    current_rot.y += (-adjustedOrientation - current_rot.y) * rotationLerpFactor;
    // //This is when we got no rotation data, then simply calculate it from the lat lon dif
    // const deltaX = sceneTarget[0] - current.x;
    // const deltaY = sceneTarget[1] - current.y

    // const yaw = Math.atan2(deltaY, deltaX); // radians

    // // Rotate the car to face direction of movement
    // this.asset.rotation.y=yaw -  Math.PI / 2; 
    // //////////////////////////////////////////////////////////////////

    if (this.assetDataEntities) {
      this.assetDataEntities.forEach((entity) => {
        if (entity.dataRepresentations) {
          entity.dataRepresentations.forEach((representation) => {
            if (representation.updatePosition) {
              representation.updatePosition();
            }
          });
        }
      });
    }
  }
  
  replaceModel(newModelPath, textures, scale) {
    if (!this.objLoader) this.objLoader = new OBJLoader();
    if (!this.textureLoader) this.textureLoader = new THREE.TextureLoader();
  
    const oldAsset = this.asset;
  
    this.objLoader.load(newModelPath, (newAsset) => {
      newAsset.traverse((child) => {
        if (child.isMesh) {
          child.material = new THREE.MeshStandardMaterial({
            map: textures[0] ? this.textureLoader.load(textures[0]) : null,
            color: 0xffffff,
            roughness: 0.5,
            metalness: 0.2,
          });
        }
      });
  
      // Match previous transform and scene position
      newAsset.position.copy(oldAsset.position);
      newAsset.rotation.copy(oldAsset.rotation);
      newAsset.scale.set(...scale);
  
      // Remove old mesh from scene and dispose
      oldAsset.parent?.remove(oldAsset);
      oldAsset.traverse((child) => {
        if (child.isMesh) {
          child.geometry.dispose();
          if (child.material) child.material.dispose();
        }
      });
  
      // Replace reference and re-add
      this.asset = newAsset;
      this.scene.add(this.asset);
      oldAsset.parent?.add(newAsset); // Or keep a reference to your main scene and add it there
      
      // Optional: update sign, position, or anything else tied to the old mesh
      // if (this.sign) this.sign.object3D = newAsset;
  
      console.log("Model replaced successfully.");
    }, undefined, (error) => {
      console.error('Error loading new model:', error);
    });
  }

}