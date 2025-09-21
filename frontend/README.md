# Context Bridge Frontend SDK

JavaScript/TypeScript SDK for Context Bridge that enables secure, opt-in page context extraction and screenshot capture for agentic systems.

## Installation

```bash
npm install @context-bridge/frontend
```

## Quick Start

```typescript
import { RESTContextProvider } from "@context-bridge/frontend";

// Initialize provider
const provider = new RESTContextProvider({
  baseUrl: "http://localhost:8000",
  enableScreenshots: true,
  whitelistedPages: ["localhost", "myapp.com"],
});

// Get current page context
const context = await provider.getCurrentContext();
console.log("Page context:", context);

// Get screenshot (if allowed)
const screenshot = await provider.getScreenshot();
console.log("Screenshot captured");
```

## Features

- 🔒 **Secure**: Screenshots only on whitelisted pages
- 🌐 **Transport Agnostic**: REST and WebSocket support
- 🎯 **Framework Agnostic**: Works with React, Vue, Angular, vanilla JS
- 📱 **Lightweight**: Minimal dependencies
- 🔄 **Real-time**: WebSocket support for live updates
- 🛡️ **Privacy First**: Automatic sensitive data filtering

## Providers

### REST Provider

For simple request/response interactions:

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

For real-time context monitoring:

```typescript
import { WSContextProvider } from "@context-bridge/frontend";

const provider = new WSContextProvider({
  baseUrl: "ws://localhost:8000",
  enableScreenshots: true,
  whitelistedPages: ["localhost"],
});

// Subscribe to context changes
const unsubscribe = provider.onContextChange((context) => {
  console.log("Page context changed:", context);
});

// Start monitoring
provider.startMonitoring();

// Stop monitoring
provider.stopMonitoring();
unsubscribe();
```

## Context Extraction

The SDK automatically extracts comprehensive page context:

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

The SDK automatically filters sensitive information:

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

## Framework Integration

### React

```typescript
import React, { useEffect, useState } from "react";
import { RESTContextProvider } from "@context-bridge/frontend";

function ContextComponent() {
  const [provider] = useState(
    () =>
      new RESTContextProvider({
        baseUrl: "http://localhost:8000",
        enableScreenshots: true,
      })
  );

  const [context, setContext] = useState(null);

  useEffect(() => {
    const updateContext = async () => {
      const ctx = await provider.getCurrentContext();
      setContext(ctx);
    };

    updateContext();
    const interval = setInterval(updateContext, 5000);

    return () => {
      clearInterval(interval);
      provider.destroy();
    };
  }, [provider]);

  return (
    <div>
      <h2>Current Page Context</h2>
      <pre>{JSON.stringify(context, null, 2)}</pre>
    </div>
  );
}
```

### Vue

```typescript
import { ref, onMounted, onUnmounted } from "vue";
import { RESTContextProvider } from "@context-bridge/frontend";

export default {
  setup() {
    const context = ref(null);
    const provider = new RESTContextProvider({
      baseUrl: "http://localhost:8000",
    });

    onMounted(async () => {
      context.value = await provider.getCurrentContext();
    });

    onUnmounted(() => {
      provider.destroy();
    });

    return { context };
  },
};
```

### Vanilla JavaScript

```javascript
import { createContextProvider } from "@context-bridge/frontend";

// Create provider
const provider = createContextProvider("rest", {
  baseUrl: "http://localhost:8000",
  enableScreenshots: true,
});

// Get context
provider.getCurrentContext().then((context) => {
  console.log("Page context:", context);

  // Update UI
  document.getElementById("context").textContent = JSON.stringify(
    context,
    null,
    2
  );
});
```

## Configuration Options

### ContextProviderConfig

```typescript
interface ContextProviderConfig {
  baseUrl?: string; // Backend URL
  authHeaders?: Record<string, string>; // Authentication headers
  whitelistedPages?: string[]; // Pages allowed for screenshots
  enableScreenshots?: boolean; // Enable screenshot capture
  screenshotOptions?: ScreenshotOptions; // Default screenshot options
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

## API Reference

### ContextProvider Interface

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

### EventContextProvider Interface

```typescript
interface EventContextProvider extends ContextProvider {
  onContextChange(callback: (context: PageContext) => void): () => void;
  startMonitoring(): void;
  stopMonitoring(): void;
}
```

## Error Handling

```typescript
try {
  const context = await provider.getCurrentContext();
} catch (error) {
  if (error.message.includes("Screenshots not allowed")) {
    console.log("Screenshots disabled for this page");
  } else {
    console.error("Failed to get context:", error);
  }
}
```

## Best Practices

### 1. Resource Cleanup

Always cleanup providers when done:

```typescript
// In React useEffect cleanup
useEffect(() => {
  return () => provider.destroy();
}, []);

// In component unmount
componentWillUnmount() {
  this.provider.destroy();
}
```

### 2. Error Handling

Handle network and permission errors gracefully:

```typescript
const getContextSafely = async () => {
  try {
    return await provider.getCurrentContext();
  } catch (error) {
    console.warn("Context unavailable:", error.message);
    return null;
  }
};
```

### 3. Performance

Use debouncing for frequent context updates:

```typescript
import { debounce } from "lodash";

const debouncedUpdate = debounce(async () => {
  const context = await provider.getCurrentContext();
  updateUI(context);
}, 1000);

// Call debouncedUpdate() instead of direct updates
```

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

### Type Checking

```bash
npm run type-check
```

## License

MIT License
