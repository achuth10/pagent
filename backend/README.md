# Context Bridge Backend SDK

Python SDK for Context Bridge that enables agentic systems to fetch live page context and screenshots from web applications.

## Installation

```bash
pip install context-bridge-backend
```

## Quick Start

```python
from context_bridge import RESTContextProvider, ContextProviderConfig

# Configure the provider
config = ContextProviderConfig(
    base_url="http://localhost:3000",  # Frontend URL
    enable_screenshots=True,
    whitelisted_pages=["localhost", "myapp.com"]
)

# Initialize provider
provider = RESTContextProvider(config)

# Get current page context
context = await provider.get_current_context()
print(f"Page: {context.title}")
print(f"Text: {context.dom.text[:100]}...")

# Get screenshot
screenshot = await provider.get_screenshot()
print(f"Screenshot: {len(screenshot)} bytes")

# Cleanup
await provider.cleanup()
```

## Features

- 🔒 **Secure**: Only captures screenshots on whitelisted pages
- 🌐 **Transport Agnostic**: REST and WebSocket support
- 🤖 **Agent Ready**: Compatible with MCP, LangChain, LangGraph
- ⚡ **Async**: Full async/await support
- 🎯 **Type Safe**: Complete type annotations

## API Reference

### ContextProvider Interface

```python
from context_bridge import ContextProvider

class ContextProvider(ABC):
    async def get_current_context(self, url: Optional[str] = None) -> PageContext:
        """Get current page context"""
        pass

    async def get_screenshot(self, url: Optional[str] = None, options: Optional[ScreenshotOptions] = None) -> str:
        """Get page screenshot (base64 encoded)"""
        pass

    async def get_context_with_screenshot(self, url: Optional[str] = None, options: Optional[ScreenshotOptions] = None) -> ContextResponse:
        """Get both context and screenshot"""
        pass

    def is_screenshot_allowed(self, url: str) -> bool:
        """Check if screenshots are allowed for URL"""
        pass
```

### Configuration

```python
from context_bridge import ContextProviderConfig, ScreenshotOptions

config = ContextProviderConfig(
    base_url="http://localhost:3000",
    auth_headers={"Authorization": "Bearer token"},
    whitelisted_pages=["localhost", "*.myapp.com"],
    enable_screenshots=True,
    screenshot_options=ScreenshotOptions(
        format="png",
        quality=0.8,
        full_page=False
    ),
    timeout=30
)
```

## Integration Examples

### MCP Integration

```python
from context_bridge.providers.rest_provider import get_page_context, get_page_screenshot

# MCP tool functions
async def get_current_page_context(url: str = None) -> dict:
    """Get current page context for MCP"""
    context = await get_page_context(
        base_url="http://localhost:3000",
        url=url
    )
    return {
        "url": context.url,
        "title": context.title,
        "text": context.dom.text,
        "forms": len(context.dom.forms)
    }

async def capture_page_screenshot(url: str) -> str:
    """Capture page screenshot for MCP"""
    return await get_page_screenshot(
        base_url="http://localhost:3000",
        url=url,
        whitelisted_pages=["localhost", "myapp.com"]
    )
```

### LangChain Integration

```python
from langchain.tools import tool
from context_bridge import get_page_context

@tool
async def get_page_context_tool(url: str = None) -> str:
    """Get the current page context"""
    context = await get_page_context("http://localhost:3000", url)
    return f"Page: {context.title}\nContent: {context.dom.text[:500]}..."
```

### FastAPI Integration

```python
from fastapi import FastAPI
from context_bridge import RESTContextProvider, ContextProviderConfig

app = FastAPI()
provider = RESTContextProvider(ContextProviderConfig(
    base_url="http://localhost:3000"
))

@app.get("/context")
async def get_context():
    context = await provider.get_current_context()
    return {"title": context.title, "url": context.url}
```

## Data Types

### PageContext

```python
@dataclass
class PageContext:
    url: str
    title: str
    timestamp: int
    dom: Optional[DOMData] = None
    viewport: Optional[ViewportData] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
```

### DOMData

```python
@dataclass
class DOMData:
    text: str = ""
    html: Optional[str] = None
    forms: List[FormData] = field(default_factory=list)
    inputs: List[InputData] = field(default_factory=list)
```

### FormData

```python
@dataclass
class FormData:
    id: Optional[str] = None
    name: Optional[str] = None
    action: Optional[str] = None
    method: Optional[str] = None
    fields: List[InputData] = field(default_factory=list)
```

## Error Handling

```python
from context_bridge import RESTContextProvider
import aiohttp

try:
    context = await provider.get_current_context()
except aiohttp.ClientError as e:
    print(f"Network error: {e}")
except ValueError as e:
    print(f"Configuration error: {e}")
except PermissionError as e:
    print(f"Screenshot not allowed: {e}")
```

## Development

### Setup

```bash
git clone https://github.com/context-bridge/context-bridge.git
cd context-bridge/backend
pip install -e .
```

### Testing

```bash
pytest tests/
```

### Type Checking

```bash
mypy src/context_bridge/
```

## License

MIT License
