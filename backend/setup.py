"""
Setup script for Context Bridge Backend SDK
"""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="context-bridge-backend",
    version="1.0.0",
    author="Context Bridge Team",
    author_email="team@context-bridge.dev",
    description="Backend SDK for Context Bridge - enables agentic systems to fetch live page context and screenshots",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/context-bridge/context-bridge",
    project_urls={
        "Bug Tracker": "https://github.com/context-bridge/context-bridge/issues",
        "Documentation": "https://github.com/context-bridge/context-bridge#readme",
        "Source Code": "https://github.com/context-bridge/context-bridge",
    },
    package_dir={"": "src"},
    packages=find_packages(where="src"),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Internet :: WWW/HTTP",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "Topic :: System :: Monitoring",
    ],
    python_requires=">=3.8",
    install_requires=[
        "aiohttp>=3.8.0",
        "asyncio",
    ],
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pytest-asyncio>=0.21.0",
            "black>=23.0.0",
            "isort>=5.12.0",
            "mypy>=1.0.0",
            "flake8>=6.0.0",
        ],
        "fastapi": [
            "fastapi>=0.100.0",
            "uvicorn>=0.23.0",
        ],
        "langchain": [
            "langchain>=0.1.0",
        ],
    },
    keywords=[
        "context",
        "bridge",
        "agent",
        "screenshot",
        "dom",
        "websocket",
        "rest",
        "automation",
        "web-scraping",
        "mcp",
        "langchain",
    ],
    entry_points={
        "console_scripts": [
            "context-bridge=context_bridge.cli:main",
        ],
    },
)
