export class EntityAdapter{
  constructor(id,entityData){
    this.rawdata=entityData;
    this.id=id;
  }

  getPosition(){
    if(this.id==="urn:ngsi-ld:Asset:004"){
      return [this.rawdata.spatialInfo.value.geoPose.position.lat,this.rawdata.spatialInfo.value.geoPose.position.lon,this.rawdata.spatialInfo.value.geoPose.position.h];
    }
    else{
      return [this.rawdata.geoPose.value.position.lat,this.rawdata.geoPose.value.position.lon,this.rawdata.geoPose.value.position.h];
    }
  }

  getRotation(){
    if(this.id==="urn:ngsi-ld:Asset:004"){
      return [this.rawdata.spatialInfo.value.geoPose.angles.yaw,this.rawdata.spatialInfo.value.geoPose.angles.pitch,this.rawdata.spatialInfo.value.geoPose.angles.roll];
    }
    else{
      return [this.rawdata.geoPose.value.angles.yaw,this.rawdata.geoPose.value.angles.pitch,this.rawdata.geoPose.value.angles.roll];
    }
  }
  getParent(){
    return this.rawdata.refParent.value;
  }
  getChildren(){
    return this.rawdata.refChildren.value;
  }
  getRefAssetData(){
    return this.rawdata.refAssetData.value;
  }
  getRefSemantic(){
    return this.rawdata.refSemanticRepresentation.value;
  }

  getResourceLinks(){
    return this.rawdata.resourceLink.value;
  }

  getRefUpdateSrc(){
    return this.rawdata.updateSrc.value;
  }

  getSpatialInfo(){
    return this.rawdata.spatialInfo.value;
  }



}