import base64
import logging

import httpx

from app.providers.tts.base import TTSProvider, TTSResult

logger = logging.getLogger(__name__)


class PiperProvider(TTSProvider):
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")

    async def synthesize(self, text: str, language: str = "es-AR") -> TTSResult:
        attempts: list[tuple[str, dict]] = [
            (
                f"{self.base_url}/synthesize",
                {"json": {"text": text, "language": language}},
            ),
            (
                f"{self.base_url}/api/tts",
                {"json": {"text": text, "language": language}},
            ),
            (
                self.base_url,
                {"json": {"text": text}},
            ),
        ]

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                for url, payload in attempts:
                    try:
                        resp = await client.post(url, **payload)
                        if resp.status_code >= 400:
                            continue
                        content_type = resp.headers.get("content-type", "")
                        if content_type.startswith("audio"):
                            encoded = base64.b64encode(resp.content).decode("ascii")
                            return TTSResult(
                                text=text,
                                provider="piper",
                                use_browser=False,
                                audio_base64=encoded,
                                audio_content_type=content_type.split(";")[0] or "audio/wav",
                            )
                        data = resp.json()
                        if data.get("audio_base64"):
                            return TTSResult(
                                text=text,
                                provider="piper",
                                use_browser=False,
                                audio_base64=data["audio_base64"],
                                audio_content_type=data.get("audio_content_type", "audio/wav"),
                            )
                        if data.get("audio_url"):
                            audio_resp = await client.get(data["audio_url"])
                            audio_resp.raise_for_status()
                            encoded = base64.b64encode(audio_resp.content).decode("ascii")
                            ct = audio_resp.headers.get("content-type", "audio/wav").split(";")[0]
                            return TTSResult(
                                text=text,
                                provider="piper",
                                use_browser=False,
                                audio_base64=encoded,
                                audio_content_type=ct,
                            )
                    except Exception as exc:
                        logger.debug("Piper attempt failed %s: %s", url, exc)
                        continue
        except Exception as exc:
            logger.error("Piper TTS error: %s", exc)

        return TTSResult(text=text, provider="browser_fallback", use_browser=True)
