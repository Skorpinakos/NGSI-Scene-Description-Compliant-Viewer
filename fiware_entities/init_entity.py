import requests

url = "http://150.140.186.118:1026/v2/entities"


headers={
    "Content-Type": "application/json",
    "FIWARE-ServicePath": "/AutoSenseAnalytics/demo"
}

def create_entity(data):
    response = requests.post(url, json=data, headers=headers)

    if response.status_code == 201:
        print("Entity created successfully with service and path!")
        return 0
    else:
        print(f"Failed to create entity: {response.status_code}")
        print(response.json())
        return 1