# React + FastAPI Example

This example demonstrates how to use the Context Bridge library with a React frontend and FastAPI backend.

## Features Demonstrated

- ✅ REST and WebSocket context providers
- ✅ Real-time context extraction
- ✅ **Real screenshot capture** using html2canvas (with whitelisting)
- ✅ Form data extraction
- ✅ Agent-facing API endpoints
- ✅ Connection status monitoring
- ✅ Automatic screenshot sending to backend

## Architecture

```
┌─────────────────┐    HTTP/WS     ┌─────────────────┐
│   React App     │◄──────────────►│   FastAPI       │
│   (Port 3000)   │                │   (Port 8000)   │
│                 │                │                 │
│ ContextProvider │                │ Agent Endpoints │
│ - REST          │                │ - /agent/*      │
│ - WebSocket     │                │ - /current-*    │
└─────────────────┘                └─────────────────┘
```

## Quick Start

### 1. Start the Backend

```bash
cd backend
pip install -r requirements.txt
python main.py
```

The FastAPI server will start on `http://localhost:8000`

### 2. Start the Frontend

```bash
cd frontend
npm install  # This includes html2canvas for real screenshots
npm run dev
```

The React app will start on `http://localhost:3000`

### 3. Open the Example

Navigate to `http://localhost:3000` in your browser to see the Context Bridge in action.

## API Endpoints

### Frontend Endpoints

These endpoints are used by the frontend Context Bridge SDK:

- `GET /current-context` - Get current page context
- `POST /current-context` - Receive context from frontend
- `POST /screenshot` - Receive real screenshots from frontend
- `WS /ws` - WebSocket connection for real-time updates

### Agent Endpoints

These endpoints are designed for AI agents and backend systems:

- `GET /agent/context?url=<url>` - Get page context for agents
- `GET /agent/screenshot?url=<url>` - Get page screenshot for agents
- `GET /agent/context-with-screenshot?url=<url>` - Get both context and screenshot

### Example Agent Usage

```python
import aiohttp

async def get_page_info():
    async with aiohttp.ClientSession() as session:
        # Get page context
        async with session.get('http://localhost:8000/agent/context') as resp:
            context = await resp.json()
            print(f"Page title: {context['title']}")

        # Get real screenshot (captured by html2canvas)
        async with session.get('http://localhost:8000/agent/screenshot?url=http://localhost:3000') as resp:
            data = await resp.json()
            screenshot = data['screenshot']  # Base64 PNG data
            print(f"Screenshot size: {len(screenshot)} chars (~{len(screenshot)//1024}KB)")
```

## Features in the Example

### Context Extraction

The example extracts comprehensive page context including:

- Page URL, title, and timestamp
- Visible text content
- Form structures and input fields
- Viewport dimensions and scroll position
- Page metadata (headings, links, images)

### Screenshot Capture

Screenshots are captured with security features:

- Only allowed on whitelisted pages (`localhost`, `127.0.0.1`)
- Configurable format and quality
- Optional full-page capture

### Real-time Updates

The WebSocket provider enables:

- Live context monitoring
- Automatic change detection
- Real-time updates to connected agents

### Security Features

- Sensitive data filtering (passwords, hidden fields)
- Page whitelisting for screenshots
- Optional authentication headers
- Sanitized HTML extraction

## Example Usage Scenarios

### 1. Form Filling Agent

An agent can analyze the current page context to understand available forms and fill them automatically:

```python
# Get current page context
context = await get_page_context("http://localhost:8000")

# Analyze forms
for form in context.dom.forms:
    print(f"Found form: {form.action}")
    for field in form.fields:
        if field.type == "email":
            # Agent can fill email field
            pass
```

### 2. Page Analysis Agent

An agent can get real screenshots and analyze page content:

```python
# Get both context and screenshot
response = await get_context_with_screenshot("http://localhost:8000")

# Analyze content
print(f"Page has {len(response.context.dom.forms)} forms")
print(f"Real screenshot size: {len(response.screenshot)} bytes")

# Save screenshot as PNG file
import base64
with open("page_screenshot.png", "wb") as f:
    f.write(base64.b64decode(response.screenshot))
```

### 3. Monitoring Agent

An agent can monitor page changes in real-time:

```python
# Set up WebSocket connection for real-time updates
# Agent receives notifications when page content changes
```

## Customization

### Adding Custom Context

You can extend the context extraction by modifying the `ContextExtractor` class:

```typescript
// Add custom metadata extraction
const customMetadata = {
  customField: document.querySelector(".custom-element")?.textContent,
  dataAttributes: Array.from(document.querySelectorAll("[data-*]")),
};
```

### Custom Screenshot Options

Configure real screenshot capture options (html2canvas):

```typescript
const provider = new RESTContextProvider({
  screenshotOptions: {
    format: "png", // or "jpeg"
    quality: 0.8, // 0.1 to 1.0
    scale: 0.5, // Reduce for smaller file size
    fullPage: true,
    clip: { x: 0, y: 0, width: 800, height: 600 },
  },
});
```

### Authentication

Add authentication to secure the connection:

```typescript
const provider = new RESTContextProvider({
  baseUrl: "http://localhost:8000",
  authHeaders: {
    Authorization: "Bearer your-jwt-token",
    "X-API-Key": "your-api-key",
  },
});
```

## Development

### Backend Development

```bash
cd backend
pip install -r requirements.txt

# Run with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development

```bash
cd frontend
npm install

# Run with hot reload
npm run dev
```

### Testing

```bash
# Test backend endpoints
curl http://localhost:8000/agent/context

# Test WebSocket connection
wscat -c ws://localhost:8000/ws
```

## Troubleshooting

### CORS Issues

If you encounter CORS issues, make sure the FastAPI backend includes the frontend URL in the allowed origins:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### WebSocket Connection Issues

For WebSocket connections, ensure:

1. The backend WebSocket endpoint is running (`/ws`)
2. The frontend is connecting to the correct WebSocket URL
3. Firewall/proxy settings allow WebSocket connections

### Screenshot Issues

If real screenshots aren't working:

1. Check that the page is whitelisted
2. Ensure html2canvas is installed (`npm install html2canvas`)
3. Check browser console for html2canvas errors
4. Verify `enableScreenshots` is set to `true`
5. Ensure the page doesn't have security restrictions

## Next Steps

- Integrate with your AI agent framework (LangChain, MCP, etc.)
- Add authentication and authorization
- Implement custom context extraction logic
- Deploy to production with proper security measures
- Add monitoring and logging
