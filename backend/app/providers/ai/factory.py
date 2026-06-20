from app.core.config import get_settings
from app.providers.ai.base import AIProvider
from app.providers.ai.mock import MockProvider
from app.providers.ai.ollama import OllamaProvider
from app.providers.ai.openai_compatible import OpenAICompatibleProvider


def get_ai_provider() -> AIProvider:
    settings = get_settings()
    providers = {
        "mock": MockProvider,
        "ollama": OllamaProvider,
        "openai_compatible": OpenAICompatibleProvider,
    }
    provider_cls = providers.get(settings.ai_provider, MockProvider)
    return provider_cls()
