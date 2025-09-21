"""
Type definitions for Context Bridge backend
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field


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


@dataclass
class ContextAnalysisIssue:
    """Issue identified in context analysis"""

    type: str  # validation, usability, accessibility, performance
    severity: str  # low, medium, high
    message: str
    element: Optional[str] = None


@dataclass
class ContextAnalysisSuggestion:
    """Suggestion from context analysis"""

    type: str  # improvement, next_step, alternative
    message: str
    action: Optional[str] = None


@dataclass
class ContextAnalysis:
    """Result of context analysis"""

    pageType: str  # form, checkout, dashboard, content, error, loading, unknown
    userIntent: Optional[str] = (
        None  # browsing, purchasing, form_filling, searching, reading
    )
    issues: List[ContextAnalysisIssue] = field(default_factory=list)
    suggestions: List[ContextAnalysisSuggestion] = field(default_factory=list)
    confidence: float = 0.0  # 0-1


# Instruction types for backend-to-frontend communication
# Using Dict[str, Any] for simplicity to match the existing implementation
InstructionDict = Dict[str, Any]


@dataclass
class WebSocketMessage:
    """WebSocket message types"""

    type: str
    data: Optional[Any] = None
    timestamp: int = 0
    id: Optional[str] = None


@dataclass
class InstructionMessage(WebSocketMessage):
    """Instruction message from backend to frontend"""

    type: str = "instruction"
    data: Optional[Dict[str, Any]] = None
