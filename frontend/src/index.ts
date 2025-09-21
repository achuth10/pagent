/**
 * Context Bridge Frontend SDK
 *
 * A unified library for web apps that enables agentic systems to fetch
 * live page context and optionally screenshots in a secure, opt-in way.
 */

// Core interfaces and types
export { ContextProvider, EventContextProvider } from "./interfaces";
export * from "../../core/types";

// Provider implementations
export { RESTContextProvider } from "./providers/rest-provider";
export { WSContextProvider } from "./providers/websocket-provider";

// Utilities
export { ContextExtractor } from "./utils/context-extractor";

// Factory function for easy provider creation
export function createContextProvider(
  type: "rest" | "websocket",
  config?: import("../../core/types").ContextProviderConfig
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

// Default export for convenience
export default {
  RESTContextProvider,
  WSContextProvider,
  ContextExtractor,
  createContextProvider,
};
