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
    raw_waypoints = [[
            21.787577996,
            38.287617242
          ],
          [
            21.787577996,
            38.287617242
          ],
          [
            21.787577996,
            38.287617242
          ],
          [
            21.787577996,
            38.287617242
          ],
          [
            21.787577996,
            38.287617242
          ],
          [
            21.787577996,
            38.287617242
          ],
          [
            21.787577996,
            38.287617242
          ],
          [
            21.787577996,
            38.287617242
          ],
          [
            21.787577996,
            38.287617242
          ],
          [
            21.787577996,
            38.287617242
          ],
          [
            21.787577996,
            38.287617242
          ],
          [
            21.787577996,
            38.287617242
          ],
          [
            21.787577996,
            38.287617242
          ],
          [
            21.787577996,
            38.287617242
          ],
          [
            21.787577996,
            38.287617242
          ],
          [
            21.787577996,
            38.287617242
          ],
          [
            21.787577996,
            38.287617242
          ],
    [
            21.78763045627022,
            38.287619149791425
          ],
    [
            21.787689209447166,
            38.28761755958547
          ],
    [
    21.78772263797825,
    38.28761596937949
    ],
    [
    21.78776113143897,
    38.287619149791425
    ],
    [
    21.787814819686247,
    38.287613584070385
    ],
    [
    21.787894845564523,
    38.287611198761255
    ],
    [
    21.787960689641523,
    38.287611198761255
    ],
    [
    21.78805287134955,
    38.28760801834895
    ],
    [
    21.7881258063278,
    38.28760881345204
    ],
    [
    21.788245338652047,
    38.28760563303965
    ],
    [
    21.788294974981767,
    38.28760722323716
    ],
    [
    21.788352715172238,
    38.28760881344337
    ],
    [
    21.788409442465024,
    38.287607223208965
    ],
    [
    21.788453000854247,
    38.287607223208965
    ],
    [
    21.788473260570385,
    38.28760086238384
    ],
    [
    21.78847427355683,
    38.287575419077825
    ],
    [
    21.788472247577886,
    38.28752691775264
    ],
    [
    21.788472247577886,
    38.287455358359324
    ]
    ]
    start_time = 1745413233823
    # generate with ~1 point per 0.5m
    df_route = generate_route(raw_waypoints, start_time, meters_per_point=0.5)
    # Save CSV
    out_path = 'tracker/faker/test_sdena.csv'
    df_route.to_csv(out_path, index=False)
    print(f"Saved multi-leg route ({len(df_route)} points) to {out_path}")
