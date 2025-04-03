import requests
import datetime
import random
import time

url = "http://150.140.186.118:1026/v2/entities/urn:ngsi-ld:Source:001/attrs"

headers={
    "Content-Type": "application/json",
    "FIWARE-ServicePath": "/DT/test1"
}


sensor={
    "temperature": {
        "type": "Property",
        "value": 27.0
    },
    "location": {
        "type": "GeoProperty",
        "value": {
            "type": "Point",
            "coordinates": [38.245258, 21.731860]
        }
    },
    "timestamp": {
        "type": "DateTime",
        "value": datetime.datetime.now().isoformat()
    }
}




def patch_measument( measurement,fiware_url=url, headers=headers): #for uploading the measurements
    try:
        response = requests.patch(fiware_url, headers=headers, json=measurement)
        response.raise_for_status()
        print("Measurement patched successfully.")
    except requests.exceptions.HTTPError as err:
        print(f"Failed to patch measurement: {err}")

    return 0

def fake_data():
    sensor["temperature"]["value"] = random.uniform(20, 30)
    sensor["timestamp"]["value"] = datetime.datetime.now().isoformat()
    patch_measument(sensor)

def __main__():
    while True:
        fake_data()
        time.sleep(2)

__main__()
# patch_measument(sensor)





