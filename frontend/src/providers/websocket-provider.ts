import { EventContextProvider } from "../interfaces";
import {
  PageContext,
  ScreenshotOptions,
  ContextProviderConfig,
  ContextResponse,
} from "../../../core/types";
import { ContextExtractor } from "../utils/context-extractor";
import html2canvas from "html2canvas";

/**
 * WebSocket-based context provider for real-time updates
 */
export class WSContextProvider implements EventContextProvider {
  private config: ContextProviderConfig;
  private ws: WebSocket | null = null;
  private contextChangeCallbacks: Array<(context: PageContext) => void> = [];
  private isMonitoring = false;
  private monitoringInterval: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(config: ContextProviderConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || "ws://localhost:8000",
      authHeaders: config.authHeaders || {},
      whitelistedPages: config.whitelistedPages || [],
      enableScreenshots: config.enableScreenshots ?? false,
      screenshotOptions: config.screenshotOptions || {},
    };

    this.connect();
  }

  /**
   * Get current page context
   */
  async getCurrentContext(): Promise<PageContext> {
    const context = ContextExtractor.extractContext();

    // Send context via WebSocket if connected
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendMessage("context", context);
    }

    return context;
  }

  /**
   * Get screenshot of current page
   */
  async getScreenshot(options?: ScreenshotOptions): Promise<string> {
    if (!this.isScreenshotAllowed()) {
      throw new Error("Screenshots not allowed for this page");
    }

    try {
      console.log(
        "📸 Capturing screenshot with html2canvas (WebSocket provider)..."
      );

      // Use html2canvas to capture the current page
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: false,
        scale: options?.scale || 0.5, // Reduce scale for smaller file size
        width: options?.width || window.innerWidth,
        height: options?.height || window.innerHeight,
        backgroundColor: null, // Transparent background
        removeContainer: true,
        logging: false, // Disable html2canvas logging
      });

      // Convert to base64 string (without data URL prefix)
      const dataUrl = canvas.toDataURL(
        options?.format || "image/png",
        options?.quality || 0.8
      );

      // Remove the data URL prefix to get just the base64 data
      const base64Data = dataUrl.split(",")[1];
      console.log(
        "✅ Screenshot captured (WebSocket), size:",
        Math.round(base64Data.length / 1024),
        "KB"
      );

      // Send screenshot via WebSocket
      try {
        this.sendMessage("screenshot", {
          screenshot: base64Data,
          url: window.location.href,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.warn("Failed to send screenshot via WebSocket:", error);
      }

      return base64Data;
    } catch (error) {
      console.error("❌ Screenshot capture failed (WebSocket):", error);
      throw new Error(
        `Screenshot capture failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get both context and screenshot
   */
  async getContextWithScreenshot(
    options?: ScreenshotOptions
  ): Promise<ContextResponse> {
    const context = await this.getCurrentContext();
    let screenshot: string | undefined;

    if (this.isScreenshotAllowed()) {
      try {
        screenshot = await this.getScreenshot(options);
      } catch (error) {
        console.warn("Failed to capture screenshot:", error);
      }
    }

    return { context, screenshot };
  }

  /**
   * Check if screenshots are allowed for current page
   */
  isScreenshotAllowed(): boolean {
    if (!this.config.enableScreenshots) {
      return false;
    }

    if (
      this.config.whitelistedPages &&
      this.config.whitelistedPages.length > 0
    ) {
      const currentUrl = window.location.href;
      return this.config.whitelistedPages.some((pattern) => {
        return (
          currentUrl.includes(pattern) || new RegExp(pattern).test(currentUrl)
        );
      });
    }

    return true;
  }

  /**
   * Subscribe to context changes
   */
  onContextChange(callback: (context: PageContext) => void): () => void {
    this.contextChangeCallbacks.push(callback);

    return () => {
      const index = this.contextChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.contextChangeCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Start monitoring for context changes
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    let lastContext = JSON.stringify(ContextExtractor.extractContext());

    this.monitoringInterval = window.setInterval(async () => {
      try {
        const currentContext = ContextExtractor.extractContext();
        const currentContextStr = JSON.stringify(currentContext);

        if (currentContextStr !== lastContext) {
          lastContext = currentContextStr;

          // Notify all callbacks
          this.contextChangeCallbacks.forEach((callback) => {
            try {
              callback(currentContext);
            } catch (error) {
              console.error("Error in context change callback:", error);
            }
          });

          // Send to WebSocket if connected
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.sendMessage("context_change", currentContext);
          }
        }
      } catch (error) {
        console.error("Error monitoring context changes:", error);
      }
    }, 1000); // Check every second
  }

  /**
   * Stop monitoring for context changes
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Connect to WebSocket
   */
  private connect(): void {
    try {
      const wsUrl = this.config.baseUrl!.replace(/^http/, "ws") + "/ws";
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("WebSocket connected");
        this.reconnectAttempts = 0;

        // Send auth headers if provided
        if (Object.keys(this.config.authHeaders!).length > 0) {
          this.sendMessage("auth", this.config.authHeaders);
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      this.ws.onclose = () => {
        console.log("WebSocket disconnected");
        this.ws = null;
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    } catch (error) {
      console.error("Failed to connect WebSocket:", error);
      this.attemptReconnect();
    }
  }

  /**
   * Attempt to reconnect WebSocket
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(
      `Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`
    );

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Send message via WebSocket
   */
  private sendMessage(type: string, data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data, timestamp: Date.now() }));
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: any): void {
    switch (message.type) {
      case "ping":
        this.sendMessage("pong", {});
        break;
      case "context_request":
        this.getCurrentContext().then((context) => {
          this.sendMessage("context_response", context);
        });
        break;
      default:
        // Handle other message types as needed
        break;
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopMonitoring();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.contextChangeCallbacks = [];
  }
}
