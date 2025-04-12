export class EntityAdapter{
  constructor(id,entityData,entityType){
    this.rawdata=entityData;
    this.id=id;
    this.type=entityType;
  }

  getPosition() {
    if (this.type === "Asset") {
      if (this.id === "urn:ngsi-ld:Asset:004") {
        return [this.rawdata.spatialInfo.value.geoPose.position.lat, this.rawdata.spatialInfo.value.geoPose.position.lon, this.rawdata.spatialInfo.value.geoPose.position.h];
      } else {
        return [this.rawdata.GeoPose.value.position.lat, this.rawdata.GeoPose.value.position.lon, this.rawdata.GeoPose.value.position.h];
      }
    }
    return null;
  }

  getSpatialUpdateMethod(){
    if( this.type === "Asset") {
      return this.rawdata.updateMethodSpatial.value;
    }
  }

  getRotation() {
    if (this.type === "Asset") {
      if (this.id === "urn:ngsi-ld:Asset:004") {
        return [this.rawdata.spatialInfo.value.geoPose.angles.yaw, this.rawdata.spatialInfo.value.geoPose.angles.pitch, this.rawdata.spatialInfo.value.geoPose.angles.roll];
      } else {
        return [this.rawdata.GeoPose.value.angles.yaw, this.rawdata.GeoPose.value.angles.pitch, this.rawdata.GeoPose.value.angles.roll];
      }
    }
    return null;
  }

  getParent() {
    if (this.type === "Asset") {
      return this.rawdata.refParent.value;
    }
    return null;
  }

  getChildren() {
    if (this.type === "Asset") {
      return this.rawdata.refChildren.value;
    }
    return null;
  }

  getRefAssetData() {
    if (this.type === "Asset") {
      return this.rawdata.refAssetData.value;
    }
    return null;
  }

  getRefSemantic() {
    if (this.type === "Asset") {
      return this.rawdata.refSemanticRepresentation.value;
    }
    return null;
  }

  getResourceLinks() {
    if (this.type === "Asset") {
      return this.rawdata.resourceLink.value;
    }
    return null;
  }

  getRefUpdateSrc() {
    if (this.type === "Asset") {
      return this.rawdata.updateMethod.value;
    }
    return null;
  }

  getValueRepr(){
    if (this.type === "AssetData") {
      return this.rawdata.valueRepr.value;
    }
    return null;
  } 

  getSources(){
    if (this.type === "AssetData") {
      return this.rawdata.refSource.value;
    }
    return null;
  }

  getDirectURL(){
    if (this.type === "AssetData") {
      return this.rawdata.refValue.value;
    }
    return null;
  }

  getUpdateMethod(){
    if (this.type === "AssetData") {
      return this.rawdata.updateMethod.value;
    }
    return null;
  }

  getDescription(){
    if (this.type === "AssetData") {
      return this.rawdata.description.value;
    }
    return null;
  }

  getRefAssets(){
    if (this.type === "SceneDescriptor") {
      return this.rawdata.refAssets.value;
    }
    return null;
  }

}