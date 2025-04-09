import { EntityAdapter } from "./entityAdapter";
export class AssetData {
  constructor(id) {
    this.id = id;
    this.ready = this.fetchData(); // 🔁 now you can await it
  }

  async fetchData() {
    try {
      const response = await fetch(`http://localhost:5000/v2/entities/${this.id}/attrs`);
      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }
      const data = await response.json();
      this.adapter = new EntityAdapter(this.id, data, "AssetData");
      this.representations = this.adapter.getValueRepr();
      this.sources = this.adapter.getSources();
      this.refValueURL = this.adapter.getDirectURL();
      this.description = this.adapter.getDescription();
      this.updateMethod = this.adapter.getUpdateMethod();
      console.log("AssetData Object Created", this.id, this.description);
    } catch (error) {
      console.error('Fetch error:', error);
    }
  }

  getInfo() {
    return {
      id: this.id,
      description: this.description,
      representations: this.representations,
      sources: this.sources,
      refValueURL: this.refValueURL,
      updateMethod: this.updateMethod
    };
  }
}
