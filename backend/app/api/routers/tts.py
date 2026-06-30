from fastapi import APIRouter, Depends
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
    piper_url: str | None = None


class PiperTestRequest(BaseModel):
    piper_url: str = Field(min_length=4, max_length=512)
    text: str = "Hola, probando Piper"


@router.get("/config", response_model=TTSStatusResponse)
def tts_config(_: User = Depends(get_current_user)):
    settings = get_settings()
    return TTSStatusResponse(
        default_provider=settings.tts_provider,
        piper_url=settings.piper_base_url,
    )


@router.post("/synthesize", response_model=TTSResponse)
async def synthesize(
    body: TTSRequest,
    _: User = Depends(get_current_user),
):
    if body.provider == "browser":
        return TTSResponse(text=body.text, provider="browser", use_browser=True)

    if body.provider == "piper" or body.piper_url:
        settings = get_settings()
        piper_url = (body.piper_url or settings.piper_base_url).strip()
        provider = PiperProvider(piper_url)
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
    provider = PiperProvider(body.piper_url.strip())
    result = await provider.synthesize(body.text)
    return TTSResponse(
        text=result.text,
        provider=result.provider,
        use_browser=result.use_browser,
        audio_base64=result.audio_base64,
        audio_content_type=result.audio_content_type,
    )
