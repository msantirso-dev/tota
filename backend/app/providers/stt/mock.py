import logging

from app.providers.stt.base import STTProvider, STTResult

logger = logging.getLogger(__name__)


class MockSTTProvider(STTProvider):
    async def transcribe(self, audio_data: bytes, language: str = "es") -> STTResult:
        logger.info("Mock STT transcribe %d bytes", len(audio_data))
        return STTResult(text="", confidence=0.0, provider="mock")
