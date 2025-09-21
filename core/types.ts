/**
 * Core types shared across the context-bridge library
 */

export interface PageContext {
  url: string;
  title: string;
  timestamp: number;
  dom?: {
    text: string;
    html?: string;
    forms?: FormData[];
    inputs?: InputData[];
  };
  viewport?: {
    width: number;
    height: number;
    scrollX: number;
    scrollY: number;
  };
  metadata?: Record<string, any>;
}

export interface FormData {
  id?: string;
  name?: string;
  action?: string;
  method?: string;
  fields: InputData[];
}

export interface InputData {
  id?: string;
  name?: string;
  type: string;
  value?: string;
  placeholder?: string;
  required?: boolean;
}

export interface ScreenshotOptions {
  format?: "png" | "jpeg" | "webp";
  quality?: number;
  fullPage?: boolean;
  clip?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ContextProviderConfig {
  baseUrl?: string;
  authHeaders?: Record<string, string>;
  whitelistedPages?: string[];
  enableScreenshots?: boolean;
  screenshotOptions?: ScreenshotOptions;
}

export interface ContextResponse {
  context: PageContext;
  screenshot?: string; // base64 encoded
}
