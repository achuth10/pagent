import { PageContext, FormData, InputData } from "../../../core/types";

/**
 * Utility class for extracting page context from the DOM
 */
export class ContextExtractor {
  /**
   * Extract current page context
   */
  static extractContext(): PageContext {
    const context: PageContext = {
      url: window.location.href,
      title: document.title,
      timestamp: Date.now(),
      dom: {
        text: this.extractText(),
        html: this.extractHTML(),
        forms: this.extractForms(),
        inputs: this.extractInputs(),
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
      },
      metadata: this.extractMetadata(),
    };

    // Clean the context to remove any circular references
    return this.cleanContextForSerialization(context);
  }

  /**
   * Clean context object to remove circular references and non-serializable data
   */
  private static cleanContextForSerialization(
    context: PageContext
  ): PageContext {
    try {
      // Use JSON.parse(JSON.stringify()) to remove circular references
      // This will also remove functions and other non-serializable data
      const cleaned = JSON.parse(
        JSON.stringify(context, (key, value) => {
          // Skip React internal properties and DOM references
          if (
            key.startsWith("__react") ||
            key.startsWith("_react") ||
            key === "stateNode"
          ) {
            return undefined;
          }
          // Skip functions
          if (typeof value === "function") {
            return undefined;
          }
          // Skip DOM nodes (but keep their string representations)
          if (value instanceof Node) {
            return undefined;
          }
          return value;
        })
      );

      return cleaned;
    } catch (error) {
      console.warn("Failed to clean context for serialization:", error);
      // Return a minimal safe context if cleaning fails
      return {
        url: context.url,
        title: context.title,
        timestamp: context.timestamp,
        dom: {
          text: context.dom?.text || "",
          html: undefined,
          forms: [],
          inputs: [],
        },
        viewport: context.viewport,
        metadata: { error: "Context cleaning failed" },
      };
    }
  }

  /**
   * Extract visible text content
   */
  private static extractText(): string {
    // Get all text content, excluding script and style tags
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;

          const tagName = parent.tagName.toLowerCase();
          if (["script", "style", "noscript"].includes(tagName)) {
            return NodeFilter.FILTER_REJECT;
          }

          // Skip hidden elements
          const style = window.getComputedStyle(parent);
          if (style.display === "none" || style.visibility === "hidden") {
            return NodeFilter.FILTER_REJECT;
          }

          return NodeFilter.FILTER_ACCEPT;
        },
      }
    );

    const textNodes: string[] = [];
    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent?.trim();
      if (text && text.length > 0) {
        textNodes.push(text);
      }
    }

    return textNodes.join(" ").replace(/\s+/g, " ").trim();
  }

  /**
   * Extract HTML content (sanitized)
   */
  private static extractHTML(): string {
    // Clone the document to avoid modifying the original
    const clone = document.documentElement.cloneNode(true) as HTMLElement;

    // Remove script and style tags
    const scriptsAndStyles = clone.querySelectorAll("script, style, noscript");
    scriptsAndStyles.forEach((el) => el.remove());

    // Remove sensitive attributes
    const allElements = clone.querySelectorAll("*");
    allElements.forEach((el) => {
      // Remove event handlers and sensitive attributes
      const sensitiveAttrs = ["onclick", "onload", "onerror", "onsubmit"];
      sensitiveAttrs.forEach((attr) => el.removeAttribute(attr));
    });

    return clone.outerHTML;
  }

  /**
   * Extract form data
   */
  private static extractForms(): FormData[] {
    const forms = Array.from(document.forms);
    return forms.map((form) => ({
      id: form.id || undefined,
      name: form.name || undefined,
      action: form.action || undefined,
      method: form.method || undefined,
      fields: this.extractFormInputs(form),
    }));
  }

  /**
   * Extract form inputs
   */
  private static extractFormInputs(form: HTMLFormElement): InputData[] {
    const inputs = Array.from(form.elements);
    return inputs
      .filter(
        (
          el
        ): el is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement =>
          el instanceof HTMLInputElement ||
          el instanceof HTMLSelectElement ||
          el instanceof HTMLTextAreaElement
      )
      .map((input) => ({
        id: input.id || undefined,
        name: input.name || undefined,
        type: input.type || "text",
        value: this.getSafeInputValue(input),
        placeholder: "placeholder" in input ? input.placeholder : undefined,
        required: "required" in input ? input.required : false,
      }));
  }

  /**
   * Extract all inputs (not just form inputs)
   */
  private static extractInputs(): InputData[] {
    const inputs = Array.from(
      document.querySelectorAll("input, select, textarea")
    );
    return inputs.map((input) => ({
      id: input.id || undefined,
      name: input.getAttribute("name") || undefined,
      type: input.getAttribute("type") || "text",
      value: this.getSafeInputValue(input),
      placeholder: input.getAttribute("placeholder") || undefined,
      required: input.hasAttribute("required"),
    }));
  }

  /**
   * Get safe input value (excluding sensitive fields)
   */
  private static getSafeInputValue(input: Element): string | undefined {
    const type = input.getAttribute("type")?.toLowerCase();
    const name = input.getAttribute("name")?.toLowerCase();
    const id = input.getAttribute("id")?.toLowerCase();

    // Skip sensitive input types
    const sensitiveTypes = ["password", "hidden"];
    if (type && sensitiveTypes.includes(type)) {
      return undefined;
    }

    // Skip inputs with sensitive names/ids
    const sensitiveNames = [
      "password",
      "pass",
      "pwd",
      "secret",
      "token",
      "key",
      "ssn",
      "credit",
      "card",
    ];
    const inputIdentifier = `${name || ""} ${id || ""}`.toLowerCase();
    if (
      sensitiveNames.some((sensitive) => inputIdentifier.includes(sensitive))
    ) {
      return undefined;
    }

    // Safely get value without circular references
    try {
      const inputElement = input as HTMLInputElement;
      return inputElement.value || undefined;
    } catch (error) {
      // If there's any issue accessing the value, return undefined
      return undefined;
    }
  }

  /**
   * Extract page metadata
   */
  private static extractMetadata(): Record<string, any> {
    const metadata: Record<string, any> = {};

    // Meta tags
    const metaTags = Array.from(document.querySelectorAll("meta"));
    metaTags.forEach((meta) => {
      const name = meta.getAttribute("name") || meta.getAttribute("property");
      const content = meta.getAttribute("content");
      if (name && content) {
        metadata[name] = content;
      }
    });

    // Page structure info
    metadata.headings = this.extractHeadings();
    metadata.links = this.extractLinks();
    metadata.images = this.extractImages();

    return metadata;
  }

  /**
   * Extract headings
   */
  private static extractHeadings(): Array<{ level: number; text: string }> {
    const headings = Array.from(
      document.querySelectorAll("h1, h2, h3, h4, h5, h6")
    );
    return headings.map((heading) => ({
      level: parseInt(heading.tagName.charAt(1)),
      text: heading.textContent?.trim() || "",
    }));
  }

  /**
   * Extract links
   */
  private static extractLinks(): Array<{ href: string; text: string }> {
    const links = Array.from(document.querySelectorAll("a[href]"));
    return links.map((link) => ({
      href: link.getAttribute("href") || "",
      text: link.textContent?.trim() || "",
    }));
  }

  /**
   * Extract images
   */
  private static extractImages(): Array<{ src: string; alt: string }> {
    const images = Array.from(document.querySelectorAll("img[src]"));
    return images.map((img) => ({
      src: img.getAttribute("src") || "",
      alt: img.getAttribute("alt") || "",
    }));
  }
}
