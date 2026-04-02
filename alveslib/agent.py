"""
Thin async + sync wrappers over the Anthropic SDK for quick scripting and agent
patterns. Use this when you want direct API access with streaming; for full
agentic loops with file tools use `claude-agent-sdk` (pip install claude-agent-sdk).

Usage:
    from alveslib.agent import ask, stream, Agent

    # One-shot
    reply = ask("Summarize this data: ...")

    # Streaming to stdout
    stream("Write a FastAPI endpoint that ...")

    # Multi-turn agent
    agent = Agent(system="You are an expert Python dev.")
    reply = agent.chat("Generate a Celery task that processes CSV files")
    follow = agent.chat("Now add error handling and retries")
"""

import os
import asyncio
from typing import Iterator, AsyncIterator

try:
    import anthropic

    _client: anthropic.Anthropic | None = anthropic.Anthropic(
        api_key=os.environ.get("ANTHROPIC_API_KEY")
    )
    _async_client: anthropic.AsyncAnthropic | None = anthropic.AsyncAnthropic(
        api_key=os.environ.get("ANTHROPIC_API_KEY")
    )
except ImportError:
    _client = None
    _async_client = None


DEFAULT_MODEL = "claude-sonnet-4-5"


def _require_client() -> "anthropic.Anthropic":
    if _client is None:
        raise ImportError("pip install anthropic")
    if not os.environ.get("ANTHROPIC_API_KEY"):
        raise RuntimeError("ANTHROPIC_API_KEY not set")
    return _client


def ask(prompt: str, system: str = "", model: str = DEFAULT_MODEL) -> str:
    """One-shot blocking request; returns full text."""
    client = _require_client()
    msg = client.messages.create(
        model=model,
        max_tokens=8096,
        system=system or anthropic.NOT_GIVEN,
        messages=[{"role": "user", "content": prompt}],
    )
    return msg.content[0].text


def stream(prompt: str, system: str = "", model: str = DEFAULT_MODEL) -> Iterator[str]:
    """Streaming generator; yields text deltas. Print as they arrive."""
    client = _require_client()
    with client.messages.stream(
        model=model,
        max_tokens=8096,
        system=system or anthropic.NOT_GIVEN,
        messages=[{"role": "user", "content": prompt}],
    ) as s:
        yield from s.text_stream


async def ask_async(prompt: str, system: str = "", model: str = DEFAULT_MODEL) -> str:
    """Async one-shot request."""
    if _async_client is None:
        raise ImportError("pip install anthropic")
    msg = await _async_client.messages.create(
        model=model,
        max_tokens=8096,
        system=system or anthropic.NOT_GIVEN,
        messages=[{"role": "user", "content": prompt}],
    )
    return msg.content[0].text


async def stream_async(
    prompt: str, system: str = "", model: str = DEFAULT_MODEL
) -> AsyncIterator[str]:
    """Async streaming generator."""
    if _async_client is None:
        raise ImportError("pip install anthropic")
    async with _async_client.messages.stream(
        model=model,
        max_tokens=8096,
        system=system or anthropic.NOT_GIVEN,
        messages=[{"role": "user", "content": prompt}],
    ) as s:
        async for text in s.text_stream:
            yield text


class Agent:
    """Stateful multi-turn conversation agent with optional system prompt."""

    def __init__(self, system: str = "", model: str = DEFAULT_MODEL):
        self.system = system
        self.model = model
        self.history: list[dict] = []

    def chat(self, prompt: str) -> str:
        client = _require_client()
        self.history.append({"role": "user", "content": prompt})
        msg = client.messages.create(
            model=self.model,
            max_tokens=8096,
            system=self.system or anthropic.NOT_GIVEN,
            messages=self.history,
        )
        reply = msg.content[0].text
        self.history.append({"role": "assistant", "content": reply})
        return reply

    async def chat_async(self, prompt: str) -> str:
        if _async_client is None:
            raise ImportError("pip install anthropic")
        self.history.append({"role": "user", "content": prompt})
        msg = await _async_client.messages.create(
            model=self.model,
            max_tokens=8096,
            system=self.system or anthropic.NOT_GIVEN,
            messages=self.history,
        )
        reply = msg.content[0].text
        self.history.append({"role": "assistant", "content": reply})
        return reply

    def reset(self) -> None:
        self.history.clear()
