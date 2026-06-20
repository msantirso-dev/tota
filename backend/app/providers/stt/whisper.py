import logging

import httpx

from app.core.config import get_settings
from app.providers.stt.base import STTProvider, STTResult

logger = logging.getLogger(__name__)
settings = get_settings()


class WhisperProvider(STTProvider):
    def __init__(self):
        self.base_url = settings.whisper_base_url.rstrip("/")

    async def transcribe(self, audio_data: bytes, language: str = "es") -> STTResult:
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(
                    f"{self.base_url}/asr",
                    files={"audio_file": ("audio.wav", audio_data, "audio/wav")},
                    data={"language": language},
                )
                resp.raise_for_status()
                data = resp.json()
                return STTResult(
                    text=data.get("text", ""),
                    confidence=data.get("confidence", 0.0),
                    provider="whisper",
                )
        except Exception as exc:
            logger.error("Whisper STT error: %s", exc)
            return STTResult(text="", confidence=0.0, provider="whisper_error")
