/**
 * Context Bridge Frontend SDK - Local copy for example
 *
 * In a real project, you would install this as:
 * npm install @context-bridge/frontend
 */

// Direct imports to avoid circular dependency issues
export { RESTContextProvider } from "../../../../../frontend/src/providers/rest-provider";
export { WSContextProvider } from "../../../../../frontend/src/providers/websocket-provider";
export { ContextExtractor } from "../../../../../frontend/src/utils/context-extractor";

// Type exports
export type {
  ContextProvider,
  EventContextProvider,
} from "../../../../../frontend/src/interfaces";

export type {
  PageContext,
  ScreenshotOptions,
  ContextProviderConfig,
  ContextResponse,
  FormData,
  InputData,
  Instruction,
} from "../../../../../core/types";

// Factory function
import { RESTContextProvider } from "../../../../../frontend/src/providers/rest-provider";
import { WSContextProvider } from "../../../../../frontend/src/providers/websocket-provider";
import type { ContextProvider } from "../../../../../frontend/src/interfaces";
import type { ContextProviderConfig } from "../../../../../core/types";

export function createContextProvider(
  type: "rest" | "websocket",
  config?: ContextProviderConfig
): ContextProvider {
  switch (type) {
    case "rest":
      return new RESTContextProvider(config);
    case "websocket":
      return new WSContextProvider(config);
    default:
      throw new Error(`Unknown provider type: ${type}`);
  }
}
