import requests
from datetime import datetime, timezone

url = "http://150.140.186.118:1026/v2/entities"


headers={
    "Content-Type": "application/json",
    "FIWARE-ServicePath": "/DT/test1"
}

create_payload = {
    "id": "Vehicle:veh0",
    "type": "SumoVehicle",
    "GeoPose":{
        "type": "Property",
        "value": {
            "position": {
                "lat": 38.287813, 
                "lon":  21.788504,
                "h": 68.2
            },
            "angles": {
                "yaw": 0,
                "pitch": 0,
                "roll": 0
            }
        }
        },
    "speed": {"type": "Number", "value": 0.0},
    "acceleration": {"type": "Number", "value": 0.0},
    "angle": {"type": "Number", "value": 0.0},
    "timestamp": {
        "type": "DateTime",
        "value": datetime.utcnow().isoformat(timespec="seconds") + "Z"
    }
}

def create_entity(data):
    response = requests.post(url, json=data, headers=headers)
    # if ("Source" in data["id"]):
        # subscribe_entity_to_mqtt(headers["FIWARE-ServicePath"],data["id"],data["type"],"temperature",data["id"])
    if response.status_code == 201:
        print("Entity created successfully with service and path!")
        return 0
    else:
        print(f"Failed to create entity: {response.status_code}")
        print(response.json())
        return 1

def build_patch_payload(lat, lon, speed, accel, angle):
    payload = {
        "GeoPose":{
        "type": "Property",
        "value": {
            "position": {
                "lat": lat, 
                "lon":  lon,
                "h": 93.6
            },
            "angles": {
                "yaw": angle,
                "pitch": 0,
                "roll": 0
            }
        }
        },
    "speed": {"type": "Number", "value": speed},
    "acceleration": {"type": "Number", "value": accel},
    "timestamp": {
        "type": "DateTime",
        "value": datetime.utcnow().isoformat(timespec="seconds") + "Z"
    }
    }
    return payload

def patch_entity(id,data):
    response = requests.patch(f"{url}/{id}/attrs", json=data, headers=headers)
    if response.status_code == 204:
        print("Entity patched successfully!")
        return 0
    else:
        print(f"Failed to patch entity: {response.status_code}")
        print(response.json())
        return 1
    
create_entity(create_payload)
# data=build_patch_payload(38.287821244,21.787692352,0.0,0.0,0.0)
# patch_entity("Vehicle:veh0",data)