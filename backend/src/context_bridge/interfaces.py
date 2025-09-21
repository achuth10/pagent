"""
Core interfaces for Context Bridge backend
"""

from abc import ABC, abstractmethod
from typing import Optional
from .types import PageContext, ScreenshotOptions, ContextResponse


class ContextProvider(ABC):
    """
    Abstract base class for context providers

    This interface allows backend/agent code to fetch page context
    and screenshots in a transport-agnostic way.
    """

    @abstractmethod
    async def get_current_context(self, url: Optional[str] = None) -> PageContext:
        """
        Get the current page context

        Args:
            url: Optional URL to get context for (if not provided, uses last known)

        Returns:
            PageContext object containing page information
        """
        pass

    @abstractmethod
    async def get_screenshot(
        self, url: Optional[str] = None, options: Optional[ScreenshotOptions] = None
    ) -> str:
        """
        Get a screenshot of the page

        Args:
            url: Optional URL to screenshot (if not provided, uses last known)
            options: Screenshot options

        Returns:
            Base64 encoded screenshot
        """
        pass

    async def get_context_with_screenshot(
        self, url: Optional[str] = None, options: Optional[ScreenshotOptions] = None
    ) -> ContextResponse:
        """
        Get both context and screenshot in one call

        Args:
            url: Optional URL to get context/screenshot for
            options: Screenshot options

        Returns:
            ContextResponse with both context and screenshot
        """
        context = await self.get_current_context(url)
        screenshot = None

        try:
            screenshot = await self.get_screenshot(url, options)
        except Exception as e:
            # Log warning but don't fail the entire request
            print(f"Warning: Failed to capture screenshot: {e}")

        return ContextResponse(context=context, screenshot=screenshot)

    @abstractmethod
    def is_screenshot_allowed(self, url: str) -> bool:
        """
        Check if screenshots are allowed for the given URL

        Args:
            url: URL to check

        Returns:
            True if screenshots are allowed
        """
        pass

    def cleanup(self) -> None:
        """
        Cleanup resources (optional override)
        """
        pass
