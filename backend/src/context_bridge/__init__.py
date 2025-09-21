"""
Context Bridge Backend SDK

A Python library that enables agentic systems to fetch live page context
and screenshots from web applications in a secure, transport-agnostic way.
"""

from .interfaces import ContextProvider
from .providers.rest_provider import RESTContextProvider
from .types import (
    PageContext,
    ScreenshotOptions,
    ContextProviderConfig,
    ContextResponse,
)

__version__ = "1.0.0"
__all__ = [
    "ContextProvider",
    "RESTContextProvider",
    "PageContext",
    "ScreenshotOptions",
    "ContextProviderConfig",
    "ContextResponse",
    "create_context_provider",
]


def create_context_provider(
    provider_type: str = "rest", config: ContextProviderConfig = None
) -> ContextProvider:
    """
    Factory function to create context providers

    Args:
        provider_type: Type of provider ('rest' or 'websocket')
        config: Provider configuration

    Returns:
        ContextProvider instance
    """
    if config is None:
        config = ContextProviderConfig()

    if provider_type == "rest":
        return RESTContextProvider(config)
    else:
        raise ValueError(f"Unknown provider type: {provider_type}")
