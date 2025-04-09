import { EntityAdapter } from "./entityAdapter";
export class AssetData{

    constructor(id){
        this.id=id;
        this.representations=[];
        this.sources=[];
        this.refValueURL=null;
        this.description=null;
        this.updateMethod=null;
    }
}

