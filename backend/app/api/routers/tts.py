from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.models import User
from app.providers.tts.factory import get_tts_provider
from app.providers.tts.piper import PiperProvider, diagnose_piper_hosts, normalize_piper_host
from app.schemas import TTSRequest, TTSResponse

router = APIRouter(prefix="/tts", tags=["tts"])


class TTSStatusResponse(BaseModel):
    default_provider: str
    piper_http_url: str | None = None
    piper_wyoming_host: str | None = None
    piper_wyoming_port: int | None = None
    piper_url: str | None = None  # legacy


class PiperTestRequest(BaseModel):
    piper_url: str | None = Field(default=None, max_length=512)
    piper_host: str | None = Field(default=None, max_length=128)
    piper_voice: str | None = Field(default=None, max_length=128)
    text: str = "Hola, probando Piper"


class PiperVoiceItem(BaseModel):
    id: str
    label: str
    languages: list[str] = []
    installed: bool = True


class PiperVoicesResponse(BaseModel):
    voices: list[PiperVoiceItem]
    reachable: bool


def _make_piper_provider(
    piper_url: str | None = None,
    piper_host: str | None = None,
) -> PiperProvider:
    if piper_url and piper_url.strip():
        return PiperProvider.from_url(piper_url.strip())
    host = normalize_piper_host(piper_host)
    if host:
        return PiperProvider(
            http_url=f"http://{host}:5000",
            wyoming_host=host,
            wyoming_port=10200,
        )
    return PiperProvider()


class PiperDiagnosticsResponse(BaseModel):
    hosts: list[dict]
    reachable: bool
    hint: str | None = None


@router.get("/diagnostics", response_model=PiperDiagnosticsResponse)
async def tts_diagnostics(
    piper_host: str | None = None,
    _: User = Depends(get_current_user),
):
    provider = _make_piper_provider(piper_host=piper_host)
    parsed_port = 5000
    if provider.http_url:
        from urllib.parse import urlparse

        p = urlparse(provider.http_url)
        if p.port:
            parsed_port = p.port
    hosts = await diagnose_piper_hosts(
        provider._host_candidates(),
        wyoming_port=provider.wyoming_port,
        http_port=parsed_port,
    )
    reachable = any(h.get("wyoming") or h.get("http") for h in hosts)
    hint = None
    if not reachable:
        if not any(h.get("dns") for h in hosts):
            hint = (
                "Ningún hostname resuelve desde el backend TOTA. "
                "En Piper → Terminal ejecutá hostname y configurá ese nombre "
                "(Config → Hostname Piper o PIPER_WYOMING_HOST en Coolify)."
            )
        else:
            hint = "DNS OK pero los puertos 10200/5000 no responden. Verificá que Piper esté corriendo."
    return PiperDiagnosticsResponse(hosts=hosts, reachable=reachable, hint=hint)


@router.get("/voices", response_model=PiperVoicesResponse)
async def list_piper_voices(
    piper_url: str | None = None,
    piper_host: str | None = None,
    _: User = Depends(get_current_user),
):
    provider = _make_piper_provider(piper_url, piper_host)
    parsed = urlparse(provider.http_url) if provider.http_url else None
    http_port = (parsed.port or 5000) if parsed else 5000
    hosts = await diagnose_piper_hosts(
        provider._host_candidates(),
        wyoming_port=provider.wyoming_port,
        http_port=http_port,
    )
    reachable = any(h.get("wyoming") or h.get("http") for h in hosts)
    raw = await provider.list_voices()
    voices = [PiperVoiceItem(**v) for v in raw]
    return PiperVoicesResponse(voices=voices, reachable=reachable)


@router.get("/config", response_model=TTSStatusResponse)
def tts_config(_: User = Depends(get_current_user)):
    settings = get_settings()
    provider = PiperProvider()
    return TTSStatusResponse(
        default_provider=settings.tts_provider,
        piper_http_url=provider.http_url,
        piper_wyoming_host=provider.wyoming_host,
        piper_wyoming_port=provider.wyoming_port,
        piper_url=provider.http_url,
    )


@router.post("/synthesize", response_model=TTSResponse)
async def synthesize(
    body: TTSRequest,
    _: User = Depends(get_current_user),
):
    if body.provider == "browser":
        return TTSResponse(text=body.text, provider="browser", use_browser=True)

    if body.provider == "piper" or body.piper_url or body.piper_host:
        provider = _make_piper_provider(body.piper_url, body.piper_host)
        result = await provider.synthesize(body.text, body.language, body.piper_voice)
        return TTSResponse(
            text=result.text,
            provider=result.provider,
            use_browser=result.use_browser,
            audio_url=result.audio_url,
            audio_base64=result.audio_base64,
            audio_content_type=result.audio_content_type,
        )

    provider = get_tts_provider()
    result = await provider.synthesize(body.text, body.language)
    return TTSResponse(
        text=result.text,
        provider=result.provider,
        use_browser=result.use_browser,
        audio_url=result.audio_url,
        audio_base64=result.audio_base64,
        audio_content_type=result.audio_content_type,
    )


@router.post("/test-piper", response_model=TTSResponse)
async def test_piper(
    body: PiperTestRequest,
    _: User = Depends(get_current_user),
):
    provider = _make_piper_provider(body.piper_url, body.piper_host)
    result = await provider.synthesize(body.text, voice_id=body.piper_voice)
    if result.use_browser:
        raise HTTPException(
            status_code=503,
            detail=result.error_detail
            or (
                "Piper no respondió. Verificá Wyoming en "
                f"{get_settings().piper_wyoming_host}:{get_settings().piper_wyoming_port}."
            ),
        )
    return TTSResponse(
        text=result.text,
        provider=result.provider,
        use_browser=False,
        audio_base64=result.audio_base64,
        audio_content_type=result.audio_content_type,
    )
