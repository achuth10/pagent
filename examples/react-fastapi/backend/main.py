"""
FastAPI backend example for Context Bridge

This example shows how to use the Context Bridge backend SDK
to create REST endpoints that can fetch context and screenshots
from connected frontend applications.
"""

import asyncio
import json
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Import Context Bridge backend SDK
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "../../../backend/src"))

from context_bridge.context_analyzer import ContextAnalyzer
from context_bridge.types import PageContext, DOMData, ViewportData, FormData, InputData

app = FastAPI(
    title="Context Bridge Example API",
    description="Example FastAPI backend using Context Bridge SDK",
    version="1.0.0",
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
    ],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for demonstration
context_storage: Dict[str, PageContext] = {}
screenshot_storage: Dict[str, str] = {}
context_history: Dict[str, List[PageContext]] = {}  # Store context history per session

# Initialize context analyzer
# ⚠️ DEMO: This uses a rule-based analyzer. Replace with LLM integration for production.
context_analyzer = ContextAnalyzer()


def convert_dict_to_page_context(data: Dict[str, Any]) -> PageContext:
    """Convert dictionary data to PageContext object"""
    # Convert DOM data
    dom_data = None
    if data.get("dom"):
        dom_dict = data["dom"]
        forms = []
        if dom_dict.get("forms"):
            for form_dict in dom_dict["forms"]:
                fields = []
                if form_dict.get("fields"):
                    for field_dict in form_dict["fields"]:
                        fields.append(
                            InputData(
                                id=field_dict.get("id"),
                                name=field_dict.get("name"),
                                type=field_dict.get("type", "text"),
                                value=field_dict.get("value"),
                                placeholder=field_dict.get("placeholder"),
                                required=field_dict.get("required", False),
                            )
                        )
                forms.append(
                    FormData(
                        id=form_dict.get("id"),
                        name=form_dict.get("name"),
                        action=form_dict.get("action"),
                        method=form_dict.get("method"),
                        fields=fields,
                    )
                )

        inputs = []
        if dom_dict.get("inputs"):
            for input_dict in dom_dict["inputs"]:
                inputs.append(
                    InputData(
                        id=input_dict.get("id"),
                        name=input_dict.get("name"),
                        type=input_dict.get("type", "text"),
                        value=input_dict.get("value"),
                        placeholder=input_dict.get("placeholder"),
                        required=input_dict.get("required", False),
                    )
                )

        dom_data = DOMData(
            text=dom_dict.get("text", ""),
            html=dom_dict.get("html"),
            forms=forms,
            inputs=inputs,
        )

    # Convert viewport data
    viewport_data = None
    if data.get("viewport"):
        viewport_dict = data["viewport"]
        viewport_data = ViewportData(
            width=viewport_dict.get("width", 0),
            height=viewport_dict.get("height", 0),
            scroll_x=viewport_dict.get("scrollX", 0),
            scroll_y=viewport_dict.get("scrollY", 0),
        )

    return PageContext(
        url=data.get("url", ""),
        title=data.get("title", ""),
        timestamp=data.get("timestamp", int(asyncio.get_event_loop().time() * 1000)),
        dom=dom_data,
        viewport=viewport_data,
        metadata=data.get("metadata", {}),
    )


async def analyze_and_send_instructions(
    websocket: WebSocket, context: PageContext, session_id: str
):
    """Analyze context and send instructions to frontend"""
    try:
        # Analyze the context
        analysis = context_analyzer.analyze_context(context)
        print(
            f"📊 Context analysis: {analysis.pageType} (confidence: {analysis.confidence:.2f})"
        )

        # Generate instructions based on analysis
        instructions = context_analyzer.generate_instructions(context, analysis)

        if instructions:
            print(f"🎯 Generated {len(instructions)} instructions")

            # Send instructions to frontend
            for instruction in instructions:
                await websocket.send_text(
                    json.dumps(
                        {
                            "type": "instruction",
                            "data": instruction,
                            "timestamp": int(asyncio.get_event_loop().time() * 1000),
                        }
                    )
                )

                # Small delay between instructions
                await asyncio.sleep(0.1)

        # Store context in history for behavior analysis
        if session_id not in context_history:
            context_history[session_id] = []
        context_history[session_id].append(context)

        # Keep only last 10 contexts per session
        if len(context_history[session_id]) > 10:
            context_history[session_id] = context_history[session_id][-10:]

    except Exception as e:
        print(f"❌ Error analyzing context: {e}")


# Pydantic models for API
class ContextRequest(BaseModel):
    url: Optional[str] = None


class ScreenshotRequest(BaseModel):
    url: str
    options: Optional[Dict[str, Any]] = None


class ContextResponse(BaseModel):
    url: str
    title: str
    timestamp: int
    dom: Optional[Dict[str, Any]] = None
    viewport: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None


class ScreenshotResponse(BaseModel):
    screenshot: str
    url: str
    timestamp: int


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Context Bridge Example API",
        "version": "1.0.0",
        "endpoints": {
            "current-context": "GET /current-context - Get current page context",
            "screenshot": "POST /screenshot - Capture page screenshot",
            "agent-context": "GET /agent/context - Agent endpoint for context",
            "agent-screenshot": "GET /agent/screenshot - Agent endpoint for screenshot",
        },
    }


@app.get("/current-context")
async def get_current_context(url: Optional[str] = None):
    """
    Endpoint for frontend to get stored context or return latest context
    """
    context_key = url or "default"

    # Return stored context if available, otherwise return empty context
    if context_key in context_storage:
        return context_storage[context_key]
    else:
        # Return minimal context indicating no data received yet
        return {
            "url": url or "http://localhost:3000",
            "title": "No context received yet",
            "timestamp": int(asyncio.get_event_loop().time() * 1000),
            "dom": {
                "text": "Waiting for frontend to send context...",
                "html": "",
                "forms": [],
                "inputs": [],
            },
            "viewport": {"width": 0, "height": 0, "scrollX": 0, "scrollY": 0},
            "metadata": {"status": "waiting_for_context"},
        }


@app.post("/current-context")
async def receive_context(request: Request):
    """
    Endpoint for frontend to send current context
    """
    try:
        context_data = await request.json()
        print(
            f"📥 Received context from frontend: {context_data.get('title', 'No title')} at {context_data.get('url', 'No URL')}"
        )

        # Store the received context
        url = context_data.get("url", "default")
        context_storage[url] = context_data
        context_storage["default"] = context_data  # Also store as default
        print(f"🗄️  Stored context with keys: {list(context_storage.keys())}")

        return {"status": "success", "message": "Context received"}
    except Exception as e:
        print(f"❌ Error receiving context: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid context data: {e}")


@app.post("/screenshot")
async def receive_screenshot(request: Request):
    """
    Endpoint for receiving screenshots from frontend
    """
    try:
        data = await request.json()
        screenshot_data = data.get("screenshot")
        url = data.get("url", "unknown")

        if not screenshot_data:
            raise HTTPException(status_code=400, detail="Screenshot data is required")

        # Store screenshot with both URL and default key
        screenshot_storage[url] = screenshot_data
        screenshot_storage["default"] = screenshot_data

        print(
            f"📸 Received screenshot from frontend: {url} ({len(screenshot_data)} chars)"
        )
        print(f"🗄️  Stored screenshot with keys: {list(screenshot_storage.keys())}")

        return {
            "status": "success",
            "message": "Screenshot received and stored",
            "url": url,
            "size": len(screenshot_data),
            "timestamp": int(asyncio.get_event_loop().time() * 1000),
        }

    except Exception as e:
        print(f"❌ Error receiving screenshot: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid screenshot data: {e}")


# Agent-facing endpoints
@app.get("/agent/context")
async def agent_get_context(url: Optional[str] = None):
    """
    Agent endpoint to get page context
    This demonstrates how agents/backend code can fetch context
    """
    try:
        # Return the latest context received from the frontend
        context_key = url or "default"

        if context_key in context_storage:
            return context_storage[context_key]
        else:
            # No context received yet from frontend
            raise HTTPException(
                status_code=404,
                detail=f"No context available for URL: {context_key}. Make sure the frontend is sending context data.",
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get context: {e}")


@app.get("/agent/screenshot")
async def agent_get_screenshot(url: Optional[str] = None):
    """
    Agent endpoint to get page screenshot
    """
    try:
        # Try to get screenshot from storage
        screenshot_key = url or "default"

        if screenshot_key in screenshot_storage:
            screenshot_data = screenshot_storage[screenshot_key]
            return {
                "screenshot": screenshot_data,
                "url": screenshot_key,
                "size": len(screenshot_data),
                "timestamp": int(asyncio.get_event_loop().time() * 1000),
            }
        elif "default" in screenshot_storage:
            # Fallback to default screenshot
            screenshot_data = screenshot_storage["default"]
            return {
                "screenshot": screenshot_data,
                "url": "default",
                "size": len(screenshot_data),
                "timestamp": int(asyncio.get_event_loop().time() * 1000),
            }
        else:
            raise HTTPException(status_code=404, detail="No screenshot found")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get screenshot: {e}")


@app.get("/agent/context-with-screenshot")
async def agent_get_context_with_screenshot(url: Optional[str] = None):
    """
    Agent endpoint to get both context and screenshot
    """
    try:
        context = await agent_get_context(url)
        screenshot_response = await agent_get_screenshot(url or context.get("url"))

        return {"context": context, "screenshot": screenshot_response["screenshot"]}

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get context with screenshot: {e}"
        )


# WebSocket endpoint for real-time updates
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time context updates
    This handles the WebSocket provider implementation with intelligent instruction generation
    """
    await websocket.accept()
    client_id = f"client_{id(websocket)}"
    print(f"WebSocket client connected: {websocket.client} (ID: {client_id})")

    try:
        while True:
            # Wait for messages from client
            data = await websocket.receive_text()
            message = json.loads(data)
            print(f"Received WebSocket message: {message.get('type', 'unknown')}")

            # Handle different message types
            if message.get("type") == "auth":
                # Handle authentication
                await websocket.send_text(
                    json.dumps(
                        {
                            "type": "auth_response",
                            "status": "success",
                            "timestamp": int(asyncio.get_event_loop().time() * 1000),
                        }
                    )
                )
            elif message.get("type") == "context":
                # Handle context updates with intelligent analysis
                context_data = message.get("data", {})

                # Convert to PageContext object
                try:
                    context = convert_dict_to_page_context(context_data)

                    # Store context
                    context_storage[context.url] = context
                    context_storage["default"] = context

                    print(f"📥 Received context: {context.title} at {context.url}")

                    # Analyze context and send instructions
                    await analyze_and_send_instructions(websocket, context, client_id)

                    # Send acknowledgment
                    await websocket.send_text(
                        json.dumps(
                            {
                                "type": "context_received",
                                "status": "success",
                                "timestamp": int(
                                    asyncio.get_event_loop().time() * 1000
                                ),
                            }
                        )
                    )
                except Exception as e:
                    print(f"❌ Error processing context: {e}")
                    await websocket.send_text(
                        json.dumps(
                            {
                                "type": "context_error",
                                "status": "error",
                                "message": str(e),
                                "timestamp": int(
                                    asyncio.get_event_loop().time() * 1000
                                ),
                            }
                        )
                    )

            elif message.get("type") == "context_change":
                # Handle context change events with analysis
                context_data = message.get("data", {})

                try:
                    context = convert_dict_to_page_context(context_data)
                    print(f"🔄 Context changed: {context.title}")

                    # Analyze and send instructions for context changes
                    await analyze_and_send_instructions(websocket, context, client_id)

                except Exception as e:
                    print(f"❌ Error processing context change: {e}")

            elif message.get("type") == "screenshot":
                # Handle screenshot data from frontend
                screenshot_data = message.get("data", {}).get("screenshot")
                url = message.get("data", {}).get("url", "unknown")

                if screenshot_data:
                    # Store screenshot with both URL and default key
                    screenshot_storage[url] = screenshot_data
                    screenshot_storage["default"] = screenshot_data

                    print(
                        f"📸 Received screenshot via WebSocket: {url} ({len(screenshot_data)} chars)"
                    )

                    # Send acknowledgment
                    await websocket.send_text(
                        json.dumps(
                            {
                                "type": "screenshot_ack",
                                "status": "success",
                                "url": url,
                                "size": len(screenshot_data),
                                "timestamp": int(
                                    asyncio.get_event_loop().time() * 1000
                                ),
                            }
                        )
                    )
            elif message.get("type") == "instruction_result":
                # Handle instruction execution results from frontend
                result_data = message.get("data", {})
                instruction_id = result_data.get("instructionId")
                success = result_data.get("success", False)

                if success:
                    print(f"✅ Instruction {instruction_id} executed successfully")
                else:
                    error = result_data.get("error", "Unknown error")
                    print(f"❌ Instruction {instruction_id} failed: {error}")

            elif message.get("type") == "pong":
                # Handle pong response
                print("🏓 Received pong")

            else:
                # Echo back for other message types
                await websocket.send_text(
                    json.dumps(
                        {
                            "type": "echo",
                            "data": message,
                            "timestamp": int(asyncio.get_event_loop().time() * 1000),
                        }
                    )
                )

    except WebSocketDisconnect:
        print(f"WebSocket client disconnected: {client_id}")
        # Clean up client-specific data
        if client_id in context_history:
            del context_history[client_id]
    except Exception as e:
        print(f"WebSocket error: {e}")
        try:
            await websocket.close()
        except:
            pass


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
