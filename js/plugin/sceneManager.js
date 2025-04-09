import * as THREE from 'three';
import { EntityAdapter } from './entityAdapter';
import {Asset} from './asset.js';
export class SceneManager {
  constructor(clientCoordinateSpaceTranslation) {
    this.scene = new THREE.Scene();
    this.clientCoordinateSpaceTranslation = clientCoordinateSpaceTranslation;
    this.refAssets = null;
    this.objects = []; 
    this.buildScene();
  }

  addObject(object) {

    object.addObjRepr(this.scene,this.clientCoordinateSpaceTranslation);
    
    this.objects.push(object);
    console.log("Updated objects",this.objects);
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

  getObjects() {
    console.log("getObjects");
    return this.objects;
  }

  getScene() {
    return this.scene;
  }

  buildScene() {
    fetch('http://localhost:5000/v2/entities/urn:ngsi-ld:SceneDescriptor:001')
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
              let obj = new Asset(data,asset);
              console.log(obj);
              this.addObject(obj);
              // obj.addObjRepr(scene,clientCoordinateSpaceTranslation,(loadedObject) => {
                //TODO: SCENE manages should create the objects
                // obj.createSign(scene);
                // obj.startWSPositionUpdates(clientCoordinateSpaceTranslation);
                // sceneManager.addObject(obj) //TODO add this to a scene update method 
              // });
            })
          .then(() => {
              let objects= this.getObjects();
              console.log("objects",objects);
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