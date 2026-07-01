from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.models import User
from app.providers.tts.factory import get_tts_provider
from app.providers.tts.piper import PiperProvider
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
    text: str = "Hola, probando Piper"


def _make_piper_provider(piper_url: str | None = None) -> PiperProvider:
    if piper_url and piper_url.strip():
        return PiperProvider.from_url(piper_url.strip())
    return PiperProvider()


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

    if body.provider == "piper" or body.piper_url:
        provider = _make_piper_provider(body.piper_url)
        result = await provider.synthesize(body.text, body.language)
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
    provider = _make_piper_provider(body.piper_url)
    result = await provider.synthesize(body.text)
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
