import pandas as pd
import folium

# ---- 1. Load -----------------------------------------------------------------
cols = ['lat', 'lon', 'alt', 'speed', 'yaw', 'pitch', 'roll', 'id', 'unix_ts']

dtype_map = {
    'lat'      : 'float64',
    'lon'      : 'float64',
    'alt'      : 'float64',
    'speed'    : 'float64',
    'yaw'      : 'float64',
    'pitch'    : 'float64',
    'roll'     : 'float64',
    'id'       : 'string',   # keep as text
    'unix_ts'  : 'int64'     # keep as integer
}

df = pd.read_csv('tracker/video_3892_fidal_day_1.csv', header=None, names=cols, dtype=dtype_map)

# ---- 2. Filter by altitude ---------------------------------------------------
df_ok = df[(df['alt'] >= 90) & (df['alt'] <= 100)].reset_index(drop=True)

if df_ok.empty:
    raise ValueError("No points with altitude between 90 m and 100 m found!")

# ---- 3. Create a Leaflet map -------------------------------------------------
center = [df_ok['lat'].mean(), df_ok['lon'].mean()]
m = folium.Map(
    location=center,
    zoom_start=18,
    max_zoom=23,          # allow zoom in up to level 23
    tiles="OpenStreetMap"
)

# Draw the filtered track
coords = df_ok[['lat', 'lon']].values.tolist()
folium.PolyLine(coords, weight=4, tooltip="Filtered track").add_to(m)

# Add markers for every point in the filtered track
for point in coords:
    folium.CircleMarker(
        location=point,
        radius=3,
        color='blue',
        fill=True,
        fill_opacity=0.6,
        tooltip=f"{point[0]:.6f}, {point[1]:.6f}"
    ).add_to(m)

# Highlight start and end
folium.Marker(coords[0], popup="Start", icon=folium.Icon(color='green')).add_to(m)
folium.Marker(coords[-1], popup="End", icon=folium.Icon(color='red')).add_to(m)

# ---- 4. Save -----------------------------------------------------------------
m.save('filtered_path.html')
print("✓ Map saved to filtered_path.html")