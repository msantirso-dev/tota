import asyncio
import base64
import io
import logging
import wave
from urllib.parse import urlparse

import httpx

from app.core.config import get_settings
from app.providers.tts.base import TTSProvider, TTSResult

logger = logging.getLogger(__name__)

# Nombres habituales del contenedor Piper en Coolify / Docker Compose
PIPER_HOST_FALLBACKS = ("piper-tts", "piper")


def format_piper_error(detail: str) -> str:
    lower = detail.lower()
    if "name resolution" in lower or "errno -3" in lower:
        return (
            "El backend TOTA no encuentra el servidor Piper en la red Docker. "
            "En Coolify: (1) abrí el servicio Piper → Networks y copiá el nombre de red; "
            "(2) en el backend TOTA → Networks → conectá esa misma red; "
            "(3) usá PIPER_WYOMING_HOST con el nombre interno del contenedor Piper "
            "(ej. piper-tts); (4) redeploy."
        )
    return detail


async def diagnose_piper_hosts(
    hosts: list[str] | None = None,
    wyoming_port: int = 10200,
    http_port: int = 5000,
) -> list[dict]:
    import socket

    provider = PiperProvider()
    targets = hosts or provider._host_candidates()
    results: list[dict] = []

    for host in targets:
        entry: dict = {"host": host, "dns": False, "wyoming": False, "http": False, "error": None}
        try:
            socket.getaddrinfo(host, wyoming_port, type=socket.SOCK_STREAM)
            entry["dns"] = True
        except OSError as exc:
            entry["error"] = str(exc)
            results.append(entry)
            continue

        for port, key in ((wyoming_port, "wyoming"), (http_port, "http")):
            try:
                reader, writer = await asyncio.wait_for(
                    asyncio.open_connection(host, port),
                    timeout=3.0,
                )
                del reader
                writer.close()
                await writer.wait_closed()
                entry[key] = True
            except Exception:
                pass

        results.append(entry)

    return results


def _audio_result(text: str, content: bytes, content_type: str, provider: str) -> TTSResult:
    encoded = base64.b64encode(content).decode("ascii")
    return TTSResult(
        text=text,
        provider=provider,
        use_browser=False,
        audio_base64=encoded,
        audio_content_type=content_type.split(";")[0] or "audio/wav",
    )


def _pcm_to_wav(pcm: bytes, rate: int, width: int, channels: int) -> bytes:
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(width)
        wf.setframerate(rate)
        wf.writeframes(pcm)
    return buf.getvalue()


def _language_code(language: str) -> str:
    return (language or "es").split("-")[0].lower()


class PiperProvider(TTSProvider):
    """Piper vía protocolo Wyoming (10200) y/o HTTP (5000)."""

    def __init__(
        self,
        http_url: str | None = None,
        wyoming_host: str | None = None,
        wyoming_port: int | None = None,
    ):
        settings = get_settings()
        self.http_url = (http_url or settings.piper_base_url or "").rstrip("/")
        self.wyoming_host = wyoming_host or settings.piper_wyoming_host
        self.wyoming_port = wyoming_port if wyoming_port is not None else settings.piper_wyoming_port
        self._normalize_urls()

    def _normalize_urls(self) -> None:
        if not self.http_url:
            return
        parsed = urlparse(self.http_url if "://" in self.http_url else f"http://{self.http_url}")
        host = parsed.hostname
        if not host:
            return
        if parsed.port == 10200:
            self.wyoming_host = host
            self.wyoming_port = 10200
            self.http_url = f"http://{host}:5000"

    def _http_url_for_host(self, host: str) -> str:
        parsed = urlparse(self.http_url if "://" in self.http_url else f"http://{self.http_url}")
        port = parsed.port or 5000
        return f"http://{host}:{port}"

    def _host_candidates(self) -> list[str]:
        hosts: list[str] = []
        parsed = urlparse(self.http_url if "://" in self.http_url else f"http://{self.http_url}")
        for candidate in (self.wyoming_host, parsed.hostname):
            if candidate and candidate not in hosts:
                hosts.append(candidate)
        for fallback in PIPER_HOST_FALLBACKS:
            if fallback not in hosts:
                hosts.append(fallback)
        return hosts

    @classmethod
    def from_url(cls, url: str) -> "PiperProvider":
        parsed = urlparse(url if "://" in url else f"http://{url}")
        host = parsed.hostname or "piper-tts"
        if parsed.port == 10200:
            return cls(http_url=f"http://{host}:5000", wyoming_host=host, wyoming_port=10200)
        return cls(http_url=url, wyoming_host=host, wyoming_port=10200)

    async def synthesize(self, text: str, language: str = "es-AR") -> TTSResult:
        errors: list[str] = []

        for host in self._host_candidates():
            result, err = await self._try_wyoming(host, self.wyoming_port, text, language)
            if result:
                return result
            if err:
                errors.append(f"Wyoming {host}:{self.wyoming_port}: {err}")

            http_url = self._http_url_for_host(host)
            result, err = await self._try_http(http_url, text, language)
            if result:
                return result
            if err:
                errors.append(f"HTTP {http_url}: {err}")

        detail = " | ".join(errors) if errors else "sin conexión a Piper"
        logger.warning("Piper no disponible: %s", detail)

        return TTSResult(
            text=text,
            provider="browser_fallback",
            use_browser=True,
            error_detail=format_piper_error(detail),
        )

    async def _try_http(
        self, base_url: str, text: str, language: str
    ) -> tuple[TTSResult | None, str | None]:
        attempts: list[tuple[str, dict, str | None]] = [
            (base_url, {"json": {"text": text}}, None),
            (base_url, {"json": {"text": text, "language": language}}, None),
            (f"{base_url}/synthesize", {"json": {"text": text, "language": language}}, None),
            (
                f"{base_url}/v1/audio/speech",
                {"json": {"input": text, "model": "piper", "voice": "default"}},
                None,
            ),
            (base_url, {}, f"?text={httpx.QueryParams({'text': text})}"),
        ]

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                for url, payload, query in attempts:
                    try:
                        if query:
                            resp = await client.get(f"{url}{query}")
                        else:
                            resp = await client.post(url, **payload)
                        if resp.status_code >= 400:
                            continue
                        content_type = resp.headers.get("content-type", "")
                        if content_type.startswith("audio") and resp.content:
                            return _audio_result(text, resp.content, content_type, "piper_http"), None
                        if resp.content and not content_type.startswith("application/json"):
                            return _audio_result(text, resp.content, "audio/wav", "piper_http"), None
                        data = resp.json()
                        if data.get("audio_base64"):
                            raw = base64.b64decode(data["audio_base64"])
                            return (
                                _audio_result(
                                    text,
                                    raw,
                                    data.get("audio_content_type", "audio/wav"),
                                    "piper_http",
                                ),
                                None,
                            )
                    except Exception as exc:
                        logger.debug("Piper HTTP %s failed: %s", url, exc)
                        continue
        except Exception as exc:
            return None, str(exc)
        return None, "sin respuesta HTTP válida"

    async def _try_wyoming(
        self, host: str, port: int, text: str, language: str
    ) -> tuple[TTSResult | None, str | None]:
        try:
            from wyoming.audio import AudioChunk, AudioStart, AudioStop
            from wyoming.client import AsyncTcpClient
            from wyoming.tts import Synthesize, SynthesizeVoice

            audio = bytearray()
            rate, width, channels = 22050, 2, 1
            lang = _language_code(language)

            async def _run() -> None:
                nonlocal rate, width, channels
                async with AsyncTcpClient(host, port) as client:
                    await client.write_event(
                        Synthesize(
                            text=text,
                            voice=SynthesizeVoice(language=lang),
                        ).event()
                    )
                    while True:
                        event = await client.read_event()
                        if event is None:
                            break
                        if AudioStart.is_type(event.type):
                            start = AudioStart.from_event(event)
                            rate, width, channels = start.rate, start.width, start.channels
                        elif AudioChunk.is_type(event.type):
                            chunk = AudioChunk.from_event(event)
                            audio.extend(chunk.audio)
                            rate, width, channels = chunk.rate, chunk.width, chunk.channels
                        elif AudioStop.is_type(event.type):
                            break

            await asyncio.wait_for(_run(), timeout=20.0)

            if not audio:
                return None, "Wyoming no devolvió audio"

            wav = _pcm_to_wav(bytes(audio), rate, width, channels)
            return _audio_result(text, wav, "audio/wav", "piper_wyoming"), None
        except ImportError:
            return None, "paquete wyoming no instalado"
        except TimeoutError:
            return None, "timeout esperando respuesta"
        except Exception as exc:
            return None, str(exc)
