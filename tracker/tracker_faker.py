import random
import paho.mqtt.client as mqtt
import time

# Callback when the client connects to the broker
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Connected successfully!")
        client.subscribe("gpsapp")
    else:
        print(f"Connection failed with code {rc}")



def generate_random_coordinates(bbox, num_points=1):
    min_lon, min_lat, max_lon, max_lat = bbox
    coordinates = []
    for _ in range(num_points):
        lon = random.uniform(min_lon, max_lon)
        lat = random.uniform(min_lat, max_lat)
        coordinates.append((lon, lat))
    return coordinates

# Example usage
random_coords = generate_random_coordinates([21.787568, 38.287593, 21.788496, 38.287833], num_points=100)
print(random_coords)





# Create and configure the client
client = mqtt.Client()
client.on_connect = on_connect

# Connect to the broker
broker = "labserver.sense-campus.gr"
port = 1883
client.connect(broker, port, 60)

for i in random_coords:
    data_str = f"[{i[1]}, {i[0]}, 68, 5, 0, 90, 0,test, {int(time.time())}]"
    client.publish("gpsapp", data_str)
    time.sleep(2)

# Start the network loop
client.loop_forever()


