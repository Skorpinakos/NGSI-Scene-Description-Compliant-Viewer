import * as THREE from 'three';
import { EntityAdapter } from './entityAdapter';
import {Asset} from './asset.js';


export class SceneManager {
  constructor(id,clientCoordinateSpaceTranslation) {
    this.id=id;
    this.scene = new THREE.Scene();
    this.clientCoordinateSpaceTranslation = clientCoordinateSpaceTranslation;
    this.refAssets = null;
    this.assets = []; 
    this.buildScene();
    // setInterval(() => this.update(0), 10000);
  }

  addAsset(asset) {

    asset.addAssetRepr(this.clientCoordinateSpaceTranslation);
    
    this.assets.push(asset);
    console.log("Updated assets",this.assets);
  }

  removeAsset(asset) {
    this.scene.remove(asset);
    this.assets = this.assets.filter(obj => obj !== asset);
  }

  update(delta) {
    this.assets.forEach(asset => {
      if (asset && asset.asset) {
        console.log("UPDATE CALLED")
        asset.updateVisualPosition(delta); 
      }
    });
  }
  

  getAssets() {
    console.log("getAssets");
    return this.assets;
  }

  getScene() {
    return this.scene;
  }

  buildScene() {
    fetch(`http://localhost:5000/v2/entities/${this.id}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
      })
      .then(data => {
        this.adapter = new EntityAdapter("urn:ngsi-ld:SceneDescriptor:001", data, "SceneDescriptor");
        this.refAssets = this.adapter.getRefAssets();
        console.log("SceneManager created", this.refAssets);
        
        //create the representation of the Asset 
        for (let asset of this.refAssets) {
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
              // console.log("hi3")
              let curr_asset = new Asset(data,asset,this.scene,this.clientCoordinateSpaceTranslation);
              console.log("testestste",curr_asset);
              this.addAsset(curr_asset);
              // obj.addObjRepr(scene,clientCoordinateSpaceTranslation,(loadedObject) => {
                //TODO: SCENE manages should create the objects
                // obj.createSign(scene);
                // obj.startWSPositionUpdates(clientCoordinateSpaceTranslation);
                // sceneManager.addAsset(obj) //TODO add this to a scene update method 
              // });
            })
          .then(() => {
              let assets= this.getAssets();
              console.log("assets",assets);
          }
          )
          .catch(error => { 
            console.error('Fetch error:', error);
          });
        }
      })
      .catch(error => {
        console.error('Fetch error:', error);
      });
  }
}