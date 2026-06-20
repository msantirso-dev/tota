from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class TTSResult:
    audio_url: str | None = None
    text: str = ""
    provider: str = "mock"
    use_browser: bool = False


class TTSProvider(ABC):
    @abstractmethod
    async def synthesize(self, text: str, language: str = "es-AR") -> TTSResult:
        pass
