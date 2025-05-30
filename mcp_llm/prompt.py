# client.py
import asyncio, os, sys
from contextlib import AsyncExitStack

from anthropic import Anthropic                      # Claude SDK
from mcp import ClientSession, StdioServerParameters # MCP SDK
from mcp.client.stdio import stdio_client
from dotenv import load_dotenv

load_dotenv()                                        # reads .env → API key

MODEL = "claude-sonnet-4-20250514"

async def main(server_path: str):
    async with AsyncExitStack() as stack:
        # --- bring the MCP server online ---------------------------
        params = StdioServerParameters(command="python", args=[server_path])
        stdio_r, stdio_w = await stack.enter_async_context(stdio_client(params))
        session = await stack.enter_async_context(ClientSession(stdio_r, stdio_w))
        await session.initialize()

        # Discover tools and turn them into Claude tool schemas
        tools = [
            {
                "name": t.name,
                "description": t.description,
                "input_schema": t.inputSchema,
            }
            for t in (await session.list_tools()).tools
        ]
        print("Tools available:", [t["name"] for t in tools])

        client = Anthropic()                         # picks up ANTHROPIC_API_KEY
        conversation = []
        while True:
            user = input("\nYou › ").strip()
            if user in {"q", "quit", "exit"}:
                break

            msgs = [{"role": "user", "content": user}]
            conversation.append({"role": "user", "content": user})
            rsp = client.messages.create(
                model=MODEL,
                max_tokens=500,
                messages=conversation,
                tools=tools,
            )

            # loop until Claude is done (might ask for multiple tool calls)
            while rsp.stop_reason == "tool_use":
                call = next(c for c in rsp.content if c.type == "tool_use")
                result = await session.call_tool(call.name, call.input)

                conversation.append({"role": "assistant", "content": rsp.content})
                conversation.append({
                    "role": "user",
                    "content": [{
                        "type": "tool_result",
                        "tool_use_id": call.id,
                        "content": result.content,
                    }]
                })
                rsp = client.messages.create(
                    model=MODEL,
                    max_tokens=500,
                    messages=conversation,
                    tools=tools,
                )
            conversation.append({"role": "assistant", "content": rsp.content})
            print("\nClaude ›", rsp.content[0].text)

if __name__ == "__main__":
    # if len(sys.argv) != 2:
    #     sys.exit("Usage: python client.py path/to/echo_server.py")
    asyncio.run(main("C:/Users/gdste/OneDrive - University of Patras/Uni/Diploma Thesis/sterg_3d_twin/mcp_llm/mcp-server-demo/main.py"))
