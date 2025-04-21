import time
import board
import busio
import adafruit_bno055
import requests
from datetime import datetime

# --- BNO055 Setup ---
i2c = busio.I2C(board.SCL, board.SDA)
sensor = adafruit_bno055.BNO055_I2C(i2c)

# --- NGSI Settings ---
url = "http://150.140.186.118:1026/v2/entities"

headers = {
    "Content-Type": "application/json",
    "FIWARE-ServicePath": "/DT/test1"
}

# --- Create Entity Payload (once) ---
create_payload = {
    "id": "Vehicle:veh0",
    "type": "SumoVehicle",
    "GeoPose": {
        "type": "Property",
        "value": {
            "position": {
                "lat": 38.287813,
                "lon": 21.788504,
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
    if response.status_code == 201:
        print("Entity created successfully!")
    else:
        print(f"Failed to create entity: {response.status_code}")
        print(response.json())

def build_patch_payload(lat, lon, yaw, pitch, roll):
    payload = {
        "GeoPose": {
            "type": "Property",
            "value": {
                "position": {
                    "lat": lat,
                    "lon": lon,
                    "h": 68.2
                },
                "angles": {
                    "yaw": yaw,
                    "pitch": pitch,
                    "roll": roll
                }
            }
        },
        "speed": {"type": "Number", "value": 0.0},
        "acceleration": {"type": "Number", "value": 0.0},
        "timestamp": {
            "type": "DateTime",
            "value": datetime.utcnow().isoformat(timespec="seconds") + "Z"
        }
    }
    return payload

def patch_entity(id, data):
    response = requests.patch(f"{url}/{id}/attrs", json=data, headers=headers)
    if response.status_code == 204:
        print("Entity patched successfully.")
    else:
        print(f"Failed to patch entity: {response.status_code}")
        print(response.json())

# --- Create the entity once ---
create_entity(create_payload)

# --- Update loop ---
try:
    while True:
        euler = sensor.euler  # (roll, pitch, yaw)
        if euler is not None:
            roll, pitch, yaw = euler
            data = build_patch_payload(38.287813, 21.788504, yaw, pitch, roll)
            patch_entity("Vehicle:veh0", data)
        else:
            print("Waiting for valid BNO055 data...")
        time.sleep(1.0)

except KeyboardInterrupt:
    print("\nStopped by user.")
