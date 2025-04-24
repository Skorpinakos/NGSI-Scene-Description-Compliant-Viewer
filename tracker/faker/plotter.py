import pandas as pd
import folium
import math
from folium.features import DivIcon

# 1. Load the CSV
df = pd.read_csv('tracker/faker/multi_leg_route.csv')

# 2. Compute map centre & create Map
center = [df['lat'].mean(), df['lon'].mean()]
m = folium.Map(location=center, zoom_start=20, max_zoom=23, tiles='OpenStreetMap')

# 3. Draw the path polyline
folium.PolyLine(
    locations=list(zip(df['lat'], df['lon'])),
    color='blue', weight=3, opacity=0.8
).add_to(m)

# 4. Add an arrow‐icon at each point
for row in df.itertuples():
    lat, lon, idx, ts, yaw = row.lat, row.lon, row.id, row.timestamp, row.yaw
    yaw=-yaw+90

    # compute endpoint of a 0.5 m “shaft” so we know the scaling
    length_m = 0.5
    yaw_rad = math.radians(yaw)
    # approx degrees per metre
    delta_lat =  (length_m * math.cos(yaw_rad)) / 111111.0
    delta_lon =  (length_m * math.sin(yaw_rad)) / (111111.0 * math.cos(math.radians(lat)))
    end_lat  = lat + delta_lat
    end_lon  = lon + delta_lon

    # draw the little “shaft” line (optional, you can skip if you only want the arrowhead)
    folium.PolyLine(
        locations=[ (lat, lon), (end_lat, end_lon) ],
        color='blue', weight=2, opacity=1
    ).add_to(m)

    # now place a rotated SVG arrowhead at the endpoint
    arrow_svg = f"""
    <svg width="12" height="12" viewBox="0 0 10 10"
         style="transform: rotate({yaw}deg);">
      <polygon points="0,0 10,5 0,10" fill="blue" />
    </svg>
    """
    folium.map.Marker(
        location=(end_lat, end_lon),
        icon=DivIcon(
            icon_size=(12, 12),
            icon_anchor=(6, 6),
            html=arrow_svg
        )
    ).add_to(m)

    # (optional) keep your info‐marker too
    folium.Marker(
        location=(lat, lon),
        popup=f"id: {str(idx)}\ntime: {int(ts)}",
        icon=folium.Icon(color='red', icon='info-sign')
    ).add_to(m)

# 5. Save to HTML
m.save('tracker/faker/route_map.html')
print("Map saved to tracker/faker/route_map.html – open this file in your browser to view.")
