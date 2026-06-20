import logging

from app.providers.ai.base import AIProvider, AIResponse

logger = logging.getLogger(__name__)


class MockProvider(AIProvider):
    async def suggest_phrases(self, phrase: str, context: dict | None = None) -> list[str]:
        logger.info("Mock AI suggest for: %s", phrase)
        return []

    async def complete(self, prompt: str, context: dict | None = None) -> AIResponse:
        logger.info("Mock AI complete for: %s", prompt)
        return AIResponse(text="Respuesta simulada de IA.", source="mock")
