import requests
from sub_fiware_mqtt import subscribe_entity_to_mqtt
url = "http://150.140.186.118:1026/v2/entities"


headers={
    "Content-Type": "application/json",
    "FIWARE-ServicePath": "/DT/test1"
}

def create_entity(data):
    response = requests.post(url, json=data, headers=headers)
    if ("Source" in data["id"]):
        subscribe_entity_to_mqtt(headers["FIWARE-ServicePath"],data["id"],data["type"],"temperature",data["id"])
    if response.status_code == 201:
        print("Entity created successfully with service and path!")
        return 0
    else:
        print(f"Failed to create entity: {response.status_code}")
        print(response.json())
        return 1

def patch_entity(id,data):
    # if(id=="uni_parking_001"):
    #     headers={
    #         "Content-Type": "application/json"
    # }
    response = requests.patch(f"{url}/{id}/attrs", json=data, headers=headers)
    if response.status_code == 204:
        print("Entity patched successfully!")
        return 0
    else:
        print(f"Failed to patch entity: {response.status_code}")
        print(response.json())
        return 1
