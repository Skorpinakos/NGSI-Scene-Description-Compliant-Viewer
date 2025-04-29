#!/usr/bin/env python3
# mqtt_sumo_freeze.py  – Option 1: snap + freeze at each GPS fix
import time
import paho.mqtt.client as mqtt
import traci
from   sumolib.net import readNet
from   car_sim_fiware import build_patch_payload, patch_entity

# ─── CONFIGURATION ────────────────────────────────────────────────────────────
NET_FILE   = "sumo/draft1/map.net.xml"
CFG_FILE   = "sumo/draft1/map.sumocfg"
SUMO_BIN   = "sumo-gui"          # use "sumo" for headless
STEP_LEN   = 1                 # seconds per SUMO step (GUI refresh)
BROKER     = "labserver.sense-campus.gr"
PORT       = 1883
TOPIC      = "gpsapp"
ENTITY_ID  = "Vehicle:veh0"      # vehicle id in SUMO and FIWARE
# ──────────────────────────────────────────────────────────────────────────────

net = readNet(NET_FILE)

# dummy edge + route (we teleport anyway)
DUMMY_EDGE = net.getEdges()[0].getID()
ROUTE_ID   = "dummy"

# ─── coordinate helpers ──────────────────────────────────────────────────────
def lonlat_to_xy(lon, lat):
    return net.convertLonLat2XY(lon, lat)

def ensure_vehicle(vid):
    if vid not in traci.vehicle.getIDList():
        traci.vehicle.add(vid, ROUTE_ID)
        traci.vehicle.setSpeedMode(vid, 0)  # disable SUMO’s controller

def place_vehicle_frozen(vid, lat, lon, yaw):
    """Snap veh to (lat,lon), set yaw, freeze speed to 0."""
    x, y = lonlat_to_xy(lon, lat)
    traci.vehicle.setColor(vid, (0, 0, 255))  # blue for frozen
    traci.vehicle.moveToXY(vid, "", 0, x, y, angle=yaw, keepRoute=2)
    traci.vehicle.setSpeed(vid, 0)          # frozen until next GPS fix

# ─── SUMO start ───────────────────────────────────────────────────────────────
traci.start([SUMO_BIN, "-c", CFG_FILE,
             "--step-length", str(STEP_LEN),
             "--start", "--quit-on-end"])
if ROUTE_ID not in traci.route.getIDList():
    traci.route.add(ROUTE_ID, [DUMMY_EDGE])

# ─── MQTT callbacks ──────────────────────────────────────────────────────────
def on_connect(cli, userdata, flags, rc):
    print("MQTT connected" if rc == 0 else f"MQTT error {rc}")
    cli.subscribe(TOPIC)

def on_message(cli, userdata, msg):
    """
    Expected payload format:
      {lat,lon,alt,speed,yaw,pitch,roll,id,timestamp}
    Only lat, lon, yaw are used; speed is ignored (we freeze to 0).
    """
    try:
        vals = msg.payload.decode().strip("{}").split(",")
        lat, lon, *_ = vals                     # get lat & lon as strings
        yaw        = float(vals[4])
        lat, lon   = float(lat), float(lon)
        vid        = vals[7] if len(vals) > 7 and vals[7] else ENTITY_ID

        ensure_vehicle(vid)
        place_vehicle_frozen(vid, lat, lon, yaw)

        # patch FIWARE once per GPS fix
        # patch_entity(
        #     ENTITY_ID,
        #     build_patch_payload(lat, lon, 0.0, 0.0, yaw)
        # )
    except Exception as e:
        print("parse error:", e)

# ─── MQTT client ─────────────────────────────────────────────────────────────
mqttc = mqtt.Client()
mqttc.on_connect = on_connect
mqttc.on_message = on_message
mqttc.connect(BROKER, PORT, keepalive=60)

def sumo_to_geo(x, y):
    lon, lat = net.convertXY2LonLat(x, y)
    return lat, lon

vehicle_traces = {} 
step=0
# ─── Main loop – continuous simulation flow ─────────────────────────────────
try:
    while traci.simulation.getMinExpectedNumber() > 0:
        mqttc.loop(0)              # process incoming MQTT packets (non‑blocking)
        traci.simulationStep()     # advance SUMO by STEP_LEN seconds

        for veh_id in traci.vehicle.getIDList():
            x, y   = traci.vehicle.getPosition(veh_id)
            print("ID",veh_id)
            lat, lon = sumo_to_geo(x, y)
            if veh_id not in vehicle_traces:
                vehicle_traces[veh_id] = []

            vehicle_traces[veh_id].append({
                "step": step,
                "lat": lat,
                "lon": lon,
                "speed": traci.vehicle.getSpeed(veh_id),
                "accel": traci.vehicle.getAcceleration(veh_id),
                "angle": traci.vehicle.getAngle(veh_id),
            })

            # Update /Vehicle NGSI‑LD entity (per vehicle)
            ngsi_id = f"Vehicle:{veh_id}"
            payload = build_patch_payload(
                lat,
                lon,
                traci.vehicle.getSpeed(veh_id),
                traci.vehicle.getAcceleration(veh_id),
                traci.vehicle.getAngle(veh_id),
            )
            if veh_id == "test":
                pass
            else:
                patch_entity("Vehicle:veh0", payload)

        time.sleep(STEP_LEN)  # Real‑time pacing (set < STEP_LEN for fast‑forward)
        step += 1

except KeyboardInterrupt:
    print("Interrupted by user – shutting down…")

finally:
    traci.close()
    mqttc.disconnect()

