from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.models import User
from app.providers.tts.factory import get_tts_provider
from app.schemas import TTSRequest, TTSResponse

router = APIRouter(prefix="/tts", tags=["tts"])


@router.post("/synthesize", response_model=TTSResponse)
async def synthesize(
    body: TTSRequest,
    _: User = Depends(get_current_user),
):
    provider = get_tts_provider()
    result = await provider.synthesize(body.text, body.language)
    return TTSResponse(
        text=result.text,
        provider=result.provider,
        use_browser=result.use_browser,
        audio_url=result.audio_url,
    )
