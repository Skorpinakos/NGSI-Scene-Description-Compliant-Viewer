
import random
import paho.mqtt.client as mqtt
import time
import csv

# Callback when the client connects to the broker
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Connected successfully!")
        client.subscribe("gpsapp")
    else:
        print(f"Connection failed with code {rc}")



# Create and configure the client
client = mqtt.Client()
client.on_connect = on_connect


# Connect to the broker
broker = "labserver.sense-campus.gr"
port = 1883
client.connect(broker, port, 60)
# Load data from the CSV file and publish it as-is
with open('tracker/video_3892_fidal_day_1.csv', mode='r') as file:
    csv_reader = csv.reader(file)
    next(csv_reader)  # Skip the header if present
    for i,row in enumerate(csv_reader): # Join the row elements into a single string
        try:

            if i==0:
                prev_row=row
                continue
            
            formatted_row = ",".join(prev_row)
            send="{"+formatted_row+"}"
            client.publish("gpsapp", send)
            print(f"Publishing: {send}")
            # print(f"Publishing: {row}")
            
            #print(i)
            time.sleep(0.001*(float(row[-1])-float(prev_row[-1])))
            prev_row=row
        except:
            pass

# Start the network loop
# client.loop_forever()


