from app.core.config import get_settings
from app.providers.tts.base import TTSProvider
from app.providers.tts.mock import BrowserTTSProvider, MockTTSProvider
from app.providers.tts.piper import PiperProvider


def get_tts_provider() -> TTSProvider:
    settings = get_settings()
    providers = {
        "mock": MockTTSProvider,
        "browser": BrowserTTSProvider,
        "piper": PiperProvider,
    }
    provider_cls = providers.get(settings.tts_provider, BrowserTTSProvider)
    return provider_cls()
