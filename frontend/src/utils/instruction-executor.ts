import {
  Instruction,
  FormAssistanceInstruction,
  NavigationInstruction,
  ContentInstruction,
  ContextualNotification,
  ElementInstruction,
  FormFieldInstruction,
  ModalInstruction,
  RedirectInstruction,
  CustomInstruction,
} from "../../../core/types";

/**
 * Instruction execution result
 */
export interface InstructionResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

/**
 * Instruction executor configuration
 */
export interface InstructionExecutorConfig {
  enableNotifications?: boolean;
  enableRedirects?: boolean;
  enableFormManipulation?: boolean;
  enableDOMManipulation?: boolean;
  notificationContainer?: string; // CSS selector for notification container
  modalContainer?: string; // CSS selector for modal container
  onInstructionExecuted?: (
    instruction: Instruction,
    result: InstructionResult
  ) => void;
  onInstructionFailed?: (instruction: Instruction, error: string) => void;
}

/**
 * Handles execution of instructions received from the backend
 */
export class InstructionExecutor {
  private config: InstructionExecutorConfig;
  private activeNotifications: Map<string, HTMLElement> = new Map();
  private activeModals: Map<string, HTMLElement> = new Map();
  private activeTooltips: Map<string, HTMLElement> = new Map();

  constructor(config: InstructionExecutorConfig = {}) {
    this.config = {
      enableNotifications: true,
      enableRedirects: true,
      enableFormManipulation: true,
      enableDOMManipulation: true,
      notificationContainer: "body",
      modalContainer: "body",
      ...config,
    };

    this.injectStyles();
  }

  /**
   * Execute an instruction
   */
  async executeInstruction(
    instruction: Instruction
  ): Promise<InstructionResult> {
    console.log(`🎯 Executing instruction: ${instruction.type}`, instruction);

    try {
      let result: InstructionResult;

      switch (instruction.type) {
        case "form_assistance":
          result = await this.executeFormAssistance(
            instruction as FormAssistanceInstruction
          );
          break;
        case "navigation_suggestion":
          result = await this.executeNavigation(
            instruction as NavigationInstruction
          );
          break;
        case "content_instruction":
          result = await this.executeContentInstruction(
            instruction as ContentInstruction
          );
          break;
        case "contextual_notification":
          result = await this.executeNotification(
            instruction as ContextualNotification
          );
          break;
        case "highlight_element":
        case "scroll_to_element":
        case "click_element":
          result = await this.executeElementInstruction(
            instruction as ElementInstruction
          );
          break;
        case "fill_form_field":
          result = await this.executeFormField(
            instruction as FormFieldInstruction
          );
          break;
        case "show_tooltip":
        case "show_modal":
          result = await this.executeModal(instruction as ModalInstruction);
          break;
        case "redirect":
          result = await this.executeRedirect(
            instruction as RedirectInstruction
          );
          break;
        case "custom":
          result = await this.executeCustom(instruction as CustomInstruction);
          break;
        default:
          result = {
            success: false,
            error: `Unknown instruction type: ${instruction.type}`,
          };
      }

      if (result.success && this.config.onInstructionExecuted) {
        this.config.onInstructionExecuted(instruction, result);
      } else if (!result.success && this.config.onInstructionFailed) {
        this.config.onInstructionFailed(
          instruction,
          result.error || "Unknown error"
        );
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(
        `❌ Failed to execute instruction ${instruction.type}:`,
        error
      );

      if (this.config.onInstructionFailed) {
        this.config.onInstructionFailed(instruction, errorMessage);
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Execute form assistance instruction
   */
  private async executeFormAssistance(
    instruction: FormAssistanceInstruction
  ): Promise<InstructionResult> {
    if (!this.config.enableFormManipulation) {
      return { success: false, error: "Form manipulation disabled" };
    }

    const element = document.querySelector(instruction.data.selector);
    if (!element) {
      return {
        success: false,
        error: `Element not found: ${instruction.data.selector}`,
      };
    }

    switch (instruction.data.action) {
      case "highlight_field":
        this.highlightElement(
          element as HTMLElement,
          instruction.data.message,
          "warning"
        );
        break;
      case "validate_field":
        this.showFieldValidation(
          element as HTMLElement,
          instruction.data.message,
          false
        );
        break;
      case "suggest_value":
        if (
          instruction.data.suggestedValue &&
          element instanceof HTMLInputElement
        ) {
          element.placeholder = instruction.data.suggestedValue;
          this.showFieldValidation(
            element,
            `Suggested: ${instruction.data.suggestedValue}`,
            true
          );
        }
        break;
      case "show_error":
        this.showFieldValidation(
          element as HTMLElement,
          instruction.data.message,
          false
        );
        break;
    }

    return { success: true, message: "Form assistance applied" };
  }

  /**
   * Execute navigation instruction
   */
  private async executeNavigation(
    instruction: NavigationInstruction
  ): Promise<InstructionResult> {
    if (!this.config.enableRedirects) {
      return { success: false, error: "Navigation disabled" };
    }

    const { action, url, message, confirmRequired } = instruction.data;

    if (confirmRequired && !confirm(message)) {
      return { success: false, message: "Navigation cancelled by user" };
    }

    switch (action) {
      case "suggest_next_step":
        this.showNotification({
          message,
          type: "info",
          actions: url
            ? [{ label: "Go", action: "navigate", data: { url } }]
            : undefined,
        });
        break;
      case "suggest_alternative":
        this.showNotification({
          message,
          type: "info",
          actions: url
            ? [{ label: "Try Alternative", action: "navigate", data: { url } }]
            : undefined,
        });
        break;
      case "warn_navigation":
        this.showNotification({
          message,
          type: "warning",
        });
        break;
    }

    return { success: true, message: "Navigation instruction processed" };
  }

  /**
   * Execute content instruction
   */
  private async executeContentInstruction(
    instruction: ContentInstruction
  ): Promise<InstructionResult> {
    if (!this.config.enableDOMManipulation) {
      return { success: false, error: "DOM manipulation disabled" };
    }

    const { action, selector, content, position, duration } = instruction.data;

    switch (action) {
      case "show_tooltip":
        if (selector) {
          const element = document.querySelector(selector);
          if (element) {
            this.showTooltip(
              element as HTMLElement,
              content,
              position,
              duration
            );
          }
        }
        break;
      case "highlight_section":
        if (selector) {
          const element = document.querySelector(selector);
          if (element) {
            this.highlightElement(
              element as HTMLElement,
              content,
              "info",
              duration
            );
          }
        }
        break;
      case "add_overlay":
        this.showOverlay(content, duration);
        break;
      case "modify_content":
        if (selector) {
          const element = document.querySelector(selector);
          if (element) {
            element.innerHTML = content;
          }
        }
        break;
    }

    return { success: true, message: "Content instruction applied" };
  }

  /**
   * Execute notification instruction
   */
  private async executeNotification(
    instruction: ContextualNotification
  ): Promise<InstructionResult> {
    if (!this.config.enableNotifications) {
      return { success: false, error: "Notifications disabled" };
    }

    this.showNotification({
      message: instruction.data.message,
      type: instruction.data.notificationType,
      actions: instruction.data.actions,
      autoClose: instruction.data.autoClose,
      duration: instruction.data.duration,
    });

    return { success: true, message: "Notification shown" };
  }

  /**
   * Execute element instruction
   */
  private async executeElementInstruction(
    instruction: ElementInstruction
  ): Promise<InstructionResult> {
    const element = document.querySelector(instruction.data.selector);
    if (!element) {
      return {
        success: false,
        error: `Element not found: ${instruction.data.selector}`,
      };
    }

    switch (instruction.type) {
      case "highlight_element":
        this.highlightElement(
          element as HTMLElement,
          instruction.data.message || "Highlighted element",
          "info",
          instruction.data.duration
        );
        break;
      case "scroll_to_element":
        element.scrollIntoView({
          behavior: instruction.data.smooth ? "smooth" : "auto",
          block: "center",
        });
        if (instruction.data.message) {
          this.showTooltip(element as HTMLElement, instruction.data.message);
        }
        break;
      case "click_element":
        if (element instanceof HTMLElement) {
          element.click();
        }
        break;
    }

    return {
      success: true,
      message: `Element instruction ${instruction.type} executed`,
    };
  }

  /**
   * Execute form field instruction
   */
  private async executeFormField(
    instruction: FormFieldInstruction
  ): Promise<InstructionResult> {
    if (!this.config.enableFormManipulation) {
      return { success: false, error: "Form manipulation disabled" };
    }

    const element = document.querySelector(instruction.data.selector);
    if (
      !element ||
      !(
        element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement
      )
    ) {
      return {
        success: false,
        error: `Form field not found: ${instruction.data.selector}`,
      };
    }

    element.value = instruction.data.value;

    if (instruction.data.focus) {
      element.focus();
    }

    if (instruction.data.triggerEvents) {
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
    }

    return { success: true, message: "Form field updated" };
  }

  /**
   * Execute modal instruction
   */
  private async executeModal(
    instruction: ModalInstruction
  ): Promise<InstructionResult> {
    const {
      title,
      content,
      position,
      selector,
      actions,
      closable,
      autoClose,
      duration,
    } = instruction.data;

    if (instruction.type === "show_tooltip" && selector) {
      const element = document.querySelector(selector);
      if (element) {
        this.showTooltip(element as HTMLElement, content, position, duration);
      }
    } else if (instruction.type === "show_modal") {
      this.showModal({
        id: instruction.id,
        title,
        content,
        actions,
        closable,
        autoClose,
        duration,
      });
    }

    return { success: true, message: `${instruction.type} shown` };
  }

  /**
   * Execute redirect instruction
   */
  private async executeRedirect(
    instruction: RedirectInstruction
  ): Promise<InstructionResult> {
    if (!this.config.enableRedirects) {
      return { success: false, error: "Redirects disabled" };
    }

    const { url, delay, confirmRequired, message } = instruction.data;

    if (confirmRequired && message && !confirm(message)) {
      return { success: false, message: "Redirect cancelled by user" };
    }

    const redirect = () => {
      window.location.href = url;
    };

    if (delay && delay > 0) {
      setTimeout(redirect, delay);
    } else {
      redirect();
    }

    return { success: true, message: "Redirect initiated" };
  }

  /**
   * Execute custom instruction
   */
  private async executeCustom(
    instruction: CustomInstruction
  ): Promise<InstructionResult> {
    // Emit custom event for application-specific handling
    const customEvent = new CustomEvent("contextbridge:custom-instruction", {
      detail: {
        instruction,
        executor: this,
      },
    });

    document.dispatchEvent(customEvent);

    return { success: true, message: "Custom instruction dispatched" };
  }

  /**
   * Highlight an element
   */
  private highlightElement(
    element: HTMLElement,
    message: string,
    type: "info" | "warning" | "error" = "info",
    duration?: number
  ): void {
    const highlightClass = `cb-highlight-${type}`;
    element.classList.add(highlightClass);

    if (message) {
      this.showTooltip(element, message, "top", duration);
    }

    if (duration) {
      setTimeout(() => {
        element.classList.remove(highlightClass);
      }, duration);
    }
  }

  /**
   * Show field validation message
   */
  private showFieldValidation(
    element: HTMLElement,
    message: string,
    isValid: boolean
  ): void {
    // Remove existing validation
    const existingValidation = element.parentElement?.querySelector(
      ".cb-field-validation"
    );
    if (existingValidation) {
      existingValidation.remove();
    }

    // Create validation message
    const validationEl = document.createElement("div");
    validationEl.className = `cb-field-validation ${
      isValid ? "cb-valid" : "cb-invalid"
    }`;
    validationEl.textContent = message;

    // Insert after the element
    element.parentElement?.insertBefore(validationEl, element.nextSibling);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      validationEl.remove();
    }, 5000);
  }

  /**
   * Show tooltip
   */
  private showTooltip(
    element: HTMLElement,
    content: string,
    position: string = "top",
    duration?: number
  ): void {
    const tooltipId = `tooltip-${Date.now()}`;

    // Remove existing tooltip for this element
    const existingTooltip = this.activeTooltips.get(
      element.id || element.tagName
    );
    if (existingTooltip) {
      existingTooltip.remove();
    }

    const tooltip = document.createElement("div");
    tooltip.className = `cb-tooltip cb-tooltip-${position}`;
    tooltip.textContent = content;
    tooltip.id = tooltipId;

    // Position tooltip
    const rect = element.getBoundingClientRect();
    tooltip.style.position = "fixed";
    tooltip.style.zIndex = "10000";

    document.body.appendChild(tooltip);

    // Calculate position
    const tooltipRect = tooltip.getBoundingClientRect();
    let top: number, left: number;

    switch (position) {
      case "top":
        top = rect.top - tooltipRect.height - 8;
        left = rect.left + (rect.width - tooltipRect.width) / 2;
        break;
      case "bottom":
        top = rect.bottom + 8;
        left = rect.left + (rect.width - tooltipRect.width) / 2;
        break;
      case "left":
        top = rect.top + (rect.height - tooltipRect.height) / 2;
        left = rect.left - tooltipRect.width - 8;
        break;
      case "right":
        top = rect.top + (rect.height - tooltipRect.height) / 2;
        left = rect.right + 8;
        break;
      default:
        top = rect.top - tooltipRect.height - 8;
        left = rect.left + (rect.width - tooltipRect.width) / 2;
    }

    tooltip.style.top = `${Math.max(8, top)}px`;
    tooltip.style.left = `${Math.max(8, left)}px`;

    this.activeTooltips.set(element.id || element.tagName, tooltip);

    // Auto-remove
    const removeTooltip = () => {
      tooltip.remove();
      this.activeTooltips.delete(element.id || element.tagName);
    };

    if (duration) {
      setTimeout(removeTooltip, duration);
    } else {
      setTimeout(removeTooltip, 3000); // Default 3 seconds
    }

    // Remove on click outside
    const clickHandler = (e: Event) => {
      if (
        !tooltip.contains(e.target as Node) &&
        !element.contains(e.target as Node)
      ) {
        removeTooltip();
        document.removeEventListener("click", clickHandler);
      }
    };
    document.addEventListener("click", clickHandler);
  }

  /**
   * Show notification
   */
  private showNotification(options: {
    message: string;
    type: "info" | "warning" | "error" | "success";
    actions?: Array<{ label: string; action: string; data?: any }>;
    autoClose?: boolean;
    duration?: number;
  }): void {
    const notificationId = `notification-${Date.now()}`;
    const notification = document.createElement("div");
    notification.className = `cb-notification cb-notification-${options.type}`;
    notification.id = notificationId;

    const content = document.createElement("div");
    content.className = "cb-notification-content";
    content.textContent = options.message;
    notification.appendChild(content);

    if (options.actions) {
      const actionsContainer = document.createElement("div");
      actionsContainer.className = "cb-notification-actions";

      options.actions.forEach((action) => {
        const button = document.createElement("button");
        button.textContent = action.label;
        button.className = "cb-notification-action";
        button.onclick = () =>
          this.handleNotificationAction(action, notificationId);
        actionsContainer.appendChild(button);
      });

      notification.appendChild(actionsContainer);
    }

    // Add close button
    const closeButton = document.createElement("button");
    closeButton.innerHTML = "×";
    closeButton.className = "cb-notification-close";
    closeButton.onclick = () => this.removeNotification(notificationId);
    notification.appendChild(closeButton);

    // Add to container
    const container =
      document.querySelector(this.config.notificationContainer!) ||
      document.body;
    container.appendChild(notification);

    this.activeNotifications.set(notificationId, notification);

    // Auto-close
    if (options.autoClose !== false) {
      const duration = options.duration || 5000;
      setTimeout(() => this.removeNotification(notificationId), duration);
    }
  }

  /**
   * Show modal
   */
  private showModal(options: {
    id: string;
    title?: string;
    content: string;
    actions?: Array<{ label: string; action: string; style?: string }>;
    closable?: boolean;
    autoClose?: boolean;
    duration?: number;
  }): void {
    const modal = document.createElement("div");
    modal.className = "cb-modal-overlay";
    modal.id = `modal-${options.id}`;

    const modalContent = document.createElement("div");
    modalContent.className = "cb-modal-content";

    if (options.title) {
      const title = document.createElement("h3");
      title.className = "cb-modal-title";
      title.textContent = options.title;
      modalContent.appendChild(title);
    }

    const content = document.createElement("div");
    content.className = "cb-modal-body";
    content.innerHTML = options.content;
    modalContent.appendChild(content);

    if (options.actions) {
      const actionsContainer = document.createElement("div");
      actionsContainer.className = "cb-modal-actions";

      options.actions.forEach((action) => {
        const button = document.createElement("button");
        button.textContent = action.label;
        button.className = `cb-modal-action ${
          action.style ? `cb-${action.style}` : ""
        }`;
        button.onclick = () => this.handleModalAction(action, options.id);
        actionsContainer.appendChild(button);
      });

      modalContent.appendChild(actionsContainer);
    }

    if (options.closable !== false) {
      const closeButton = document.createElement("button");
      closeButton.innerHTML = "×";
      closeButton.className = "cb-modal-close";
      closeButton.onclick = () => this.removeModal(options.id);
      modalContent.appendChild(closeButton);
    }

    modal.appendChild(modalContent);

    // Add to container
    const container =
      document.querySelector(this.config.modalContainer!) || document.body;
    container.appendChild(modal);

    this.activeModals.set(options.id, modal);

    // Auto-close
    if (options.autoClose && options.duration) {
      setTimeout(() => this.removeModal(options.id), options.duration);
    }

    // Close on overlay click
    modal.onclick = (e) => {
      if (e.target === modal && options.closable !== false) {
        this.removeModal(options.id);
      }
    };
  }

  /**
   * Show overlay
   */
  private showOverlay(content: string, duration?: number): void {
    const overlay = document.createElement("div");
    overlay.className = "cb-overlay";
    overlay.innerHTML = content;

    document.body.appendChild(overlay);

    if (duration) {
      setTimeout(() => overlay.remove(), duration);
    }
  }

  /**
   * Handle notification action
   */
  private handleNotificationAction(
    action: { label: string; action: string; data?: any },
    notificationId: string
  ): void {
    switch (action.action) {
      case "navigate":
        if (action.data?.url) {
          window.location.href = action.data.url;
        }
        break;
      case "dismiss":
        this.removeNotification(notificationId);
        break;
      default:
        // Emit custom event
        document.dispatchEvent(
          new CustomEvent("contextbridge:notification-action", {
            detail: { action, notificationId },
          })
        );
    }

    this.removeNotification(notificationId);
  }

  /**
   * Handle modal action
   */
  private handleModalAction(
    action: { label: string; action: string; style?: string },
    modalId: string
  ): void {
    // Emit custom event
    document.dispatchEvent(
      new CustomEvent("contextbridge:modal-action", {
        detail: { action, modalId },
      })
    );

    this.removeModal(modalId);
  }

  /**
   * Remove notification
   */
  private removeNotification(id: string): void {
    const notification = this.activeNotifications.get(id);
    if (notification) {
      notification.remove();
      this.activeNotifications.delete(id);
    }
  }

  /**
   * Remove modal
   */
  private removeModal(id: string): void {
    const modal = this.activeModals.get(id);
    if (modal) {
      modal.remove();
      this.activeModals.delete(id);
    }
  }

  /**
   * Inject required CSS styles
   */
  private injectStyles(): void {
    if (document.getElementById("cb-instruction-styles")) return;

    const styles = document.createElement("style");
    styles.id = "cb-instruction-styles";
    styles.textContent = `
      /* Highlight styles */
      .cb-highlight-info {
        outline: 2px solid #2196F3 !important;
        outline-offset: 2px !important;
        background-color: rgba(33, 150, 243, 0.1) !important;
      }
      
      .cb-highlight-warning {
        outline: 2px solid #FF9800 !important;
        outline-offset: 2px !important;
        background-color: rgba(255, 152, 0, 0.1) !important;
      }
      
      .cb-highlight-error {
        outline: 2px solid #F44336 !important;
        outline-offset: 2px !important;
        background-color: rgba(244, 67, 54, 0.1) !important;
      }

      /* Field validation */
      .cb-field-validation {
        font-size: 12px;
        margin-top: 4px;
        padding: 4px 8px;
        border-radius: 4px;
      }
      
      .cb-valid {
        color: #4CAF50;
        background-color: rgba(76, 175, 80, 0.1);
        border: 1px solid #4CAF50;
      }
      
      .cb-invalid {
        color: #F44336;
        background-color: rgba(244, 67, 54, 0.1);
        border: 1px solid #F44336;
      }

      /* Tooltip styles */
      .cb-tooltip {
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 14px;
        max-width: 250px;
        word-wrap: break-word;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        animation: cbFadeIn 0.2s ease-in;
      }

      /* Notification styles */
      .cb-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        max-width: 400px;
        padding: 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        animation: cbSlideIn 0.3s ease-out;
      }
      
      .cb-notification-info {
        background: #2196F3;
        color: white;
      }
      
      .cb-notification-warning {
        background: #FF9800;
        color: white;
      }
      
      .cb-notification-error {
        background: #F44336;
        color: white;
      }
      
      .cb-notification-success {
        background: #4CAF50;
        color: white;
      }
      
      .cb-notification-content {
        margin-bottom: 8px;
      }
      
      .cb-notification-actions {
        display: flex;
        gap: 8px;
        margin-top: 12px;
      }
      
      .cb-notification-action {
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: white;
        padding: 4px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      }
      
      .cb-notification-action:hover {
        background: rgba(255, 255, 255, 0.3);
      }
      
      .cb-notification-close {
        position: absolute;
        top: 8px;
        right: 8px;
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      /* Modal styles */
      .cb-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: cbFadeIn 0.3s ease-out;
      }
      
      .cb-modal-content {
        background: white;
        border-radius: 8px;
        padding: 24px;
        max-width: 500px;
        max-height: 80vh;
        overflow-y: auto;
        position: relative;
        animation: cbScaleIn 0.3s ease-out;
      }
      
      .cb-modal-title {
        margin: 0 0 16px 0;
        font-size: 18px;
        font-weight: 600;
      }
      
      .cb-modal-body {
        margin-bottom: 16px;
        line-height: 1.5;
      }
      
      .cb-modal-actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }
      
      .cb-modal-action {
        padding: 8px 16px;
        border-radius: 4px;
        border: 1px solid #ddd;
        background: white;
        cursor: pointer;
      }
      
      .cb-primary {
        background: #2196F3;
        color: white;
        border-color: #2196F3;
      }
      
      .cb-secondary {
        background: #f5f5f5;
        color: #333;
      }
      
      .cb-danger {
        background: #F44336;
        color: white;
        border-color: #F44336;
      }
      
      .cb-modal-close {
        position: absolute;
        top: 16px;
        right: 16px;
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
      }

      /* Overlay styles */
      .cb-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        font-size: 18px;
        text-align: center;
        padding: 20px;
      }

      /* Animations */
      @keyframes cbFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes cbSlideIn {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
      }
      
      @keyframes cbScaleIn {
        from { transform: scale(0.9); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
    `;

    document.head.appendChild(styles);
  }

  /**
   * Clean up all active elements
   */
  cleanup(): void {
    // Remove all active notifications
    this.activeNotifications.forEach((notification) => notification.remove());
    this.activeNotifications.clear();

    // Remove all active modals
    this.activeModals.forEach((modal) => modal.remove());
    this.activeModals.clear();

    // Remove all active tooltips
    this.activeTooltips.forEach((tooltip) => tooltip.remove());
    this.activeTooltips.clear();

    // Remove injected styles
    const styles = document.getElementById("cb-instruction-styles");
    if (styles) {
      styles.remove();
    }
  }
}
