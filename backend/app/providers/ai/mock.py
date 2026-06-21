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

    async def chat(self, messages: list[dict[str, str]], context: dict | None = None) -> AIResponse:
        last_user = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")
        return AIResponse(
            text=(
                f"[Modo simulado] Recibí tu consulta sobre: «{last_user[:120]}». "
                "Configurá AI_PROVIDER=ollama y OLLAMA_BASE_URL para respuestas reales."
            ),
            source="mock",
        )
