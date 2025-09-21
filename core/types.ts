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

/**
 * Instruction types that can be sent from backend to frontend
 */
export type InstructionType =
  | "form_assistance"
  | "navigation_suggestion"
  | "content_instruction"
  | "contextual_notification"
  | "highlight_element"
  | "scroll_to_element"
  | "fill_form_field"
  | "click_element"
  | "show_tooltip"
  | "show_modal"
  | "redirect"
  | "custom";

/**
 * Base instruction interface
 */
export interface BaseInstruction {
  id: string;
  type: InstructionType;
  timestamp: number;
  priority?: "low" | "medium" | "high";
  context?: {
    url?: string;
    pageTitle?: string;
    triggeredBy?: string;
  };
}

/**
 * Form assistance instruction
 */
export interface FormAssistanceInstruction extends BaseInstruction {
  type: "form_assistance";
  data: {
    action:
      | "highlight_field"
      | "validate_field"
      | "suggest_value"
      | "show_error";
    selector: string;
    message: string;
    suggestedValue?: string;
    validationRules?: string[];
  };
}

/**
 * Navigation suggestion instruction
 */
export interface NavigationInstruction extends BaseInstruction {
  type: "navigation_suggestion";
  data: {
    action: "suggest_next_step" | "suggest_alternative" | "warn_navigation";
    url?: string;
    message: string;
    reason?: string;
    confirmRequired?: boolean;
  };
}

/**
 * Content instruction for page interactions
 */
export interface ContentInstruction extends BaseInstruction {
  type: "content_instruction";
  data: {
    action:
      | "show_tooltip"
      | "highlight_section"
      | "add_overlay"
      | "modify_content";
    selector?: string;
    content: string;
    position?: "top" | "bottom" | "left" | "right" | "center";
    duration?: number; // milliseconds
  };
}

/**
 * Contextual notification instruction
 */
export interface ContextualNotification extends BaseInstruction {
  type: "contextual_notification";
  data: {
    message: string;
    notificationType: "info" | "warning" | "error" | "success";
    actions?: Array<{
      label: string;
      action: string;
      data?: any;
    }>;
    autoClose?: boolean;
    duration?: number;
  };
}

/**
 * Element interaction instructions
 */
export interface ElementInstruction extends BaseInstruction {
  type: "highlight_element" | "scroll_to_element" | "click_element";
  data: {
    selector: string;
    message?: string;
    duration?: number;
    smooth?: boolean; // for scroll
  };
}

/**
 * Form field instruction
 */
export interface FormFieldInstruction extends BaseInstruction {
  type: "fill_form_field";
  data: {
    selector: string;
    value: string;
    triggerEvents?: boolean;
    focus?: boolean;
  };
}

/**
 * Modal/Tooltip instruction
 */
export interface ModalInstruction extends BaseInstruction {
  type: "show_tooltip" | "show_modal";
  data: {
    title?: string;
    content: string;
    position?: "top" | "bottom" | "left" | "right" | "center";
    selector?: string; // for tooltips
    actions?: Array<{
      label: string;
      action: string;
      style?: "primary" | "secondary" | "danger";
    }>;
    closable?: boolean;
    autoClose?: boolean;
    duration?: number;
  };
}

/**
 * Redirect instruction
 */
export interface RedirectInstruction extends BaseInstruction {
  type: "redirect";
  data: {
    url: string;
    delay?: number;
    confirmRequired?: boolean;
    message?: string;
  };
}

/**
 * Custom instruction for extensibility
 */
export interface CustomInstruction extends BaseInstruction {
  type: "custom";
  data: {
    customType: string;
    payload: any;
  };
}

/**
 * Union type for all instruction types
 */
export type Instruction =
  | FormAssistanceInstruction
  | NavigationInstruction
  | ContentInstruction
  | ContextualNotification
  | ElementInstruction
  | FormFieldInstruction
  | ModalInstruction
  | RedirectInstruction
  | CustomInstruction;

/**
 * WebSocket message types
 */
export interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp: number;
  id?: string;
}

/**
 * Instruction message from backend to frontend
 */
export interface InstructionMessage extends WebSocketMessage {
  type: "instruction";
  data: Instruction;
}

/**
 * Context analysis result from backend
 */
export interface ContextAnalysis {
  pageType:
    | "form"
    | "checkout"
    | "dashboard"
    | "content"
    | "error"
    | "loading"
    | "unknown";
  userIntent?:
    | "browsing"
    | "purchasing"
    | "form_filling"
    | "searching"
    | "reading";
  issues?: Array<{
    type: "validation" | "usability" | "accessibility" | "performance";
    severity: "low" | "medium" | "high";
    message: string;
    element?: string;
  }>;
  suggestions?: Array<{
    type: "improvement" | "next_step" | "alternative";
    message: string;
    action?: string;
  }>;
  confidence: number; // 0-1
}
