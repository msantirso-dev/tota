from app.core.config import get_settings
from app.providers.stt.base import STTProvider
from app.providers.stt.mock import MockSTTProvider
from app.providers.stt.whisper import WhisperProvider


def get_stt_provider() -> STTProvider:
    settings = get_settings()
    providers = {
        "mock": MockSTTProvider,
        "whisper": WhisperProvider,
    }
    provider_cls = providers.get(settings.stt_provider, MockSTTProvider)
    return provider_cls()
