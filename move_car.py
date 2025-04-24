import requests

# The URL for the entity update
url = "http://150.140.186.118:1026/v2/entities/Vehicle:veh0/attrs"

# The payload with all the entity attributes
payload = {
    "acceleration": {
        "type": "Number",
        "value": -0.125732448,
        "metadata": {}
    },
    "angle": {
        "type": "Number",
        "value": 90.0,
        "metadata": {}
    },
    "location": {
        "type": "geo:json",
        "value": {
            "type": "Point",
            "coordinates": [21.78770, 38.287821215]
        },
        "metadata": {}
    },
    "speed": {
        "type": "Number",
        "value": 5.0,
        "metadata": {}
    },
    "timestamp": {
        "type": "DateTime",
        "value": "2025-04-16T09:48:19.000Z",
        "metadata": {}
    }
}

# Define the HTTP headers
headers = {
    "Content-Type": "application/json",
    "FIWARE-ServicePath": "/DT/test1"
}

# Send the PATCH request
response = requests.patch(url, json=payload, headers=headers)

# Output the response status and text for debugging
print(f"Status code: {response.status_code}")
print(f"Response: {response.text}")
