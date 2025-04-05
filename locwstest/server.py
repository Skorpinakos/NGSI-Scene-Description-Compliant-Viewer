import asyncio
import websockets
import json

# Load the car path from JSON file
with open("veh1.json", "r") as f:
    car_path = json.load(f)

# WebSocket handler — MUST accept websocket and path
async def stream_location(websocket):
    print("Client connected")
    try:
        for point in car_path:
            await websocket.send(json.dumps({
                "car_id": "car_1",
                "step": point["step"],
                "lat": point["lat"],
                "lon": point["lon"]
            }))
            await asyncio.sleep(1)  # Simulate live tracking
    except websockets.ConnectionClosed:
        print("Client disconnected")
    except Exception as e:
        print("Error:", e)

# Entry point — NEVER call stream_location() directly!
async def main():
    async with websockets.serve(stream_location, "localhost", 6789):
        print("WebSocket server running at ws://localhost:6789")
        await asyncio.Future()  # Keeps it running

if __name__ == "__main__":
    asyncio.run(main())
