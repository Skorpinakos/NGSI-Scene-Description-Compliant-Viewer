import * as THREE from 'three';
export class LightManager {
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