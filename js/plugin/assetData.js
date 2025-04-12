import { EntityAdapter } from "./entityAdapter";
import { DynamicTextSign } from "./dynamicTextSign";
export class AssetData{

    constructor(id,asset,scene) {
        this.scene=scene;
        console.log("AssetData created",id,asset,scene);
        this.id=id;
        this.parentAsset=asset;
        this.dataRepresentations=[];
        this.fetchData();

    }

    async fetchData(){
        await fetch(`http://localhost:5000/v2/entities/${this.id}/attrs`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            // console.log(this.id,"data fetched",data);
            this.adapter=new EntityAdapter(this.id,data,"AssetData");
            this.representations=this.adapter.getValueRepr();
            this.sources=this.adapter.getSources();
            this.refValueURL=this.adapter.getDirectURL();
            this.description=this.adapter.getDescription();
            this.updateMethod=this.adapter.getUpdateMethod();
            console.log("AssetData Object Created",this.id,this.description,this.representations,this.sources,this.refValueURL,this.updateMethod);
            
            this.createRepresentaion();
            
        
            
        }
        )
        .catch(error => {
            console.error('Fetch error:', error);
        });
    }

    getInfo(){
        return {id:this.id,description:this.description,representations:this.representations,sources:this.sources,refValueURL:this.refValueURL,updateMethod:this.updateMethod};
    }

    createRepresentaion(){
        if (this.representations && Array.isArray(this.representations)) {
            this.representations.forEach(representation => {
                console.log("Representation",representation);
                if (representation.type === "singularValue") {
                    let sign = new DynamicTextSign(this.scene, null,"42°C", representation,this.parentAsset, { x: 0, y: 0, z: 0 }, { width: 0.5, height: 0.2 });
                    this.dataRepresentations.push(sign);
                    this.update(sign);
                }
                else if (representation.type === "boolean") { //TODO this check of representation.type will be inside the dynamic text sign
                    let sign1 = new DynamicTextSign(this.scene,null,"Available",representation, this.parentAsset, { x: 0, y: 0, z: 0 }, { width: 0.5, height: 0.2 });
                    this.dataRepresentations.push(sign1);
                  }
            });
        } else {
            console.error("Representations are not properly defined or not an array.");
        }
    }

    update(sign){
        if (this.updateMethod?.http) {
            const { url, samplingPeriod } = this.updateMethod.http;

            if (url && samplingPeriod) {
            setInterval(async () => {
                try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error('Network response was not ok ' + response.statusText);
                }
                const value = await response.json();
                // console.log("Fetched value:", value);

                // Update the sign with the fetched value
                if (sign && typeof sign.updateText === "function") {
                    sign.updateText(value);
                }
                // sign.updateText(value);
                } catch (error) {
                console.error('Error fetching value:', error);
                }
            }, samplingPeriod);
            } else {
            console.error("Invalid URL or samplingPeriod in updateMethod.http");
            }
        }
    }

}

