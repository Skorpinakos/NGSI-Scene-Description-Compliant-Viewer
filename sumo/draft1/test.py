import os
import traci
import json
from sumolib.net import readNet
import time
from car_sim_fiware import build_patch_payload, patch_entity
# === CONFIGURATION ===
NET_FILE = "sumo/draft1/map.net.xml"
ROUTE_FILE = "sumo/draft1/map.rou.xml"
SUMO_BINARY = "sumo"
OUTPUT_DIR = "vehicle_traces"

# # === Prepare output folder ===
# os.makedirs(OUTPUT_DIR, exist_ok=True)

# === Coordinate conversion ===
net = readNet(NET_FILE)
def sumo_to_geo(x, y):
    lon, lat = net.convertXY2LonLat(x, y)
    return lat, lon

# === Start SUMO simulation ===
sumo_cmd = [SUMO_BINARY, "-n", NET_FILE, "-r", ROUTE_FILE, "--start", "--quit-on-end"]
traci.start(sumo_cmd)

vehicle_traces = {}  # {vehID: [ {step, lat, lon}, ... ]}
step = 0

while traci.simulation.getMinExpectedNumber() > 0:
    traci.simulationStep()
    for veh_id in traci.vehicle.getIDList():
        x, y = traci.vehicle.getPosition(veh_id)
        lat, lon = sumo_to_geo(x, y)
        if veh_id not in vehicle_traces:
            vehicle_traces[veh_id] = []
        if veh_id=="test":
            pass
        vehicle_traces[veh_id].append({
            "step": step,
            "lat": lat,
            "lon": lon,
            "speed": traci.vehicle.getSpeed(veh_id),
            "accel": traci.vehicle.getAcceleration(veh_id),
            "angle" : traci.vehicle.getAngle(veh_id)
        })
    #update fiware entity
        
        new_payload = build_patch_payload(lat, lon, traci.vehicle.getSpeed(veh_id), traci.vehicle.getAcceleration(veh_id), traci.vehicle.getAngle(veh_id))
        patch_entity("Vehicle:veh0", new_payload)
    # Simulate real-time by sleeping for a short duration
    time.sleep(1)  # Adjust the sleep duration as needed (e.g., 0.1 seconds for 10 FPS)
    step += 1

traci.close()

# # === Write each vehicle to its own JSON file ===
# for veh_id, trace in vehicle_traces.items():
#     filename = os.path.join(OUTPUT_DIR, f"{veh_id}.json")
#     with open(filename, "w") as f:
#         json.dump(trace, f, indent=2)

print(f"✅ Exported {len(vehicle_traces)} vehicles to: {OUTPUT_DIR}")

