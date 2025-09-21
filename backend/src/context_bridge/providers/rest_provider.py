"""
REST-based context provider for backend
"""

import asyncio
import base64
import json
from typing import Optional, Dict, Any
import aiohttp
from urllib.parse import urljoin

from ..interfaces import ContextProvider
from ..types import (
    PageContext,
    ScreenshotOptions,
    ContextProviderConfig,
    DOMData,
    ViewportData,
    FormData,
    InputData,
)


class RESTContextProvider(ContextProvider):
    """
    REST-based context provider that communicates with frontend via HTTP
    """

    def __init__(self, config: ContextProviderConfig):
        self.config = config
        self.session: Optional[aiohttp.ClientSession] = None
        self.last_known_url: Optional[str] = None

    async def _ensure_session(self) -> aiohttp.ClientSession:
        """Ensure HTTP session is created"""
        if self.session is None or self.session.closed:
            timeout = aiohttp.ClientTimeout(total=self.config.timeout)
            self.session = aiohttp.ClientSession(
                headers=self.config.auth_headers, timeout=timeout
            )
        return self.session

    async def get_current_context(self, url: Optional[str] = None) -> PageContext:
        """
        Get current page context from frontend

        Args:
            url: Optional URL to get context for

        Returns:
            PageContext object
        """
        if not self.config.base_url:
            raise ValueError("base_url is required for REST provider")

        session = await self._ensure_session()
        endpoint = urljoin(self.config.base_url, "/current-context")

        try:
            payload = {}
            if url:
                payload["url"] = url
                self.last_known_url = url

            async with session.get(endpoint, params=payload) as response:
                response.raise_for_status()
                data = await response.json()

                # Update last known URL from response
                if "url" in data:
                    self.last_known_url = data["url"]

                return self._parse_context(data)

        except aiohttp.ClientError as e:
            raise RuntimeError(f"Failed to fetch context: {e}")

    async def get_screenshot(
        self, url: Optional[str] = None, options: Optional[ScreenshotOptions] = None
    ) -> str:
        """
        Get screenshot from frontend

        Args:
            url: Optional URL to screenshot
            options: Screenshot options

        Returns:
            Base64 encoded screenshot
        """
        if not self.config.base_url:
            raise ValueError("base_url is required for REST provider")

        target_url = url or self.last_known_url
        if not target_url:
            raise ValueError("No URL provided and no last known URL")

        if not self.is_screenshot_allowed(target_url):
            raise PermissionError(f"Screenshots not allowed for URL: {target_url}")

        session = await self._ensure_session()
        endpoint = urljoin(self.config.base_url, "/screenshot")

        try:
            payload = {
                "url": target_url,
                "options": self._serialize_screenshot_options(options),
            }

            async with session.post(endpoint, json=payload) as response:
                response.raise_for_status()
                data = await response.json()

                if "screenshot" not in data:
                    raise RuntimeError("No screenshot data in response")

                return data["screenshot"]

        except aiohttp.ClientError as e:
            raise RuntimeError(f"Failed to capture screenshot: {e}")

    def is_screenshot_allowed(self, url: str) -> bool:
        """
        Check if screenshots are allowed for the given URL

        Args:
            url: URL to check

        Returns:
            True if screenshots are allowed
        """
        if not self.config.enable_screenshots:
            return False

        if not self.config.whitelisted_pages:
            return True

        # Check against whitelist patterns
        for pattern in self.config.whitelisted_pages:
            if pattern in url:
                return True
            # Could add regex matching here if needed

        return False

    def _parse_context(self, data: Dict[str, Any]) -> PageContext:
        """Parse context data from API response"""

        # Parse DOM data
        dom_data = None
        if "dom" in data and data["dom"]:
            dom_raw = data["dom"]

            # Parse forms
            forms = []
            if "forms" in dom_raw:
                for form_data in dom_raw["forms"]:
                    fields = [
                        InputData(**field) for field in form_data.get("fields", [])
                    ]
                    forms.append(
                        FormData(
                            id=form_data.get("id"),
                            name=form_data.get("name"),
                            action=form_data.get("action"),
                            method=form_data.get("method"),
                            fields=fields,
                        )
                    )

            # Parse inputs
            inputs = []
            if "inputs" in dom_raw:
                inputs = [InputData(**input_data) for input_data in dom_raw["inputs"]]

            dom_data = DOMData(
                text=dom_raw.get("text", ""),
                html=dom_raw.get("html"),
                forms=forms,
                inputs=inputs,
            )

        # Parse viewport data
        viewport_data = None
        if "viewport" in data and data["viewport"]:
            viewport_raw = data["viewport"]
            viewport_data = ViewportData(
                width=viewport_raw.get("width", 0),
                height=viewport_raw.get("height", 0),
                scroll_x=viewport_raw.get("scrollX", 0),
                scroll_y=viewport_raw.get("scrollY", 0),
            )

        return PageContext(
            url=data["url"],
            title=data["title"],
            timestamp=data["timestamp"],
            dom=dom_data,
            viewport=viewport_data,
            metadata=data.get("metadata", {}),
        )

    def _serialize_screenshot_options(
        self, options: Optional[ScreenshotOptions]
    ) -> Dict[str, Any]:
        """Serialize screenshot options for API"""
        if not options:
            options = self.config.screenshot_options

        return {
            "format": options.format,
            "quality": options.quality,
            "fullPage": options.full_page,
            "clip": options.clip,
        }

    async def cleanup(self) -> None:
        """Cleanup HTTP session"""
        if self.session and not self.session.closed:
            await self.session.close()


# Utility functions for MCP/LangChain integration
async def get_page_context(
    base_url: str,
    url: Optional[str] = None,
    auth_headers: Optional[Dict[str, str]] = None,
) -> PageContext:
    """
    Utility function for direct context fetching
    Compatible with MCP tools and LangChain functions
    """
    config = ContextProviderConfig(base_url=base_url, auth_headers=auth_headers or {})

    provider = RESTContextProvider(config)
    try:
        return await provider.get_current_context(url)
    finally:
        await provider.cleanup()


async def get_page_screenshot(
    base_url: str,
    url: Optional[str] = None,
    auth_headers: Optional[Dict[str, str]] = None,
    options: Optional[ScreenshotOptions] = None,
    whitelisted_pages: Optional[list] = None,
) -> str:
    """
    Utility function for direct screenshot capture
    Compatible with MCP tools and LangChain functions
    """
    config = ContextProviderConfig(
        base_url=base_url,
        auth_headers=auth_headers or {},
        enable_screenshots=True,
        whitelisted_pages=whitelisted_pages or [],
        screenshot_options=options or ScreenshotOptions(),
    )

    provider = RESTContextProvider(config)
    try:
        return await provider.get_screenshot(url, options)
    finally:
        await provider.cleanup()
