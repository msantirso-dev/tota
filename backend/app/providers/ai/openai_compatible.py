import logging

import httpx

from app.core.config import get_settings
from app.providers.ai.base import AIProvider, AIResponse

logger = logging.getLogger(__name__)
settings = get_settings()


class OpenAICompatibleProvider(AIProvider):
    def __init__(self):
        self.base_url = settings.openai_compatible_base_url.rstrip("/")
        self.api_key = settings.openai_compatible_api_key

    async def suggest_phrases(self, phrase: str, context: dict | None = None) -> list[str]:
        prompt = (
            f"Sugiere 3 frases alternativas en español para: '{phrase}'. "
            "Responde solo con las frases, una por línea."
        )
        response = await self.complete(prompt, context)
        return [line.strip() for line in response.text.split("\n") if line.strip()]

    async def complete(self, prompt: str, context: dict | None = None) -> AIResponse:
        if not self.base_url:
            return AIResponse(text="", source="openai_compatible_unconfigured")
        try:
            headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    f"{self.base_url}/v1/chat/completions",
                    headers=headers,
                    json={
                        "model": "gpt-4o-mini",
                        "messages": [{"role": "user", "content": prompt}],
                    },
                )
                resp.raise_for_status()
                data = resp.json()
                text = data["choices"][0]["message"]["content"]
                return AIResponse(text=text, source="openai_compatible")
        except Exception as exc:
            logger.error("OpenAI compatible error: %s", exc)
            return AIResponse(text="", source="openai_compatible_error")
