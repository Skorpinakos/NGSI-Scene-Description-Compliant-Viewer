import * as THREE from 'three';

export class DynamicTextSign {
  constructor(scene, position, initialText,properties, targetObject = null, offset = { x: 0, y: -2, z: 0 }, size = { width: 0.5, height: 0.2 }) {
    console.log("DynamicTextSign created",position,initialText,properties,targetObject,offset,size);
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
      console.log("Target object found",this.targetObject);
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
    // console.log("here to update to",newText,this.type);
    if (this.type==="singularValue"){
      newText = parseFloat(newText).toFixed(2) + this.properties.unit;
      this.drawSignText(newText);
    }
    else if (this.type==="boolean"){
      // console.log("boolean",newText);
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
