# prompt.py  — initial scripted prompt + interactive follow-up
import asyncio, os, sys
from contextlib import AsyncExitStack
from pathlib import Path

from anthropic import Anthropic          # Claude SDK
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from dotenv import load_dotenv

load_dotenv()                            # pulls keys & broker vars from .env

MODEL = "claude-sonnet-4-20250514"

# Hard-coded FIWARE settings (still handy inside the prompt for context)
FIWARE_CONTEXT_BROKER_URL = "http://150.140.186.118:1026/v2/entities"
FIWARE_SERVICE_PATH       = "/mcp/test1"

USER_PROMPT = f"""
You are requested to convert a set of NGSI-v2 entities stored in a FIWARE
Context Broker into Digital Twin assets, following the descriptors defined in the MCP tools.
I need you to fetch all entities from the Context Broker at
{FIWARE_CONTEXT_BROKER_URL} with Service path {FIWARE_SERVICE_PATH} and for each one, you need to create two
descriptors: an Asset descriptor and an Asset-data descriptor.


Objective
---------
For **every** entity currently stored in that broker:

1. Retrieve the entity’s complete JSON document.

2. Create two NGSI-v2/NGSI-LD–compatible resources:
   a. **Asset descriptor** — a Digital-Twin shell that represents the asset
      itself.
   b. **Asset-data descriptor** — a sub-model that represents the data that the initial entity is retrieving.

3. Persist both descriptors back to the same broker:
   • POST the Asset descriptor first.  
   • Then POST the Asset-data descriptor.  
   • If a POST returns 422 (already exists), try with another id instead.

4. After processing all entities, return a concise summary table containing:
   ─ original entity id  
   ─ new asset descriptor id and url
   ─ new asset-data descriptor id and url
   - url of the 3d representation of the asset
   ─ HTTP status for each write (POST/PATCH)

Implementation rules
--------------------
* Use the HTTP/NGSI helper tools available in the current toolset; DO NOT hard-code
  URLs or service paths.
* Every request must include the headers  
    'Fiware-ServicePath': {FIWARE_SERVICE_PATH} 
* Follow FIWARE NGSI-v2 and the format defined by the MCP tools strictly.
"""

EXIT_WORDS = {"exit", "quit", ""}        # empty line = quit

# --------------------------------------------------------------------------- #
async def call_claude(client, tools, conversation):
    """Send current conversation to Claude, handle any tool calls, return rsp."""
    rsp = client.messages.create(
        model=MODEL,
        max_tokens=800,                  # you can raise/lower this as you like
        messages=conversation,
        tools=tools,
    )

    while rsp.stop_reason == "tool_use":
        call = next(c for c in rsp.content if c.type == "tool_use")
        result = await session.call_tool(call.name, call.input)

        conversation.extend([
            {"role": "assistant", "content": rsp.content},
            {
                "role": "user",
                "content": [{
                    "type": "tool_result",
                    "tool_use_id": call.id,
                    "content": result.content,
                }]
            },
        ])

        rsp = client.messages.create(
            model=MODEL,
            max_tokens=800,
            messages=conversation,
            tools=tools,
        )

    conversation.append({"role": "assistant", "content": rsp.content})
    print("\nClaude ›", rsp.content[0].text, flush=True)
    return rsp


async def main(server_path: str):
    global session                                   # needed inside call_claude
    async with AsyncExitStack() as stack:
        # --- start MCP server -------------------------------------------------
        server_path= str(server_path)
        params = StdioServerParameters(command="python", args=[server_path])
        stdio_r, stdio_w = await stack.enter_async_context(stdio_client(params))
        session = await stack.enter_async_context(ClientSession(stdio_r, stdio_w))
        await session.initialize()

        # Map MCP tools to Anthropic tool schemas
        tools = [{
            "name": t.name,
            "description": t.description,
            "input_schema": t.inputSchema,
        } for t in (await session.list_tools()).tools]
        print("Tools available:", [t["name"] for t in tools])

        client = Anthropic()                         # picks up ANTHROPIC_API_KEY
        conversation = []

        # --- Send the scripted request once -----------------------------------
        conversation.append({"role": "user", "content": USER_PROMPT})
        await call_claude(client, tools, conversation)

        # --- Interactive loop -------------------------------------------------
        print("\n(interactive mode – type 'exit' to quit)")
        while True:
            try:
                user_msg = input("You › ").strip()
            except EOFError:                         # Ctrl-D
                user_msg = ""

            if user_msg.lower() in EXIT_WORDS:
                print("Bye!\n")
                break

            if not user_msg:
                continue

            conversation.append({"role": "user", "content": user_msg})
            await call_claude(client, tools, conversation)


if __name__ == "__main__":
    asyncio.run(
        main(
            # tweak this path to your MCP server main.py if needed
            Path("C:/Users/gdste/OneDrive - University of Patras/Uni/"
                 "Diploma Thesis/sterg_3d_twin/mcp_llm/mcp-server-demo/main.py")
        )
    )
