import * as THREE from 'three';
import { EntityAdapter } from './entityAdapter';

export class SceneManager {
  constructor(clientCoordinateSpaceTranslation) {
    this.scene = new THREE.Scene();
    // this.adapter= new EntityAdapter("urn:ngsi-ld:SceneDescriptor:001",data,"SceneDescriptor");
    // this.refAssets = getRefAssets();
    this.clientCoordinateSpaceTranslation = clientCoordinateSpaceTranslation;
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
}