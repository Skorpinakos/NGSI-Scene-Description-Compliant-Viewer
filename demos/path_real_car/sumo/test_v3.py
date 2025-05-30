"""
Replay pre‑recorded GPS fixes from a CSV file in SUMO and forward each fix to
FIWARE (NGSI‑LD) at every simulation step.

CSV format (header line required):
lat,lon,alt,speed,yaw,pitch,roll,id,timestamp

Example row:
38.28761724,21.787578,94,1.36005432,90.06948486,-2.710120927,-4.5105504,test,1745410000000

The vehicle is *snapped* to the GPS coordinate on each step; SUMO’s internal
physics are disabled so the car does not drift between updates.

Modifications (2025‑05‑30):
  • Vehicle with id "test" is spawned **6 simulation seconds** after the run
    starts. This is implemented via the `DEFERRED_STARTS` dictionary so you can
    easily add delays for other vehicles as needed.
"""

import csv
import time
from pathlib import Path
from collections import defaultdict, deque

import traci
from sumolib.net import readNet

# car_sim_fiware helpers (unchanged)
from car_sim_fiware import build_patch_payload, patch_entity

# ─── CONFIGURATION ────────────────────────────────────────────────────────────
NET_FILE   = "sumo/draft1/map.net.xml"
CFG_FILE   = "sumo/draft1/map.sumocfg"
SUMO_BIN   = "sumo-gui"            # use "sumo" for headless
STEP_LEN   = 1                      # seconds per SUMO step (GUI refresh)
CSV_FILE   = "demos/path_real_car/trace_realistic_samebearing_v2.csv"  # <‑‑‑ YOUR CSV TRACE HERE

# When the CSV contains multiple vehicles, list the IDs you want to replay.
# Leave empty to replay *all* vehicles found in the file.
REPLAY_VEH_IDS: set[str] | None = None  # e.g. {"vehA", "vehB"}

# Freeze the vehicle’s speed to 0 (snap‑and‑freeze semantics, like the MQTT
# version) or keep the speed reported in the CSV.
FREEZE_SPEED = False

# NEW: delay (in seconds) before each vehicle appears in the simulation.
#       Use simulation seconds (i.e. step count when STEP_LEN = 1).
#       For your requirement, "test" must spawn 6 s after start.
DEFERRED_STARTS: dict[str, int] = {"test": 6}
# ──────────────────────────────────────────────────────────────────────────────

# ─── SUMO network helpers ────────────────────────────────────────────────────
net = readNet(NET_FILE)
DUMMY_EDGE = net.getEdges()[0].getID()  # every vehicle teleports anyway
ROUTE_ID   = "dummy"

def lonlat_to_xy(lon: float, lat: float) -> tuple[float, float]:
    """Convert WGS84 lon/lat to SUMO x/y."""
    return net.convertLonLat2XY(lon, lat)

def ensure_vehicle(vid: str):
    if vid not in traci.vehicle.getIDList():
        traci.vehicle.add(vid, ROUTE_ID)
        traci.vehicle.setSpeedMode(vid, 0)  # full manual control

xmin, ymin, xmax, ymax = net.getBoundary()

def inside_net(x: float, y: float) -> bool:
    """Check if (x,y) is inside the SUMO network boundary."""
    return xmin <= x <= xmax and ymin <= y <= ymax

def place_vehicle(vid: str, lat: float, lon: float, yaw: float, speed: float):
    """Teleport `vid` to (lat,lon), set yaw, and apply speed/freeze."""
    x, y = lonlat_to_xy(lon, lat)
    traci.vehicle.setColor(vid, (0, 0, 255))  # blue
    # keepRoute=2 allows teleport outside the edge network
    if inside_net(x, y):
        traci.vehicle.moveToXY(vid, "", 0, x, y, angle=yaw, keepRoute=2)
        traci.vehicle.setSpeed(vid, 0 if FREEZE_SPEED else speed)
    else:
        print(f"Warning: Vehicle {vid} at ({lat}, {lon}) is outside the network boundary. Skipping placement.")
        return

# ─── Load CSV into memory ────────────────────────────────────────────────────

def load_trace(csv_path: str):
    """Return a list of rows sorted by timestamp (ascending)."""
    rows: list[dict] = []
    with open(csv_path, newline="") as f:
        reader = csv.DictReader(f)
        for r in reader:
            if REPLAY_VEH_IDS is None or r["id"] in REPLAY_VEH_IDS:
                rows.append(r)
    rows.sort(key=lambda r: int(r["timestamp"]))
    return rows

trace_rows = load_trace(CSV_FILE)
if not trace_rows:
    raise SystemExit(f"No rows found in {CSV_FILE}. Check REPLAY_VEH_IDS filter.")

# Group rows per vehicle → iterator per vehicle id
veh_traces: dict[str, deque[dict]] = defaultdict(deque)
for row in trace_rows:
    veh_traces[row["id"].strip()].append(row)

# ─── Start SUMO ──────────────────────────────────────────────────────────────
traci.start([
    SUMO_BIN, "-c", CFG_FILE,
    "--step-length", str(STEP_LEN),
    "--start", "--quit-on-end",
])
if ROUTE_ID not in traci.route.getIDList():
    traci.route.add(ROUTE_ID, [DUMMY_EDGE])

def sumo_to_geo(x, y):
    lon, lat = net.convertXY2LonLat(x, y)
    return lat, lon

vehicle_traces = {} 
step = 0
try:
    # Continue until every vehicle trace is exhausted
    while any(veh_traces.values()):
        # ── Apply one GPS fix per vehicle currently in the network ───────────
        for veh_id in traci.vehicle.getIDList():
            x, y   = traci.vehicle.getPosition(veh_id)
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
                # Patching with its own ID (could be adjusted as needed)
                # patch_entity("Vehicle:test", payload)
                pass
            else:
                patch_entity("Vehicle:veh0", payload)

        # ── Spawn / move vehicles according to their deferred starts ─────────
        for vid, q in list(veh_traces.items()):  # list() → safe to modify dict
            delay = DEFERRED_STARTS.get(vid, 0)
            if step < delay:
                # Not time yet for this vehicle
                continue

            if q:  # still have fixes for this vehicle
                fix = q.popleft()
                lat   = float(fix["lat"])
                lon   = float(fix["lon"])
                speed = float(fix["speed"])
                yaw   = float(fix["yaw"])

                ensure_vehicle(vid)
                place_vehicle(vid, lat, lon, yaw, speed)

                # Patch NGSI‑LD (per step)
                payload = build_patch_payload(lat, lon, speed, 0.0, yaw)
                if vid == "test":
                    patch_entity("test", payload)
                else:
                    # Original behavior for other vehicles
                    pass
            else:
                # queue empty → remove so the loop eventually terminates
                veh_traces.pop(vid, None)

        # ── Advance SUMO clock ───────────────────────────────────────────────
        traci.simulationStep()
        time.sleep(STEP_LEN)  # real‑time pacing
        step += 1

except KeyboardInterrupt:
    print("Interrupted – shutting down…")
finally:
    traci.close()
