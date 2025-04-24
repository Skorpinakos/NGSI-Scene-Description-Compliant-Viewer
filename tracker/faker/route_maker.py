import pandas as pd
import numpy as np
import math,random

# Parameters
start_lat = 38.287832
start_lon = 21.788005
end_lat = 38.287862
end_lon = 21.787801
start_time = 1745413233823  # Unix timestamp in ms
n_points = 5  # from t=0 to t=10 seconds

# Time array (in ms)
timestamps = start_time + np.arange(n_points) * 2000

# Compute step increments
step_lat = (end_lat - start_lat) / (n_points - 1)
step_lon = (end_lon - start_lon) / (n_points - 1)

# Compute total distance (haversine) and base speed (m/s)
R = 6371000  # Earth radius in meters
lat1_rad = math.radians(start_lat)
lon1_rad = math.radians(start_lon)
lat2_rad = math.radians(end_lat)
lon2_rad = math.radians(end_lon)
dlat = lat2_rad - lat1_rad
dlon = lon2_rad - lon1_rad
a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
total_distance = R * c
base_speed = total_distance / (n_points - 1)  # m/s

# Prepare arrays
lats = []
lons = []
alts = []
speeds = []
yaws = []
pitches = []
rolls = []
ids = list(range(n_points))

# Noise parameters
noise_lat_sd = abs(step_lat) * 0.15
noise_lon_sd = abs(step_lon) * 0.15

for i in range(n_points):
    # GPS with small variation
    lat = start_lat + i * step_lat + np.random.normal(0, noise_lat_sd)
    lon = start_lon + i * step_lon + np.random.normal(0, noise_lon_sd)
    lats.append(lat)
    lons.append(lon)
    
    # Altitude around 93m ±0.5%
    alts.append(93 * (1 + np.random.uniform(-0.005, 0.005)))
    
    # Speed around base_speed ±0.5%
    speeds.append(base_speed * (1 + np.random.uniform(-0.05, 0.05)))
    
    # Pitch and roll ±5 degrees
    pitches.append(np.random.uniform(-5, 5))
    rolls.append(np.random.uniform(-5, 5))

# Compute yaw for each segment (angle anticlockwise from north)
for i in range(n_points):
    if i < n_points - 1:
        dlat_seg = lats[i+1] - lats[i]
        dlon_seg = lons[i+1] - lons[i]
        yaw = math.degrees(math.atan2(-dlon_seg, dlat_seg))+90
        if yaw < 0:
            yaw += 360
        yaws.append(yaw*((3.5+random.random())/4))
    else:
        yaws.append(yaws[-1])  # repeat last yaw

# Build DataFrame
df = pd.DataFrame({
    'lat': lats,
    'lon': lons,
    'alt': alts,
    'speed': speeds,
    'yaw': yaws,
    'pitch': pitches,
    'roll': rolls,
    'id': ids,
    'timestamp': timestamps
})

# Save to CSV
file_path = 'tracker/faker/route.csv'
df.to_csv(file_path, index=False)



