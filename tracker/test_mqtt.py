import paho.mqtt.client as mqtt
from datetime import datetime

# Callback when the client connects to the broker
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Connected successfully!")
        client.subscribe("gpsapp")
    else:
        print(f"Connection failed with code {rc}")

# Callback when a message is received
def on_message(client, userdata, msg):
    current_time = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
    print(f"[{current_time}] Message on topic '{msg.topic}': {msg.payload.decode()}")

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