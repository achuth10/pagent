import React, { useState, useEffect, useCallback } from 'react';
import { ContextProvider } from './context-bridge';
import { RESTContextProvider, WSContextProvider } from './context-bridge';
import type { PageContext, ContextResponse } from './context-bridge';

interface ConnectionStatus {
  rest: 'connected' | 'disconnected' | 'connecting';
  websocket: 'connected' | 'disconnected' | 'connecting';
}

function App() {
  const [restProvider, setRestProvider] = useState<ContextProvider | null>(null);
  const [wsProvider, setWSProvider] = useState<ContextProvider | null>(null);
  const [currentContext, setCurrentContext] = useState<PageContext | null>(null);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    rest: 'disconnected',
    websocket: 'disconnected'
  });
  const [activeProvider, setActiveProvider] = useState<'rest' | 'websocket'>('rest');
  const [autoUpdate, setAutoUpdate] = useState(false);
  const [loading, setLoading] = useState({
    context: false,
    screenshot: false,
    both: false
  });

  // Initialize providers
  useEffect(() => {
    const restConfig = {
      baseUrl: 'http://localhost:8000',
      enableScreenshots: true,
      whitelistedPages: ['localhost', '127.0.0.1'],
      screenshotOptions: {
        format: 'png' as const,
        quality: 0.8,
        fullPage: false
      }
    };

    const wsConfig = {
      baseUrl: 'http://localhost:8000',
      enableScreenshots: true,
      whitelistedPages: ['localhost', '127.0.0.1'],
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

    // Initialize WebSocket provider
    const ws = new WSContextProvider(wsConfig);
    setWSProvider(ws);
    
    // Set up WebSocket connection status monitoring
    // In a real implementation, you'd listen to WebSocket events
    setTimeout(() => {
      setConnectionStatus(prev => ({ ...prev, websocket: 'connected' }));
    }, 1000);

    // Send initial context when providers are ready
    const sendInitialContext = async () => {
      try {
        const context = await rest.getCurrentContext();
        setCurrentContext(context);
        console.log('Initial context sent to backend:', context);
      } catch (error) {
        console.error('Failed to send initial context:', error);
      }
    };
    
    // Send context after a short delay to ensure everything is initialized
    setTimeout(sendInitialContext, 1000);

    return () => {
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

      {/* Example form to demonstrate context extraction */}
      <div className="form-example">
        <h3>Example Form (for context extraction demo)</h3>
        <form>
          <label htmlFor="name">Name:</label>
          <input type="text" id="name" name="name" placeholder="Enter your name" />
          
          <label htmlFor="email">Email:</label>
          <input type="email" id="email" name="email" placeholder="Enter your email" />
          
          <label htmlFor="message">Message:</label>
          <textarea id="message" name="message" rows={4} placeholder="Enter your message"></textarea>
          
          <label htmlFor="category">Category:</label>
          <select id="category" name="category">
            <option value="">Select a category</option>
            <option value="general">General</option>
            <option value="support">Support</option>
            <option value="feedback">Feedback</option>
          </select>
          
          <label>
            <input type="checkbox" name="newsletter" />
            Subscribe to newsletter
          </label>
          
          <button type="submit">Submit Form</button>
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
          This example demonstrates the Context Bridge library in action. It shows how to:
        </p>
        <ul>
          <li>Initialize both REST and WebSocket context providers</li>
          <li>Extract current page context including DOM content, forms, and metadata</li>
          <li>Capture screenshots (when enabled and whitelisted)</li>
          <li>Switch between different transport methods</li>
          <li>Monitor connection status</li>
        </ul>
        <p>
          The backend API is running on <code>http://localhost:8000</code> and provides
          endpoints that agents can use to fetch this context data.
        </p>
      </div>
    </div>
  );
}

export default App;
