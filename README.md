# Context Bridge

A unified library for web apps that enables agentic systems to fetch live page context and optionally screenshots in a secure, opt-in, framework-agnostic way. The library is transport-agnostic, supporting both REST and WebSocket connections, allowing backend/agent code to use a single interface.

## Features

- 🔒 **Secure & Opt-in**: Screenshots only on whitelisted pages with explicit configuration
- 🌐 **Transport Agnostic**: Supports both REST and WebSocket protocols
- 🎯 **Framework Agnostic**: Works with any frontend framework (React, Vue, Angular, vanilla JS)
- 🤖 **Agent Ready**: Compatible with MCP, LangChain, LangGraph, and direct function calls
- 📱 **Lightweight**: Minimal dependencies, production-ready
- 🔄 **Real-time**: WebSocket support for live context updates
- 📸 **Real Screenshots**: Uses html2canvas for actual page screenshots (not placeholders)

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Agent/AI      │
│   (Browser)     │◄──►│   (Server)      │◄──►│   System        │
│                 │    │                 │    │                 │
│ ContextProvider │    │ ContextProvider │    │ MCP/LangChain   │
│ - REST          │    │ - REST          │    │ - get_context() │
│ - WebSocket     │    │ - WebSocket     │    │ - get_screenshot│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Quick Start

### Frontend (JavaScript/TypeScript)

```bash
# Install the frontend SDK (when published)
npm install @context-bridge/frontend

# For real screenshot functionality, also install:
npm install html2canvas
```

**Note**: Currently this is a development library. For now, copy the `frontend/src` files into your project.

```typescript
import { RESTContextProvider } from "@context-bridge/frontend";

// Initialize provider
const provider = new RESTContextProvider({
  baseUrl: "http://localhost:8000",
  enableScreenshots: true,
  whitelistedPages: [
    "/", // Home page
    "/dashboard", // Exact path match
    "/admin/*", // Wildcard for all admin pages
    "/user/\\d+", // Regex pattern for user profiles
    "#settings", // Hash/fragment match
  ],
});

// Get current page context
const context = await provider.getCurrentContext();
console.log("Page context:", context);

// Get screenshot (if allowed)
const screenshot = await provider.getScreenshot();
console.log("Screenshot:", screenshot);
```

### Backend (Python)

```bash
# Install the backend SDK (when published)
pip install context-bridge-backend

# For FastAPI example:
pip install fastapi uvicorn websockets aiohttp
```

**Note**: Currently this is a development library. For now, copy the `backend/src` files into your project.

```python
from context_bridge import RESTContextProvider, ContextProviderConfig

# Configure provider
config = ContextProviderConfig(
    base_url="http://localhost:3000",
    enable_screenshots=True,
    whitelisted_pages=["localhost", "myapp.com"]
)

# Initialize provider
provider = RESTContextProvider(config)

# Get context from frontend
context = await provider.get_current_context()
print(f"Page title: {context.title}")

# Get screenshot
screenshot = await provider.get_screenshot()
print(f"Screenshot: {screenshot[:50]}...")
```

## Directory Structure

```
context-bridge/
├── frontend/           # Frontend SDK (JS/TS)
│   ├── src/
│   │   ├── providers/  # REST & WebSocket providers
│   │   ├── utils/      # Context extraction utilities
│   │   └── interfaces/ # TypeScript interfaces
│   └── package.json
├── backend/            # Backend SDK (Python)
│   ├── src/context_bridge/
│   │   ├── providers/  # REST & WebSocket providers
│   │   ├── interfaces/ # Abstract interfaces
│   │   └── types.py    # Type definitions
│   └── setup.py
├── core/               # Shared type definitions
│   └── types.ts
└── examples/           # Example implementations
    └── react-fastapi/  # React + FastAPI example
```

## Frontend SDK

### REST Provider

```typescript
import { RESTContextProvider } from "@context-bridge/frontend";

const provider = new RESTContextProvider({
  baseUrl: "http://localhost:8000",
  authHeaders: { Authorization: "Bearer token" },
  enableScreenshots: true,
  whitelistedPages: ["localhost", "*.myapp.com"],
  screenshotOptions: {
    format: "png",
    quality: 0.8,
    fullPage: false,
  },
});

// Get context
const context = await provider.getCurrentContext();

// Get screenshot
const screenshot = await provider.getScreenshot();

// Get both
const response = await provider.getContextWithScreenshot();
```

### WebSocket Provider

```typescript
import { WSContextProvider } from "@context-bridge/frontend";

const provider = new WSContextProvider({
  baseUrl: "ws://localhost:8000",
  enableScreenshots: true,
  whitelistedPages: ["localhost"],
});

// Subscribe to real-time context changes
const unsubscribe = provider.onContextChange((context) => {
  console.log("Context changed:", context);
});

// Start monitoring
provider.startMonitoring();

// Stop monitoring
provider.stopMonitoring();
unsubscribe();
```

## Backend SDK

### REST Provider

```python
from context_bridge import RESTContextProvider, ContextProviderConfig

config = ContextProviderConfig(
    base_url="http://localhost:3000",
    auth_headers={"Authorization": "Bearer token"},
    enable_screenshots=True,
    whitelisted_pages=["localhost", "*.myapp.com"],
    timeout=30
)

provider = RESTContextProvider(config)

# Get current context
context = await provider.get_current_context()

# Get screenshot
screenshot = await provider.get_screenshot(
    options=ScreenshotOptions(format="png", quality=0.8)
)

# Get both
response = await provider.get_context_with_screenshot()
```

### MCP Integration

```python
# Direct function calls for MCP tools
from context_bridge.providers.rest_provider import get_page_context, get_page_screenshot

# MCP tool function
async def get_current_page_context(url: str = None) -> dict:
    context = await get_page_context(
        base_url="http://localhost:3000",
        url=url,
        auth_headers={"Authorization": "Bearer token"}
    )
    return context.dict()

# MCP tool function
async def capture_page_screenshot(url: str, options: dict = None) -> str:
    screenshot = await get_page_screenshot(
        base_url="http://localhost:3000",
        url=url,
        options=ScreenshotOptions(**options) if options else None,
        whitelisted_pages=["localhost", "myapp.com"]
    )
    return screenshot
```

## Page Context Structure

The library extracts comprehensive page context:

```typescript
interface PageContext {
  url: string;
  title: string;
  timestamp: number;
  dom: {
    text: string; // Visible text content
    html?: string; // Sanitized HTML
    forms: FormData[]; // Form structures
    inputs: InputData[]; // Input fields
  };
  viewport: {
    width: number;
    height: number;
    scrollX: number;
    scrollY: number;
  };
  metadata: {
    description?: string;
    headings: Array<{ level: number; text: string }>;
    links: Array<{ href: string; text: string }>;
    images: Array<{ src: string; alt: string }>;
    [key: string]: any;
  };
}
```

## Security Features

### Screenshot Whitelisting

Screenshots are only captured on explicitly whitelisted pages:

```typescript
// Frontend
const provider = new RESTContextProvider({
  enableScreenshots: true,
  whitelistedPages: [
    "localhost",
    "myapp.com",
    "*.staging.myapp.com",
    /^https:\/\/app\.mycompany\.com/,
  ],
});

// Check if screenshots are allowed
if (provider.isScreenshotAllowed()) {
  const screenshot = await provider.getScreenshot();
}
```

### Sensitive Data Filtering

The library automatically filters sensitive information:

- Password fields are excluded
- Hidden inputs are skipped
- Fields with sensitive names (password, ssn, credit, etc.) are filtered
- Script and style tags are removed from HTML

### Authentication

Optional authentication headers for secure communication:

```typescript
const provider = new RESTContextProvider({
  baseUrl: "https://api.myapp.com",
  authHeaders: {
    Authorization: "Bearer your-jwt-token",
    "X-API-Key": "your-api-key",
  },
});
```

## Running the Example

<img width="1180" height="830" alt="Screenshot 2025-09-21 at 19 20 35" src="https://github.com/user-attachments/assets/e85adbe8-4648-4dd3-b8d8-7aaff5b91184" />

### Backend (FastAPI)

```bash
cd examples/react-fastapi/backend
pip install -r requirements.txt
python main.py
```

The API will be available at `http://localhost:8000`

### Frontend (React)

```bash
cd examples/react-fastapi/frontend
npm install
npm run dev
```

The app will be available at `http://localhost:3000`

### Example Endpoints

- `GET /current-context` - Get current page context
- `POST /screenshot` - Capture page screenshot
- `GET /agent/context` - Agent endpoint for context
- `GET /agent/screenshot` - Agent endpoint for screenshot
- `WS /ws` - WebSocket endpoint for real-time updates

## API Reference

### Frontend Providers

#### ContextProvider Interface

```typescript
interface ContextProvider {
  getCurrentContext(): Promise<PageContext>;
  getScreenshot?(options?: ScreenshotOptions): Promise<string>;
  getContextWithScreenshot?(
    options?: ScreenshotOptions
  ): Promise<ContextResponse>;
  isScreenshotAllowed?(): boolean;
  destroy?(): void;
}
```

#### EventContextProvider Interface

```typescript
interface EventContextProvider extends ContextProvider {
  onContextChange(callback: (context: PageContext) => void): () => void;
  startMonitoring(): void;
  stopMonitoring(): void;
}
```

### Backend Providers

#### ContextProvider Interface

```python
class ContextProvider(ABC):
    async def get_current_context(self, url: Optional[str] = None) -> PageContext:
        pass

    async def get_screenshot(self, url: Optional[str] = None, options: Optional[ScreenshotOptions] = None) -> str:
        pass

    async def get_context_with_screenshot(self, url: Optional[str] = None, options: Optional[ScreenshotOptions] = None) -> ContextResponse:
        pass

    def is_screenshot_allowed(self, url: str) -> bool:
        pass
```

## Configuration Options

### ContextProviderConfig

```typescript
interface ContextProviderConfig {
  baseUrl?: string; // Backend/frontend URL
  authHeaders?: Record<string, string>; // Authentication headers
  whitelistedPages?: string[]; // Pages allowed for screenshots
  enableScreenshots?: boolean; // Enable screenshot capture
  screenshotOptions?: ScreenshotOptions; // Default screenshot options
  timeout?: number; // Request timeout (seconds)
}
```

### ScreenshotOptions

```typescript
interface ScreenshotOptions {
  format?: "png" | "jpeg" | "webp"; // Image format
  quality?: number; // Image quality (0-1)
  fullPage?: boolean; // Capture full page
  clip?: {
    // Clip region
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
```

## Integration Examples

### LangChain Integration

```python
from langchain.tools import tool
from context_bridge import get_page_context, get_page_screenshot

@tool
async def get_current_page_context(url: str = None) -> str:
    """Get the current page context from the browser"""
    context = await get_page_context("http://localhost:3000", url)
    return f"Page: {context.title}\nURL: {context.url}\nContent: {context.dom.text[:500]}..."

@tool
async def capture_page_screenshot(url: str) -> str:
    """Capture a screenshot of the current page"""
    screenshot = await get_page_screenshot(
        "http://localhost:3000",
        url,
        whitelisted_pages=["localhost", "myapp.com"]
    )
    return f"Screenshot captured: {len(screenshot)} bytes"
```

### MCP Server Integration

```python
import asyncio
from mcp.server import Server
from context_bridge import get_page_context

server = Server("context-bridge")

@server.tool()
async def get_page_context_tool(url: str = None) -> dict:
    """Get current page context"""
    context = await get_page_context("http://localhost:3000", url)
    return {
        "url": context.url,
        "title": context.title,
        "text": context.dom.text,
        "forms": len(context.dom.forms),
        "inputs": len(context.dom.inputs)
    }
```

## Development

### Building Frontend

```bash
cd frontend
npm install
npm run build
```

### Building Backend

```bash
cd backend
pip install -e .
python -m pytest tests/
```

### Running Tests

```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd backend
pytest
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- GitHub Issues: [https://github.com/context-bridge/context-bridge/issues](https://github.com/context-bridge/context-bridge/issues)
- Documentation: [https://github.com/context-bridge/context-bridge#readme](https://github.com/context-bridge/context-bridge#readme)
- Examples: [examples/](examples/)
