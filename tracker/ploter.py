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

df = pd.read_csv('tracker/path2.csv', header=None, names=cols, dtype=dtype_map)

# ---- 2. Filter by altitude ---------------------------------------------------
df_ok = df[(df['alt'] >= 90) & (df['alt'] <= 100)].reset_index(drop=True)

if df_ok.empty:
    raise ValueError("No points with altitude between 90 m and 100 m found!")

# ---- 3. Create a Leaflet map -------------------------------------------------
center = [df_ok['lat'].mean(), df_ok['lon'].mean()]
m = folium.Map(location=center, zoom_start=18, tiles="OpenStreetMap")

coords = df_ok[['lat', 'lon']].values.tolist()
folium.PolyLine(coords, weight=4, tooltip="Filtered track").add_to(m)

folium.Marker(coords[0], popup="Start").add_to(m)
folium.Marker(coords[-1], popup="End").add_to(m)

# ---- 4. Save -----------------------------------------------------------------
m.save('filtered_path.html')
print("✓ Map saved to filtered_path.html")
