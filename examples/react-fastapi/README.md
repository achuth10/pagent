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
- ✅ **🎯 Bidirectional Instruction System** - Backend analyzes context and sends intelligent instructions to frontend
- ✅ **🧠 Intelligent Context Analysis** - AI-powered analysis of page content and user behavior
- ✅ **⚡ Real-time Instruction Execution** - Frontend automatically executes backend instructions
- ✅ **🎨 Visual Feedback** - Form highlighting, notifications, tooltips, and UI guidance

## Architecture

```
┌─────────────────┐    HTTP/WS     ┌─────────────────┐
│   React App     │◄──────────────►│   FastAPI       │
│   (Port 3000)   │                │   (Port 8000)   │
│                 │                │                 │
│ ContextProvider │   Context      │ Context         │
│ - REST          │──────────────► │ Analyzer        │
│ - WebSocket     │                │                 │
│                 │ Instructions   │ Instruction     │
│ Instruction     │◄────────────── │ Generator       │
│ Executor        │                │                 │
│                 │                │ Agent Endpoints │
│                 │                │ - /agent/*      │
│                 │                │ - /current-*    │
└─────────────────┘                └─────────────────┘
```

### Bidirectional Flow

1. **Frontend → Backend**: Page context (DOM, forms, viewport, etc.)
2. **Backend Analysis**: AI-powered context analysis and issue detection
3. **Backend → Frontend**: Intelligent instructions (highlights, notifications, guidance)
4. **Frontend Execution**: Automatic instruction execution with visual feedback

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

### 4. Test the Instruction System

1. Make sure "WebSocket Provider" is selected in the React app
2. Leave required form fields empty (Name, Email, Message)
3. Click "📤 Send Context to Backend"
4. Watch as the backend analyzes your context and sends intelligent instructions:
   - Form fields get highlighted in orange
   - Notifications appear with guidance
   - Instructions are listed in the "🎯 Instructions from Backend" section

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

## 🎯 Bidirectional Instruction System

This example showcases a powerful bidirectional communication system where the backend can analyze page context and send intelligent instructions back to the frontend for automatic execution.

### How It Works

1. **Context Analysis**: Backend analyzes page context using rule-based logic (placeholder for LLM integration)
2. **Issue Detection**: Identifies validation errors, usability issues, and accessibility problems
3. **Instruction Generation**: Creates specific instructions based on analysis results
4. **Real-time Delivery**: Sends instructions via WebSocket for immediate execution
5. **Automatic Execution**: Frontend executes instructions with visual feedback

### Instruction Types Supported

#### 🔧 Form Assistance

- **Highlight Required Fields**: Visually emphasize empty required form fields
- **Show Validation Errors**: Display specific error messages for invalid inputs
- **Suggest Values**: Provide placeholder suggestions for form fields
- **Field Validation**: Real-time validation feedback

#### 📢 Contextual Notifications

- **Info Messages**: Helpful guidance and next steps
- **Warning Alerts**: Important notices about potential issues
- **Error Notifications**: Critical error messages with suggested actions
- **Success Confirmations**: Positive feedback for completed actions

#### 🎨 Content Instructions

- **Tooltips**: Show helpful information next to specific elements
- **Overlays**: Display important information over page content
- **Section Highlighting**: Emphasize important page sections
- **Content Modification**: Dynamic content updates based on context

#### 🧭 Navigation Suggestions

- **Next Steps**: Recommend logical next actions for users
- **Alternative Paths**: Suggest different approaches or options
- **Navigation Warnings**: Alert about potentially problematic navigation

#### 🎯 Element Interactions

- **Scroll to Element**: Automatically scroll to important page elements
- **Highlight Elements**: Visually emphasize specific page components
- **Click Simulation**: Programmatically interact with page elements

### Context Analysis Features

⚠️ **Note**: The current context analyzer implementation uses rule-based logic as a demonstration. In a production system, this would be replaced with LLM-powered analysis for more sophisticated understanding of page context and user intent.

The backend performs analysis of page context using:

#### Page Type Detection

- **Form Pages**: Detects forms and analyzes field requirements
- **Checkout Pages**: Identifies e-commerce checkout flows
- **Dashboard Pages**: Recognizes admin and user dashboard interfaces
- **Content Pages**: Analyzes general content and reading experiences
- **Error Pages**: Detects error states and provides recovery suggestions

#### Issue Identification

- **Validation Issues**: Empty required fields, invalid formats
- **Usability Problems**: Poor mobile experience, accessibility concerns
- **Performance Issues**: Large content, slow loading indicators
- **Accessibility Gaps**: Missing labels, poor contrast, navigation issues

#### User Intent Inference

- **Form Filling**: User attempting to complete forms
- **Purchasing**: User in checkout or buying process
- **Browsing**: User exploring content or navigation
- **Searching**: User looking for specific information

### Example Instruction Flow

```javascript
// 1. Frontend sends context via WebSocket
const context = {
  url: "http://localhost:3000",
  title: "Contact Form",
  dom: {
    forms: [
      {
        id: "contact-form",
        fields: [
          { id: "name", required: true, value: "" }, // Empty required field
          { id: "email", required: true, value: "" }, // Empty required field
          { id: "message", required: true, value: "" }, // Empty required field
        ],
      },
    ],
  },
};

// 2. Backend analyzes context and generates instructions
const instructions = [
  {
    type: "form_assistance",
    data: {
      action: "highlight_field",
      selector: "#name",
      message: "This field is required: name",
    },
  },
  {
    type: "contextual_notification",
    data: {
      message: "Please complete 3 required fields to continue",
      notificationType: "info",
    },
  },
];

// 3. Frontend receives and executes instructions automatically
// - Form fields get highlighted in orange
// - Notification appears at top of page
// - User gets clear guidance on what to do next
```

### Testing the Instruction System

#### Using the React App

1. Start both backend and frontend servers
2. Navigate to `http://localhost:3000`
3. Ensure "WebSocket Provider" is selected
4. Leave required form fields empty (Name, Email, Message)
5. Click "📤 Send Context to Backend"
6. Observe:
   - Form fields get highlighted
   - Instructions appear in the "🎯 Instructions from Backend" section
   - Notifications show at the top of the page

#### Using the Test Page

A standalone test page (`test_instructions.html`) is included for debugging:

1. Open `test_instructions.html` in your browser
2. Check WebSocket connection status
3. Interact with the form to trigger instructions
4. View debug logs to see the instruction flow

### Configuration Options

#### Frontend Configuration

```typescript
const wsProvider = new WSContextProvider(config, {
  enableNotifications: true, // Enable notification instructions
  enableRedirects: true, // Enable navigation instructions
  enableFormManipulation: true, // Enable form assistance
  enableDOMManipulation: true, // Enable element interactions
});
```

#### Backend Configuration

The context analyzer can be customized for different analysis strategies:

- Form validation rules
- Page type detection patterns
- Issue severity thresholds
- Instruction generation policies

⚠️ **LLM Integration**: Replace the current rule-based `ContextAnalyzer` with LLM-powered analysis:

```python
# Example LLM integration placeholder
class LLMContextAnalyzer:
    def __init__(self, llm_client):
        self.llm_client = llm_client

    async def analyze_context(self, context: PageContext) -> ContextAnalysis:
        # Send context to LLM for analysis
        prompt = f"Analyze this web page context: {context}"
        analysis = await self.llm_client.analyze(prompt)
        return self.parse_llm_response(analysis)
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
- **Page-level whitelisting** for screenshots (specific routes, not domains)
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

### Page Whitelisting Patterns

The library supports flexible page whitelisting patterns:

```typescript
whitelistedPages: [
  "/", // Exact path: only root page
  "/dashboard", // Exact path: only /dashboard
  "/admin/*", // Wildcard: all pages under /admin/
  "/user/\\d+", // Regex: user pages like /user/123
  "^/api/v\\d+/docs$", // Complex regex: API docs pages
  "#settings", // Hash fragment: #settings section
  "http://localhost:3000/special", // Full URL match
];
```

**Pattern Types:**

- **Exact match**: `/dashboard` matches only `/dashboard`
- **Prefix match**: `/admin` matches `/admin`, `/admin/users`, etc.
- **Wildcard**: `/admin/*` matches `/admin/anything`
- **Regex**: `^/user/\\d+$` matches `/user/123` but not `/user/abc`
- **Hash**: `#settings` matches when URL contains `#settings`
- **Full URL**: Complete URL matching for cross-origin scenarios

### Custom Screenshot Options

Configure real screenshot capture options (html2canvas):

```typescript
const provider = new RESTContextProvider({
  enableScreenshots: true,
  whitelistedPages: [
    "/", // Home page only
    "/dashboard", // Exact dashboard page
    "/admin/*", // All admin pages
    "/user/\\d+", // User profile pages (regex)
    "#settings", // Settings section (hash)
  ],
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

### 🎯 Instruction System Issues

If instructions are not showing up or working:

#### Backend Issues

1. **Backend Not Starting**:

   - Error: `WARNING: You must pass the application as an import string to enable 'reload' or 'workers'.`
   - Solution: Use `uvicorn.run("main:app", ...)` instead of `uvicorn.run(app, ...)`

2. **No Instructions Generated**:

   - Check backend logs for "Generated X instructions" messages
   - Ensure form has empty required fields to trigger validation
   - Verify context analyzer is receiving proper form data

3. **Context Analysis Failing**:
   - Check backend logs for analysis errors
   - Verify Python types are properly imported
   - Ensure context conversion is working correctly

#### Frontend Issues

1. **WebSocket Not Connected**:

   - Check browser console for WebSocket connection errors
   - Verify backend is running on port 8000
   - Ensure WebSocket provider is selected (not REST)

2. **Instructions Not Received**:

   - Check browser console for "📨 Received instruction in App:" messages
   - Verify `onInstruction` callback is working
   - Check Network tab for WebSocket messages

3. **Instructions Not Displayed**:

   - Look for "🎯 Instructions from Backend" section
   - Instructions only show when `receivedInstructions.length > 0`
   - Check if instructions are being added to state

4. **Instructions Not Executed**:
   - Verify instruction executor is initialized
   - Check if instruction types are enabled in configuration
   - Look for CSS classes being applied to elements

#### Debug Steps

1. **Test with Standalone Page**: Use `test_instructions.html` to isolate issues
2. **Check Browser Console**: Look for JavaScript errors and WebSocket messages
3. **Check Backend Logs**: Verify context analysis and instruction generation
4. **Verify Configuration**: Ensure WebSocket provider and instructions are enabled

#### Expected Flow Verification

```bash
# 1. Backend should show these logs:
📥 Received context: [Page Title] at [URL]
📊 Context analysis: form (confidence: 1.00)
🎯 Generated 7 instructions

# 2. Frontend console should show:
📨 Received instruction in App: {type: "form_assistance", ...}

# 3. UI should show:
- Orange highlighted form fields
- "🎯 Instructions from Backend" section with instruction list
- Notifications at top of page
```

#### Quick Test

```javascript
// Test WebSocket connection in browser console:
const ws = new WebSocket("ws://localhost:8000/ws");
ws.onopen = () => console.log("✅ Connected");
ws.onmessage = (e) => console.log("📨 Message:", JSON.parse(e.data));
```

## Production Deployment & LLM Integration

### 🤖 Replacing the Demo Context Analyzer

The current `ContextAnalyzer` uses simple rule-based logic for demonstration. For production use, replace it with LLM-powered analysis:

#### Option 1: OpenAI Integration

```python
import openai
from context_bridge.types import PageContext, ContextAnalysis

class OpenAIContextAnalyzer:
    def __init__(self, api_key: str):
        self.client = openai.OpenAI(api_key=api_key)

    async def analyze_context(self, context: PageContext) -> ContextAnalysis:
        prompt = f"""
        Analyze this web page context and provide structured analysis:

        URL: {context.url}
        Title: {context.title}
        Page Text: {context.dom.text[:1000]}...
        Forms: {len(context.dom.forms)} forms found
        Form Fields: {[f.id for form in context.dom.forms for f in form.fields]}

        Please analyze and return JSON with:
        1. pageType: form|checkout|dashboard|content|error|loading|unknown
        2. userIntent: browsing|purchasing|form_filling|searching|reading
        3. issues: array of {type, severity, message, element}
        4. suggestions: array of {type, message, action}
        5. confidence: 0-1 score
        """

        response = await self.client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )

        return self.parse_llm_response(response.choices[0].message.content)
```

#### Option 2: Anthropic Claude Integration

```python
import anthropic

class ClaudeContextAnalyzer:
    def __init__(self, api_key: str):
        self.client = anthropic.Anthropic(api_key=api_key)

    async def analyze_context(self, context: PageContext) -> ContextAnalysis:
        # Similar implementation using Claude API
        pass
```

#### Option 3: Local LLM Integration

```python
# Using Ollama, LM Studio, or other local LLM servers
import requests

class LocalLLMContextAnalyzer:
    def __init__(self, base_url: str = "http://localhost:11434"):
        self.base_url = base_url

    async def analyze_context(self, context: PageContext) -> ContextAnalysis:
        # Send context to local LLM for analysis
        pass
```

### 🚀 Production Considerations

#### Security

- Add authentication and authorization
- Implement rate limiting
- Validate and sanitize all inputs
- Use HTTPS in production
- Implement proper CORS policies

#### Scalability

- Use async/await for LLM calls
- Implement request queuing
- Add caching for repeated analyses
- Consider using background tasks for heavy processing

#### Monitoring

- Log all context analysis requests
- Monitor LLM API usage and costs
- Track instruction execution success rates
- Add performance metrics

#### Error Handling

- Graceful fallbacks when LLM is unavailable
- Retry logic for failed API calls
- User-friendly error messages
- Fallback to rule-based analysis if needed

## Next Steps

- **Replace demo analyzer** with LLM integration (see above)
- Integrate with your AI agent framework (LangChain, MCP, etc.)
- Add authentication and authorization
- Implement custom context extraction logic
- Deploy to production with proper security measures
- Add monitoring and logging
- Fine-tune LLM prompts for your specific use case
- Train custom models for domain-specific analysis
