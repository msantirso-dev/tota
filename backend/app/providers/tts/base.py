from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class TTSResult:
    audio_url: str | None = None
    audio_base64: str | None = None
    audio_content_type: str = "audio/wav"
    text: str = ""
    provider: str = "mock"
    use_browser: bool = False
    error_detail: str | None = None


class TTSProvider(ABC):
    @abstractmethod
    async def synthesize(self, text: str, language: str = "es-AR") -> TTSResult:
        pass
