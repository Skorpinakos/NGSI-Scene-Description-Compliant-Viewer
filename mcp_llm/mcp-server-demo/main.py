# server.py
from mcp.server.fastmcp import FastMCP
from typing import Optional
import requests
# Create an MCP server
mcp = FastMCP("Demo")


@mcp.tool()
def gen_asset_entity(
    asset_id: str,
    parent_id: str,
    refAsset_data_ids: list,
    refChildren_ids: list,
    refsemantic_rep_ids: list,
    GeoPose: dict,
    model_path: str,
    texture_paths: list,
    speed: float
) -> dict:
    """Generate a FIWARE entity"""


    return "FIWARE entity generated"

@mcp.tool()
def gen_GeoPose(
    address: Optional[str] = None,
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    alt: Optional[float] = None,
    roll: float = 0,
    pitch: float = 0,
    yaw: float = 0
) -> dict:
    """
    Generate a GeoPose JSON block from flexible inputs.
    - If address is given but lat/lon is missing, it geocodes.
    - If lat/lon is given but address or altitude is missing, it reverse geocodes or estimates.
    """
    
    # --- MOCKED GeoResolver Logic ---
    def geocode(address: str):
        """
        Use OpenStreetMap's Nominatim API to convert an address to (lat, lon).
        """
        url = "https://nominatim.openstreetmap.org/search"
        params = {
            "q": address,
            "format": "json",
            "limit": 1
        }
        headers = {
            "User-Agent": "geo_pose_tool/1.0"
        }

        response = requests.get(url, params=params, headers=headers)
        data = response.json()

        if not data:
            return None

        lat = float(data[0]["lat"])
        lon = float(data[0]["lon"])

        url = f"https://api.open-meteo.com/v1/elevation?latitude={lat}&longitude={lon}"
        response = requests.get(url)
        data = response.json()

        elevation = data.get("elevation", [None])[0]
        return lat, lon, elevation

    def reverse_geocode(lat: float, lon: float):
        # Replace with real reverse geocoding if needed
        return "Fake Street, Faketown"

    def estimate_altitude(lat: float, lon: float):
        url = f"https://api.open-meteo.com/v1/elevation?latitude={lat}&longitude={lon}"
        response = requests.get(url)
        data = response.json()

        elevation = data.get("elevation", [None])[0]
        return elevation

    # --- Logic ---
    if address and (lat is None or lon is None):
        lat, lon, alt = geocode(address)
        
    
    if lat is not None and lon is not None:
        if not alt:
            alt = estimate_altitude(lat, lon)
        if not address:
            address = reverse_geocode(lat, lon)

    if lat is None or lon is None:
        return {"error": "Insufficient input. Please provide either address or lat/lon."}

    # --- Build GeoPose JSON ---
    geo_pose = {
        "type": "Property",
        "value": {
            "position": {
                "lat": lat,
                "lon": lon,
                "h": alt if alt is not None else 0.0
            },
            "angles": {
                "yaw": yaw,
                "pitch": pitch,
                "roll": roll
            }
        },
        "metadata": {}
    }

    return geo_pose

@mcp.tool()
def gen_asset_repr()->list:
    """Generate a 3D asset representation based on the prompt"""
    #get the prompt from the user

    #call the api of shap-e to generate the 3D asset

    #take the link of the generated 3D asset and return it to the user
    obj_filename = "generated_asset.obj"
    #create the resource link json and return it to the user
    repr={
        "type": "3d",
        "format": "obj",
        "model": "https://localhost:5000/download/"+obj_filename,
        "textures":["https://localhost:5000/download/texture1.png"],
        "size": 1.0,
        "transformation":{
            "rotation": [
                0,
                180,
                0
            ],
            "position": [
                0,
                0,
                0
            ],
            "scale": [
                0.1,
                0.1,
                0.1
            ]
            }
    }
    
    return [repr]
