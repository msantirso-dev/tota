import logging

from app.providers.tts.base import TTSProvider, TTSResult

logger = logging.getLogger(__name__)


class MockTTSProvider(TTSProvider):
    async def synthesize(self, text: str, language: str = "es-AR") -> TTSResult:
        logger.info("Mock TTS for: %s", text)
        return TTSResult(text=text, provider="mock", use_browser=True)


class BrowserTTSProvider(TTSProvider):
    async def synthesize(self, text: str, language: str = "es-AR") -> TTSResult:
        return TTSResult(text=text, provider="browser", use_browser=True)
