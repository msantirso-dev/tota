import logging

import httpx

from app.core.config import get_settings
from app.providers.tts.base import TTSProvider, TTSResult

logger = logging.getLogger(__name__)
settings = get_settings()


class PiperProvider(TTSProvider):
    def __init__(self):
        self.base_url = settings.piper_base_url.rstrip("/")

    async def synthesize(self, text: str, language: str = "es-AR") -> TTSResult:
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    f"{self.base_url}/synthesize",
                    json={"text": text, "language": language},
                )
                resp.raise_for_status()
                data = resp.json()
                return TTSResult(
                    audio_url=data.get("audio_url"),
                    text=text,
                    provider="piper",
                    use_browser=False,
                )
        except Exception as exc:
            logger.error("Piper TTS error: %s, falling back to browser", exc)
            return TTSResult(text=text, provider="browser_fallback", use_browser=True)
