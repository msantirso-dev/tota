from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class AIResponse:
    text: str
    source: str = "mock"


class AIProvider(ABC):
    @abstractmethod
    async def suggest_phrases(self, phrase: str, context: dict | None = None) -> list[str]:
        pass

    @abstractmethod
    async def complete(self, prompt: str, context: dict | None = None) -> AIResponse:
        pass

    async def chat(self, messages: list[dict[str, str]], context: dict | None = None) -> AIResponse:
        last_user = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")
        return await self.complete(last_user, context)
