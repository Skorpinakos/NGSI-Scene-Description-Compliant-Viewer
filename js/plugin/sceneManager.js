import * as THREE from 'three';

export class SceneManager {
  constructor() {
    this.scene = new THREE.Scene();
    this.objects = [];
  }

  addObject(clientCoordinateSpaceTranslation,object) {
    // console.log("test0",object);

    // this.scene.add(object);
    object.addObjRepr(this.scene,clientCoordinateSpaceTranslation);
    // object.createSign(this.scene);
    // object.startWSPositionUpdates(clientCoordinateSpaceTranslation);
    // console.log("test2",object);
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