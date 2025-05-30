# server.py
from mcp.server.fastmcp import FastMCP
from typing import Optional
import requests
import json
# Create an MCP server
mcp = FastMCP("Demo")


@mcp.tool()
def fetch_entity(
    url:str
)->str:
    """Fetch an entity from a given URL in order to create its asset and asset data description for the DT."""
    try:
        response = requests.get(url)
        response.raise_for_status()  # Raise an error for bad responses
        entity = response.json()
        return entity
    except requests.RequestException as e:
        return {"error": str(e)}

@mcp.tool()
def gen_asset_entity(
    asset_id: str,
    parent_id: str,
    refAsset_data_ids: list,
    refChildren_ids: list,
    refsemantic_rep_ids: list,
    GeoPose: dict,
    resoureLink:list,
    speed: float,
    updateMethodSpatial: dict #irellevant if static asset
) -> dict:
    """When an asset descriptor is asked to be created and posted in fiware it must follow the format bellow\
        Generate a FIWARE entity with everything that is needed, such as 3d representation, geoPose, asset data, etc."""
    # Create the FIWARE entity
    entity = {
        "id": f"urn:ngsi-ld:Asset:{asset_id}",
        "type": "Asset",
        "refAssetData": {
            "type": "Relationship",
            "value": refAsset_data_ids
        },
        "resourceLink": {
            "type": "Property",
            "value": resoureLink
        },
        "GeoPose": {
            "type": "Property",
            "value": GeoPose
        },
        "updateMethodSpatial": {
            "type": "Property",
            "value": updateMethodSpatial
        },
        "speed": {
            "type": "Property",
            "value": {
                "speed": speed,
                "unit": "m/s"
            }
        },
        "refSemanticRepresentation": {
            "type": "Relationship",
            "value": refsemantic_rep_ids
        },
        "refParent": {
            "type": "Relationship",
            "value": f"urn:ngsi-ld:Asset:{parent_id}"
        },
        "refChildren": {
            "type": "Relationship",
            "value": refChildren_ids
        },
    }

    return "FIWARE entity generated"

@mcp.tool()
def gen_asset_data(
    id:str,
    type:str,
    refSource:list,
    refValue:str,
    description:str,
    valueRepr:list,
    updateMethod:dict)->dict:
    """Based on the data that the sensor of the prompt provides create a Asset Data entity.\
        for example if the sensor measures temperature and humidity create\
        a temperature and humidity Asset data entity
    
        Args:
            id (str): The id of the asset data entity
            type (str): The type of the asset data entity
            refSource (list): The source of the asset data entity (fiware entity id)
            refValue (str): The direct link to the value of the asset data entity, http link to fiware entity to the exact attr value
            description (str): The description of the asset data entity
            valueRepr (list): The representation of the asset data entity
            updateMethod (dict): The update method of the asset data entity
    """
    
    asset_data_entity = {
        "id": f"urn:ngsi-ld:AssetData:{id}",
        "type": type,
        "refSource": {
            "type": "Relationship",
            "value": refSource
        },
        "refValue": {
            "type": "Property",
            "value": refValue
        },
        "description": {
            "type": "Property",
            "value": description
        },
        "valueRepr": {
            "type": "Property",
            "value": valueRepr
        },
        "updateMethod": {
            "type": "Property",
            "value": updateMethod
        }
    }
    
    return asset_data_entity

@mcp.tool()
def gen_updateMethod(
    url: str,
    method: str,
    samplingPeriod: Optional[int] = None
)->dict:
    """Generate the update method for the asset data entity, always with sampling and http in the fiware entity\
        but it can also have a mqtt or a ws if the user specifies it
        
        Args:
            url (str): The url of the update method
            method (str): The method of the update method for example GET, POST, PUT, DELETE
            samplingPeriod (int): The sampling period of the update method"""
   
    dict={
        "http": {
            "url": url,
            "method": method,
            "headers": {
                "Content-Type": "application/json"
            },
            "samplingPeriod": samplingPeriod
        }
    }
    
    return dict

@mcp.tool()
def gen_valueRepr(
    type: str,
    unit: str,
    threshold: Optional[dict],
    states: Optional[list] = None
)->dict:
    """Generate a description for the value representation of the asset data entity\
        Args:
            type (str): The type of the value representation
            unit (str): The unit of the value representation
            threshold (float): The threshold of the value representation
            states (list): The states of the value representation
    """
    if(type=="singularValue"):
        dict={
            "type": type,
            "unit": unit,
            "threshold": {
                "min": threshold,
                "max": threshold
            }
        }
    elif(type=="boolean" or type=="binary"):
        dict={
            "type": type,
            "states": {
                "value": states
            }
        }

    
    return [dict]
    
@mcp.tool()
def post_entity(entity: dict) -> str:
    """Post the entity to the fiware context broker, it must follow the format specified in the gen_asset_entity or gen_asset_data functions."""
    # Post the entity to the FIWARE Context Broker
    url = "http://150.140.186.118:1026/v2/entities"
    headers = {
        "Content-Type": "application/json",
        "fiware-servicepath": "/"
    }

    response = requests.post(url, headers=headers, json=entity)
    if response.status_code == 201:
        return {"status": "Entity created successfully , id: " + entity["id"]}
    else:
        return {"error": response.text}
    
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
def gen_asset_repr(prompt:str)->list:
    """Generate a 3D asset representation based on the prompt that the user provides
    Args:
        prompt (str): The prompt that the user provides to generate the 3D asset.
    Returns:
        the json of resource link to be used for the fiware asset descriptor
    """
    #get the prompt from the user

    #call the api of shap-e to generate the 3D asset
    # Get the prompt from the user
    # prompt = "Enter your prompt here"  # Replace with actual user input

    # Call the API of shap-e to generate the 3D asset
    url = "http://labserver.sense-campus.gr:7300/generate"
    headers = {"Content-Type": "application/json"}
    body = {"prompt": prompt}

    response = requests.post(url, headers=headers, data=json.dumps(body))
    if response.status_code != 200:
        return {"error": "Failed to generate 3D asset"}

    response_data = response.json()
    if response_data.get("status") != "success":
        return {"error": "3D asset generation failed"}

    obj_filename = response_data.get("filename")
    if not obj_filename:
        return {"error": "No filename returned from the server"}
    #take the link of the generated 3D asset and return it to the user
    
    #create the resource link json and return it to the user
    repr={
        "type": "3d",
        "format": "obj",
        "model": "http://labserver.sense-campus.gr:7300/download/"+obj_filename,
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

if __name__ == "__main__":
    mcp.run(transport="stdio")