"""
Type definitions for Context Bridge backend
"""

from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class InputData:
    """Input field data"""

    id: Optional[str] = None
    name: Optional[str] = None
    type: str = "text"
    value: Optional[str] = None
    placeholder: Optional[str] = None
    required: bool = False


@dataclass
class FormData:
    """Form data structure"""

    id: Optional[str] = None
    name: Optional[str] = None
    action: Optional[str] = None
    method: Optional[str] = None
    fields: List[InputData] = field(default_factory=list)


@dataclass
class DOMData:
    """DOM content data"""

    text: str = ""
    html: Optional[str] = None
    forms: List[FormData] = field(default_factory=list)
    inputs: List[InputData] = field(default_factory=list)


@dataclass
class ViewportData:
    """Viewport information"""

    width: int = 0
    height: int = 0
    scroll_x: int = 0
    scroll_y: int = 0


@dataclass
class PageContext:
    """Complete page context data"""

    url: str
    title: str
    timestamp: int
    dom: Optional[DOMData] = None
    viewport: Optional[ViewportData] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ScreenshotOptions:
    """Screenshot capture options"""

    format: str = "png"  # png, jpeg, webp
    quality: float = 0.8
    full_page: bool = False
    clip: Optional[Dict[str, int]] = None  # {x, y, width, height}


@dataclass
class ContextProviderConfig:
    """Configuration for context providers"""

    base_url: Optional[str] = None
    auth_headers: Dict[str, str] = field(default_factory=dict)
    whitelisted_pages: List[str] = field(default_factory=list)
    enable_screenshots: bool = False
    screenshot_options: ScreenshotOptions = field(default_factory=ScreenshotOptions)
    timeout: int = 30  # seconds


@dataclass
class ContextResponse:
    """Response containing context and optional screenshot"""

    context: PageContext
    screenshot: Optional[str] = None  # base64 encoded
