import time
import random

import paho.mqtt.client as mqtt

# MQTT Configuration
BROKER = "150.140.186.118"  # Public MQTT broker
PORT = 1883
TOPIC = "ster/DT/temperature"

# Function to generate a random temperature value
def generate_temperature():
    return round(random.uniform(20.0, 30.0), 2)

# MQTT Client setup
client = mqtt.Client()

try:
    client.connect(BROKER, PORT, 60)
    print("Connected to MQTT broker.")
    
    while True:
        temperature = generate_temperature()
        client.publish(TOPIC, temperature)
        print(f"Published: {temperature} to topic {TOPIC}")
        time.sleep(2)

except KeyboardInterrupt:
    print("Exiting...")
    client.disconnect()