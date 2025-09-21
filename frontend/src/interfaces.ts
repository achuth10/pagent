import {
  PageContext,
  ScreenshotOptions,
  ContextProviderConfig,
  ContextResponse,
} from "../../core/types";

/**
 * Core interface for context providers
 */
export interface ContextProvider {
  /**
   * Get the current page context
   */
  getCurrentContext(): Promise<PageContext>;

  /**
   * Get a screenshot of the current page (if enabled and whitelisted)
   */
  getScreenshot?(options?: ScreenshotOptions): Promise<string>;

  /**
   * Get both context and screenshot in one call
   */
  getContextWithScreenshot?(
    options?: ScreenshotOptions
  ): Promise<ContextResponse>;

  /**
   * Check if screenshots are enabled for the current page
   */
  isScreenshotAllowed?(): boolean;

  /**
   * Cleanup resources
   */
  destroy?(): void;
}

/**
 * Event-based context provider for real-time updates
 */
export interface EventContextProvider extends ContextProvider {
  /**
   * Subscribe to context changes
   */
  onContextChange(callback: (context: PageContext) => void): () => void;

  /**
   * Start monitoring for context changes
   */
  startMonitoring(): void;

  /**
   * Stop monitoring for context changes
   */
  stopMonitoring(): void;
}
