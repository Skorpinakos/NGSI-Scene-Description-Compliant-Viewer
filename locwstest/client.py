# test_client.py

import asyncio
import websockets

async def test_connection():
    uri = "ws://localhost:6789"
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected to WebSocket server!")

            # Keep listening for messages
            while True:
                message = await websocket.recv()
                print("Received:", message)

    except Exception as e:
        print("WebSocket connection failed:", e)

# Run the client
if __name__ == "__main__":
    asyncio.run(test_connection())
