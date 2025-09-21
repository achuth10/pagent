"""
FastAPI backend example for Context Bridge

This example shows how to use the Context Bridge backend SDK
to create REST endpoints that can fetch context and screenshots
from connected frontend applications.
"""

import asyncio
import base64
import json
from typing import Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# Import Context Bridge backend SDK
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "../../../backend/src"))

from context_bridge import (
    RESTContextProvider,
    ContextProviderConfig,
    PageContext,
    ScreenshotOptions,
)

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
    This handles the WebSocket provider implementation
    """
    await websocket.accept()
    print(f"WebSocket client connected: {websocket.client}")

    try:
        while True:
            # Wait for messages from client
            data = await websocket.receive_text()
            message = json.loads(data)
            print(f"Received WebSocket message: {message}")

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
                # Handle context updates
                await websocket.send_text(
                    json.dumps(
                        {
                            "type": "context_received",
                            "status": "success",
                            "timestamp": int(asyncio.get_event_loop().time() * 1000),
                        }
                    )
                )
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
                    print(
                        f"🗄️  Stored screenshot with keys: {list(screenshot_storage.keys())}"
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
        print("WebSocket client disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")
        try:
            await websocket.close()
        except:
            pass


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
