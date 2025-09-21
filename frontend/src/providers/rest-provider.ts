import { ContextProvider } from "../interfaces";
import {
  PageContext,
  ScreenshotOptions,
  ContextProviderConfig,
  ContextResponse,
} from "../../../core/types";
import { ContextExtractor } from "../utils/context-extractor";
import html2canvas from "html2canvas";

/**
 * REST-based context provider
 */
export class RESTContextProvider implements ContextProvider {
  private config: ContextProviderConfig;

  constructor(config: ContextProviderConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || "",
      authHeaders: config.authHeaders || {},
      whitelistedPages: config.whitelistedPages || [],
      enableScreenshots: config.enableScreenshots ?? false,
      screenshotOptions: config.screenshotOptions || {},
    };
  }

  /**
   * Get current page context
   */
  async getCurrentContext(): Promise<PageContext> {
    const context = ContextExtractor.extractContext();

    // If baseUrl is provided, send context to backend
    if (this.config.baseUrl) {
      try {
        await this.sendContextToBackend(context);
      } catch (error) {
        console.warn("Failed to send context to backend:", error);
      }
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

    const screenshot = await this.captureScreenshot(options);

    // Send screenshot to backend
    try {
      await this.sendScreenshotToBackend(screenshot);
    } catch (error) {
      console.warn("Failed to send screenshot to backend:", error);
    }

    return screenshot;
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
        // Simple pattern matching - can be enhanced with regex
        return (
          currentUrl.includes(pattern) || new RegExp(pattern).test(currentUrl)
        );
      });
    }

    return true;
  }

  /**
   * Send context to backend endpoint
   */
  private async sendContextToBackend(context: PageContext): Promise<void> {
    const url = `${this.config.baseUrl}/current-context`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.config.authHeaders,
      },
      body: JSON.stringify(context),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  /**
   * Send screenshot to backend endpoint
   */
  private async sendScreenshotToBackend(screenshot: string): Promise<void> {
    const url = `${this.config.baseUrl}/screenshot`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.config.authHeaders,
      },
      body: JSON.stringify({
        screenshot,
        url: window.location.href,
        timestamp: Date.now(),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  /**
   * Capture screenshot using available browser APIs
   */
  private async captureScreenshot(
    options?: ScreenshotOptions
  ): Promise<string> {
    try {
      console.log("📸 Capturing screenshot with html2canvas...");

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
        "✅ Screenshot captured, size:",
        Math.round(base64Data.length / 1024),
        "KB"
      );

      return base64Data;
    } catch (error) {
      console.error("❌ Screenshot capture failed:", error);

      // Fallback: request screenshot from backend
      if (this.config.baseUrl) {
        console.log("🔄 Trying backend screenshot fallback...");
        return await this.requestScreenshotFromBackend(options);
      }

      throw new Error(
        `Screenshot capture failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Request screenshot from backend
   */
  private async requestScreenshotFromBackend(
    options?: ScreenshotOptions
  ): Promise<string> {
    const url = `${this.config.baseUrl}/screenshot`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.config.authHeaders,
      },
      body: JSON.stringify({
        url: window.location.href,
        options: options || this.config.screenshotOptions,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.screenshot;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Nothing to cleanup for REST provider
  }
}
