import { EntityAdapter } from "./entityAdapter";
export class AssetData{

    constructor(id){
        this.id=id;
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
        }
        )
        .catch(error => {
            console.error('Fetch error:', error);
        });
    }

    getInfo(){
        return {id:this.id,description:this.description,representations:this.representations,sources:this.sources,refValueURL:this.refValueURL,updateMethod:this.updateMethod};
    }
}

