import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import {getLocalOffset} from './global2local.js';
import mqtt from 'mqtt';
import { cameraFar, roughness } from 'three/tsl';
import {SceneManager} from './plugin/sceneManager.js';
import {LightManager} from './plugin/LightManager.js';
import {Asset} from './plugin/asset.js';

let cube;
let cube2;

// Scene Creation
export function createSecondaryScene(clientCoordinateSpaceTranslation) {
  //scene will be created based on the scene descriptor and translated to the client coordinate space (dictated by the background chosen)
  const sceneManager = new SceneManager(clientCoordinateSpaceTranslation);
  const scene = sceneManager.getScene();
  console.log("hi1");
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

  // cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

  // ////lets say the cube is at [38.245105, 21.731640,2] in global (aka gps) coords 
  // let cubeSceneCoords=getLocalOffset(clientCoordinateSpaceTranslation, [38.287965, 21.788632,72]);
  
  // cube.position.set(cubeSceneCoords.x, cubeSceneCoords.y, cubeSceneCoords.z);
  // sceneManager.addObject(cube);
  // //38.288051, 21.788754
  // cube2 = new THREE.Mesh(cubeGeometry, cubeMaterial);
  // let cubeSceneCoords2=getLocalOffset(clientCoordinateSpaceTranslation, [38.287826, 21.788487,72]);
  // cube2.position.set(cubeSceneCoords2.x, cubeSceneCoords2.y, cubeSceneCoords2.z);;
  // sceneManager.addObject(cube2);
  

  // console.log("coords1:",cubeSceneCoords);
  // console.log("coords2:",cubeSceneCoords2);


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
