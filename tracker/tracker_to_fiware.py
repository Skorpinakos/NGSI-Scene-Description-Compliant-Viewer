import paho.mqtt.client as mqtt
from datetime import datetime
import time
import json
import requests
from sub_fiware_mqtt import subscribe_entity_to_mqtt
url = "http://150.140.186.118:1026/v2/entities"

last_update_time = 0  # Initialize the last update time

headers={
    "Content-Type": "application/json",
    "FIWARE-ServicePath": "/DT/test1"
}



# Callback when the client connects to the broker
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Connected successfully!")
        client.subscribe("gpsapp")
    else:
        print(f"Connection failed with code {rc}")

# Callback when a message is received
def on_message(client, userdata, msg):
    global last_update_time
    current_time = time.time()
    
    if current_time - last_update_time < 1:
        # Skip this message, too 
        return

    last_update_time = current_time
    print(f"[{current_time}] Message on topic '{msg.topic}': {msg.payload.decode()}")
    # Parse the message payload (assuming it's in JSON format)
    payload = msg.payload.decode()
    csv_data = payload[1:-1].split(",")
    print(csv_data)
    # Write the message to a CSV file
    with open("messages_11_06.csv", "a") as file:
        file.write(f"{float(csv_data[0])},{float(csv_data[1])},{float(csv_data[2])},{float(csv_data[3])},{float(csv_data[4])},{float(csv_data[5])},{float(csv_data[6])},{str(csv_data[7])},{int(csv_data[8])}\n")
    # Extract the data from the payload (assuming it's a JSON string)
    try:
        lat, lon, alt = float(csv_data[0]), float(csv_data[1]), float(csv_data[2])
        speed = float(csv_data[3])
        yaw, pitch, roll = float(csv_data[4]), float(csv_data[5]), float(csv_data[6])
        tracker_id = str(csv_data[7])
        rawtime = int(csv_data[8])

        current_rawtime=get_current_rawtime(tracker_id)
        # if(rawtime<=current_rawtime):
        #     print("rawtime is not updated")
        #     return
        # Check if the entity with tracker_id exists
        response = requests.get(f"{url}/{tracker_id}", headers={"FIWARE-ServicePath": "/DT/test1"})
        if response.status_code == 404:
            # Entity does not exist, create it
            print(f"Entity with ID {tracker_id} does not exist. Creating it.")
            create_payload = build_create_payload(lat, lon, alt, speed, roll, pitch, yaw, tracker_id, rawtime)
            create_entity(create_payload)
        elif response.status_code == 200:
            # Entity exists, patch it
            patch_payload = build_patch_payload(lat, lon, alt, speed, roll, pitch, yaw, tracker_id, rawtime)
            patch_entity(tracker_id, patch_payload)
        else:
            # Handle other errors
            print(f"Error checking entity existence: {response.status_code}")
            return
    except Exception as e:
        print(f"Error processing message: {e}")




gps_tracker_entity={
    # "id": "GPSTracker:tracker0",
    # "type": "GPSTracker",
    "trackerid":{
        "type": "String",
        "value": "test"
    },
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
    "timestamp": {
        "type": "DateTime",
        "value": datetime.utcnow().isoformat(timespec="seconds") + "Z"
    },
    "rawtime":{
        "type": "Property",
        "value": 1744907872658
    }
}

def get_current_rawtime(entity_id):
    headers={
        "FIWARE-ServicePath": "/DT/test1"
    }
    try:
        print(f"{url}/{entity_id}/attrs/rawtime")
        response = requests.get(f"{url}/{entity_id}/attrs/rawtime",headers=headers)
        if response.status_code == 200:
            return response.json()["value"]
        else:
            print(f"Failed to get current rawtime: {response.status_code}")
            return 0
    except Exception as e:
        print(f"Error fetching rawtime: {e}")
        return 0

def build_patch_payload(lat, lon, alt, speed, roll, pitch, yaw,id,rawtime):
    payload = {
        "GeoPose":{
            "type": "Property",
            "value": {
                "position": {
                    "lat": lat, 
                    "lon":  lon,
                    "h": alt
                },
                "angles": {
                    "yaw": yaw,
                    "pitch": pitch,
                    "roll": roll
                }
            }
            },
        "speed": {
            "type": "Number",
            "value": speed
        },
        "timestamp": {
            "type": "DateTime",
            "value": datetime.utcnow().isoformat(timespec="seconds") + "Z"
        },
        "rawtime":{
            "type": "Property",
            "value": rawtime
        }
        }
    return payload

def build_create_payload(lat, lon, alt, speed, roll, pitch, yaw,id,rawtime):
    payload = {
        "id": id,
        "type": "GPSTracker",
        "GeoPose":{
            "type": "Property",
            "value": {
                "position": {
                    "lat": lat, 
                    "lon":  lon,
                    "h": alt
                },
                "angles": {
                    "yaw": yaw,
                    "pitch": pitch,
                    "roll": roll
                }
            }
            },
        "speed": {
            "type": "Number",
            "value": speed
        },
        "timestamp": {
            "type": "DateTime",
            "value": datetime.utcnow().isoformat(timespec="seconds") + "Z"
        },
        "rawtime":{
            "type": "Property",
            "value": rawtime
        }
    }
    return payload

def create_entity(data):
    response = requests.post(url, json=data, headers=headers)
    subscribe_entity_to_mqtt(headers["FIWARE-ServicePath"],data["id"],data["type"],"GeoPose",data["id"])
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

# Create and configure the client
client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message

# Connect to the broker
broker = "labserver.sense-campus.gr"
port = 1883
client.connect(broker, port, 60)

# Start the network loop
client.loop_forever()