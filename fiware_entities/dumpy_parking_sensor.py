parking_sensor = {
        # "id": "uni_parking_001",
        # "type": "ParkingSpot",
        "category": {
        "type": "Text",
        "value": "OffStreet",
        "metadata": {}
        },
        "dateModified": {
        "type": "DateTime",
        "value": "2025-04-12T13:13:42.000Z",
        "metadata": {}
        },
        "location": {
        "type": "geo:json",
        "value": {
        "type": "Point",
        "coordinates": [
        21.788438498,
        38.287755788
        ]
        },
        "metadata": {}
        },
        "refParkingSite": {
        "type": "URL",
        "value": "http://labserver.sense-campus.gr:1026/v2/entities/parkingsite_upatras_001",
        "metadata": {}
        },
        "status": {
        "type": "Number",
        "value": 0,
        "metadata": {}
        }
}

import requests
from init_entity import patch_entity
import time

while True:
    # Toggle the status value
    parking_sensor["status"]["value"] = 1 if parking_sensor["status"]["value"] == 0 else 0
    
    # Patch the entity
    patch_entity("uni_parking_001",parking_sensor)
    
    # Wait for 10 seconds
    time.sleep(10)