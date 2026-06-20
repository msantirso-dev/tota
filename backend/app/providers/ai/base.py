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
