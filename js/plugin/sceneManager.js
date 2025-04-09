import * as THREE from 'three';
import { EntityAdapter } from './entityAdapter';

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
        this.objects = []; // Initialize the objects array here
      })
      .catch(error => {
        console.error('Fetch error:', error);
      });
  }
}