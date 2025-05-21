import pandas as pd
import numpy as np
import math
import random

# Utility: haversine distance (meters)
def haversine(lat1, lon1, lat2, lon2):
    R = 6371000  # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2)**2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def generate_route(raw_waypoints, start_time_ms,
                   meters_per_point=0.5,
                   alt_mean=92.6, alt_noise_pct=0.001,
                   speed_noise_pct=0.1, orient_noise_deg=5,
                   gps_noise_frac=0.15):
    """
    Generates a noisy multi-leg GPS track.
    raw_waypoints: list of [lon, lat] pairs
    start_time_ms: starting Unix time in milliseconds
    meters_per_point: sampling resolution (distance between points)
    Returns a pandas DataFrame with columns: lat, lon, alt, speed, yaw, pitch, roll, id, timestamp
    """
    # Convert raw [lon, lat] pairs to (lat, lon)
    waypoints = [(lat, lon) for lon, lat in raw_waypoints]

    lats, lons, alts, speeds = [], [], [], []
    pitches, rolls, timestamps = [], [], []
    t = start_time_ms
    total_legs = len(waypoints) - 1

    for seg_idx in range(total_legs):
        lat1, lon1 = waypoints[seg_idx]
        lat2, lon2 = waypoints[seg_idx + 1]
        # calculate distance and dynamic point count
        dist = haversine(lat1, lon1, lat2, lon2)
        n_pts = max(2, int(dist / meters_per_point) + 1)
        step_lat = (lat2 - lat1) / (n_pts - 1)
        step_lon = (lon2 - lon1) / (n_pts - 1)
        # noise levels
        noise_lat_sd = abs(step_lat) * gps_noise_frac
        noise_lon_sd = abs(step_lon) * gps_noise_frac
        base_speed = 1.25

        # sample points (avoid duplicate endpoints)
        i_start = 0 if seg_idx == 0 else 1
        for i in range(i_start, n_pts):
            # GPS position with noise
            lat = lat1 + i * step_lat + np.random.normal(0, noise_lat_sd)
            lon = lon1 + i * step_lon + np.random.normal(0, noise_lon_sd)
            lats.append(lat)
            lons.append(lon)
            # altitude with noise
            alts.append(alt_mean * (1 + random.uniform(-alt_noise_pct, alt_noise_pct)))
            # speed with noise
            speeds.append(base_speed * (1 + random.uniform(-speed_noise_pct, speed_noise_pct)))
            # pitch & roll noise
            pitches.append(random.uniform(-orient_noise_deg, orient_noise_deg))
            rolls.append(random.uniform(-orient_noise_deg, orient_noise_deg))
            # timestamp incremented at 1 Hz
            timestamps.append(t)
            t += 400

    # compute yaw (bearing clockwise from north)
    yaws = []
    for i in range(len(lats)):
        if i < len(lats) - 1:
            dlat = lats[i+1] - lats[i]
            dlon = lons[i+1] - lons[i]
            bearing = (math.degrees(math.atan2(-dlon, dlat)) + 90) % 360
            yaws.append(bearing * ((49.5 + random.random()) / 50))
        else:
            yaws.append(yaws[-1])

    # build DataFrame including id column
    df = pd.DataFrame({
        'lat': lats,
        'lon': lons,
        'alt': alts,
        'speed': speeds,
        'yaw': yaws,
        'pitch': pitches,
        'roll': rolls,
        'id': ['test'] * len(lats),
        'timestamp': timestamps
    })
    return df


if __name__ == '__main__':
    # Provided waypoints (lon, lat)
    raw_waypoints = [
    [21.788011574517, 38.287843529642],
    [21.787971042871, 38.287851137244],
    [21.787926986736, 38.287855286844],
    [21.787889979582, 38.287860128044],
    [21.787852972430, 38.287860819645],
    [21.787836231099, 38.287860128044],
    [21.787824776504, 38.287855978444],
    [21.787823895383, 38.287848370844],
    [21.787824776507, 38.287833847238],
    [21.787835349980, 38.287831772437],
    [21.787863545907, 38.287831080836],
    [21.787886455096, 38.287833155637],
    [21.787901434182, 38.287833847238]
    ]
    start_time = 1745413233823
    # generate with ~1 point per 0.5m
    df_route = generate_route(raw_waypoints, start_time, meters_per_point=0.5)
    # Save CSV
    out_path = 'tracker/faker/multi_leg_route.csv'
    df_route.to_csv(out_path, index=False)
    print(f"Saved multi-leg route ({len(df_route)} points) to {out_path}")
