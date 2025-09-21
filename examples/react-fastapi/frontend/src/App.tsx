import React, { useState, useEffect, useCallback } from 'react';
import { ContextProvider } from './context-bridge';
import { RESTContextProvider, WSContextProvider } from './context-bridge';
import type { PageContext, ContextResponse, Instruction } from './context-bridge';

interface ConnectionStatus {
  rest: 'connected' | 'disconnected' | 'connecting';
  websocket: 'connected' | 'disconnected' | 'connecting';
}

function App() {
  const [restProvider, setRestProvider] = useState<ContextProvider | null>(null);
  const [wsProvider, setWSProvider] = useState<WSContextProvider | null>(null);
  const [currentContext, setCurrentContext] = useState<PageContext | null>(null);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    rest: 'disconnected',
    websocket: 'disconnected'
  });
  const [activeProvider, setActiveProvider] = useState<'rest' | 'websocket'>('websocket');
  const [autoUpdate, setAutoUpdate] = useState(false);
  const [loading, setLoading] = useState({
    context: false,
    screenshot: false,
    both: false
  });
  const [receivedInstructions, setReceivedInstructions] = useState<Instruction[]>([]);
  const [instructionsEnabled, setInstructionsEnabled] = useState(true);

  // Initialize providers
  useEffect(() => {
    const restConfig = {
      baseUrl: 'http://localhost:8000',
      enableScreenshots: true,
      whitelistedPages: [
        '/',           // Home page
        '/dashboard',  // Dashboard page
        '/settings/*', // All settings pages
        '#demo'        // Demo section (hash)
      ],
      screenshotOptions: {
        format: 'png' as const,
        quality: 0.8,
        fullPage: false
      }
    };

    const wsConfig = {
      baseUrl: 'http://localhost:8000',
      enableScreenshots: true,
      whitelistedPages: [
        '/',           // Home page
        '/dashboard',  // Dashboard page
        '/settings/*', // All settings pages
        '#demo'        // Demo section (hash)
      ],
      screenshotOptions: {
        format: 'png' as const,
        quality: 0.8,
        fullPage: false
      }
    };

    // Initialize REST provider
    const rest = new RESTContextProvider(restConfig);
    setRestProvider(rest);
    setConnectionStatus(prev => ({ ...prev, rest: 'connected' }));

    // Initialize WebSocket provider with instruction handling
    const ws = new WSContextProvider(wsConfig, {
      enableNotifications: instructionsEnabled,
      enableRedirects: instructionsEnabled,
      enableFormManipulation: instructionsEnabled,
      enableDOMManipulation: instructionsEnabled,
    });
    setWSProvider(ws);
    
    // Subscribe to instruction events
    const unsubscribeInstructions = ws.onInstruction((instruction: Instruction) => {
      console.log('📨 Received instruction in App:', instruction);
      setReceivedInstructions(prev => [...prev.slice(-9), instruction]); // Keep last 10
    });
    
    // Set up WebSocket connection status monitoring
    // In a real implementation, you'd listen to WebSocket events
    setTimeout(() => {
      setConnectionStatus(prev => ({ ...prev, websocket: 'connected' }));
    }, 1000);

    // Send initial context when providers are ready
    const sendInitialContext = async () => {
      try {
        // Use WebSocket provider to send context for instruction generation
        const context = await ws.getCurrentContext();
        setCurrentContext(context);
        console.log('Initial context sent to backend via WebSocket:', context);
      } catch (error) {
        console.error('Failed to send initial context:', error);
      }
    };
    
    // Send context after a short delay to ensure everything is initialized
    setTimeout(sendInitialContext, 1000);

    return () => {
      unsubscribeInstructions();
      rest.destroy?.();
      ws.destroy?.();
    };
  }, []);

  // Auto-update context
  useEffect(() => {
    if (!autoUpdate) return;

    const interval = setInterval(async () => {
      await handleGetContext();
    }, 2000);

    return () => clearInterval(interval);
  }, [autoUpdate, activeProvider, restProvider, wsProvider]);

  const handleGetContext = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, context: true }));
      console.log('🔄 Getting current context...');
      const provider = activeProvider === 'rest' ? restProvider : wsProvider;
      if (!provider) {
        console.warn('No provider available');
        return;
      }

      const context = await provider.getCurrentContext();
      setCurrentContext(context);
      console.log('✅ Context updated:', context.title);
    } catch (error) {
      console.error('❌ Failed to get context:', error);
    } finally {
      setLoading(prev => ({ ...prev, context: false }));
    }
  }, [activeProvider, restProvider, wsProvider]);

  const handleGetScreenshot = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, screenshot: true }));
      console.log('📸 Getting screenshot...');
      const provider = activeProvider === 'rest' ? restProvider : wsProvider;
      if (!provider || !provider.getScreenshot) {
        console.warn('Screenshot not available for this provider');
        alert('Screenshot not available for this provider');
        return;
      }

      const screenshotData = await provider.getScreenshot();
      setScreenshot(screenshotData);
      console.log('✅ Screenshot captured:', screenshotData.length, 'characters');
    } catch (error) {
      console.error('❌ Failed to get screenshot:', error);
      alert('Screenshot failed: ' + (error as Error).message);
    } finally {
      setLoading(prev => ({ ...prev, screenshot: false }));
    }
  }, [activeProvider, restProvider, wsProvider]);

  const handleGetBoth = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, both: true }));
      console.log('🔄📸 Getting both context and screenshot...');
      const provider = activeProvider === 'rest' ? restProvider : wsProvider;
      if (!provider || !provider.getContextWithScreenshot) {
        console.warn('Combined method not available, trying separately...');
        await handleGetContext();
        await handleGetScreenshot();
        return;
      }

      const response = await provider.getContextWithScreenshot();
      setCurrentContext(response.context);
      if (response.screenshot) {
        setScreenshot(response.screenshot);
        console.log('✅ Both context and screenshot updated');
      } else {
        console.log('✅ Context updated, no screenshot available');
      }
    } catch (error) {
      console.error('❌ Failed to get context with screenshot:', error);
    } finally {
      setLoading(prev => ({ ...prev, both: false }));
    }
  }, [activeProvider, restProvider, wsProvider, handleGetContext, handleGetScreenshot]);

  const getStatusIndicator = (status: string) => {
    const className = `status-indicator status-${status}`;
    return <span className={className}></span>;
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Context Bridge React Example</h1>
      
      <div className="card">
        <h2>Connection Status</h2>
        <p>
          {getStatusIndicator(connectionStatus.rest)}
          REST Provider: {connectionStatus.rest}
        </p>
        <p>
          {getStatusIndicator(connectionStatus.websocket)}
          WebSocket Provider: {connectionStatus.websocket}
        </p>
      </div>

      <div className="card">
        <h2>Provider Selection</h2>
        <label>
          <input
            type="radio"
            name="provider"
            value="rest"
            checked={activeProvider === 'rest'}
            onChange={(e) => setActiveProvider(e.target.value as 'rest')}
          />
          REST Provider
        </label>
        <br />
        <label>
          <input
            type="radio"
            name="provider"
            value="websocket"
            checked={activeProvider === 'websocket'}
            onChange={(e) => setActiveProvider(e.target.value as 'websocket')}
          />
          WebSocket Provider
        </label>
        <br />
        <label>
          <input
            type="checkbox"
            checked={autoUpdate}
            onChange={(e) => setAutoUpdate(e.target.checked)}
          />
          Auto-update context (every 2 seconds)
        </label>
        <br />
        <label>
          <input
            type="checkbox"
            checked={instructionsEnabled}
            onChange={(e) => setInstructionsEnabled(e.target.checked)}
          />
          Enable backend instructions (notifications, form assistance, etc.)
        </label>
      </div>

      <div className="card">
        <h2>Actions</h2>
        <button 
          onClick={handleGetContext} 
          disabled={loading.context}
          style={{ marginRight: '1rem' }}
        >
          {loading.context ? '🔄 Sending...' : '📤 Send Context to Backend'}
        </button>
        <button 
          onClick={handleGetScreenshot} 
          disabled={loading.screenshot}
          style={{ marginRight: '1rem' }}
        >
          {loading.screenshot ? '📸 Capturing...' : '📸 Capture & Send Screenshot'}
        </button>
        <button 
          onClick={handleGetBoth}
          disabled={loading.both}
        >
          {loading.both ? '🔄 Processing...' : '📤📸 Send Both Context & Screenshot'}
        </button>
      </div>

      {/* Instructions received from backend */}
      {receivedInstructions.length > 0 && (
        <div className="card">
          <h2>🎯 Instructions from Backend</h2>
          <p>The backend has analyzed your page context and sent {receivedInstructions.length} instruction(s):</p>
          <div className="instructions-list">
            {receivedInstructions.slice(-5).reverse().map((instruction, index) => (
              <div key={instruction.id} className={`instruction-item instruction-${instruction.type}`}>
                <div className="instruction-header">
                  <span className="instruction-type">{instruction.type}</span>
                  <span className="instruction-priority">{instruction.priority || 'medium'}</span>
                  <span className="instruction-time">
                    {new Date(instruction.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="instruction-details">
                  {instruction.type === 'contextual_notification' && (
                    <div>
                      <strong>Message:</strong> {(instruction as any).data.message}
                      <br />
                      <strong>Type:</strong> {(instruction as any).data.notificationType}
                    </div>
                  )}
                  {instruction.type === 'form_assistance' && (
                    <div>
                      <strong>Action:</strong> {(instruction as any).data.action}
                      <br />
                      <strong>Target:</strong> {(instruction as any).data.selector}
                      <br />
                      <strong>Message:</strong> {(instruction as any).data.message}
                    </div>
                  )}
                  {instruction.type === 'content_instruction' && (
                    <div>
                      <strong>Action:</strong> {(instruction as any).data.action}
                      <br />
                      <strong>Content:</strong> {(instruction as any).data.content}
                    </div>
                  )}
                  {!['contextual_notification', 'form_assistance', 'content_instruction'].includes(instruction.type) && (
                    <pre style={{ fontSize: '12px', background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
                      {JSON.stringify((instruction as any).data, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={() => setReceivedInstructions([])}
            style={{ marginTop: '1rem', padding: '4px 8px', fontSize: '12px' }}
          >
            Clear Instructions
          </button>
        </div>
      )}

      {/* Example form to demonstrate context extraction and backend analysis */}
      <div className="form-example">
        <h3>Example Form (for context extraction & backend analysis demo)</h3>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '1rem' }}>
          Fill out this form to see how the backend analyzes your context and sends intelligent instructions!
        </p>
        <form>
          <label htmlFor="name">Name: <span style={{ color: 'red' }}>*</span></label>
          <input type="text" id="name" name="name" placeholder="Enter your name" required />
          
          <label htmlFor="email">Email: <span style={{ color: 'red' }}>*</span></label>
          <input type="email" id="email" name="email" placeholder="Enter your email" required />
          
          <label htmlFor="phone">Phone:</label>
          <input type="tel" id="phone" name="phone" placeholder="Enter your phone number" />
          
          <label htmlFor="message">Message: <span style={{ color: 'red' }}>*</span></label>
          <textarea id="message" name="message" rows={4} placeholder="Enter your message" required></textarea>
          
          <label htmlFor="category">Category:</label>
          <select id="category" name="category">
            <option value="">Select a category</option>
            <option value="general">General</option>
            <option value="support">Support</option>
            <option value="feedback">Feedback</option>
            <option value="bug-report">Bug Report</option>
          </select>
          
          <label htmlFor="priority">Priority:</label>
          <select id="priority" name="priority">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          
          <label>
            <input type="checkbox" name="newsletter" />
            Subscribe to newsletter
          </label>
          
          <label>
            <input type="checkbox" name="terms" required />
            I agree to the terms and conditions <span style={{ color: 'red' }}>*</span>
          </label>
          
          <button type="submit">Submit Form</button>
          <button type="reset" style={{ marginLeft: '1rem' }}>Reset Form</button>
        </form>
      </div>

      {currentContext && (
        <div className="card">
          <h2>📄 Current Page Context</h2>
          <div className="context-summary">
            <p><strong>Page:</strong> {currentContext.title}</p>
            <p><strong>URL:</strong> {currentContext.url}</p>
            <p><strong>Timestamp:</strong> {new Date(currentContext.timestamp).toLocaleString()}</p>
            <p><strong>Text Length:</strong> {currentContext.dom?.text?.length || 0} characters</p>
            <p><strong>Forms Found:</strong> {currentContext.dom?.forms?.length || 0}</p>
            <p><strong>Inputs Found:</strong> {currentContext.dom?.inputs?.length || 0}</p>
          </div>
          <details>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '1rem' }}>
              🔍 View Full JSON Context
            </summary>
            <pre className="context-json">
              <code>
                {(() => {
                  try {
                    return JSON.stringify(currentContext, null, 2);
                  } catch (error) {
                    return `Error displaying context: ${error instanceof Error ? error.message : 'Unknown error'}`;
                  }
                })()}
              </code>
            </pre>
          </details>
        </div>
      )}

      {screenshot && (
        <div className="card">
          <h2>📸 Page Screenshot</h2>
          <div className="screenshot-info">
            <p><strong>Size:</strong> {Math.round(screenshot.length / 1024)} KB</p>
            <p><strong>Format:</strong> PNG (Base64)</p>
          </div>
          <div className="screenshot-display">
            <img 
              src={`data:image/png;base64,${screenshot}`} 
              alt="Page screenshot" 
              style={{ maxWidth: '100%', height: 'auto', border: '1px solid #444', borderRadius: '8px' }}
            />
          </div>
        </div>
      )}

      <div className="card">
        <h2>About This Example</h2>
        <p>
          This example demonstrates the Context Bridge library with intelligent backend instructions. It shows how to:
        </p>
        <ul>
          <li><strong>Context Extraction:</strong> Extract current page context including DOM content, forms, and metadata</li>
          <li><strong>Real-time Analysis:</strong> Backend analyzes page context to understand user intent and identify issues</li>
          <li><strong>Intelligent Instructions:</strong> Backend sends contextual instructions like form assistance, notifications, and UI guidance</li>
          <li><strong>Bidirectional Communication:</strong> WebSocket enables real-time communication between frontend and backend</li>
          <li><strong>Instruction Execution:</strong> Frontend automatically executes backend instructions (highlighting, tooltips, notifications)</li>
          <li><strong>Screenshot Capture:</strong> Capture and send screenshots when enabled</li>
        </ul>
        <p>
          <strong>Try it out:</strong> Fill out the form above and watch as the backend analyzes your context and sends intelligent instructions!
          The backend will highlight required fields, show validation messages, and provide contextual guidance.
        </p>
        <p>
          The backend API is running on <code>http://localhost:8000</code> and provides
          endpoints that agents can use to fetch context data and send instructions to the frontend.
        </p>
        <div className="instruction-types-section">
          <h4>🎯 Instruction Types Supported:</h4>
          <ul className="instruction-types-list">
            <li><strong>Form Assistance:</strong> Highlight required fields, show validation errors</li>
            <li><strong>Contextual Notifications:</strong> Show relevant messages and suggestions</li>
            <li><strong>Content Instructions:</strong> Display tooltips, overlays, and guidance</li>
            <li><strong>Navigation Suggestions:</strong> Recommend next steps or alternatives</li>
            <li><strong>Element Interactions:</strong> Scroll to elements, highlight sections</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
