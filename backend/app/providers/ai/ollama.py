import logging

import httpx

from app.core.config import get_settings
from app.providers.ai.base import AIProvider, AIResponse

logger = logging.getLogger(__name__)
settings = get_settings()


class OllamaProvider(AIProvider):
    def __init__(self):
        self.base_url = settings.ollama_base_url.rstrip("/")

    async def suggest_phrases(self, phrase: str, context: dict | None = None) -> list[str]:
        prompt = (
            f"Sugiere 3 frases alternativas en español para: '{phrase}'. "
            "Responde solo con las frases, una por línea."
        )
        response = await self.complete(prompt, context)
        return [line.strip() for line in response.text.split("\n") if line.strip()]

    async def complete(self, prompt: str, context: dict | None = None) -> AIResponse:
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    f"{self.base_url}/api/generate",
                    json={"model": "llama3", "prompt": prompt, "stream": False},
                )
                resp.raise_for_status()
                data = resp.json()
                return AIResponse(text=data.get("response", ""), source="ollama")
        except Exception as exc:
            logger.error("Ollama error: %s", exc)
            return AIResponse(text="", source="ollama_error")
