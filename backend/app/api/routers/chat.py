import logging

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.models import User
from app.providers.ai.factory import get_ai_provider
from app.providers.ai.ollama import OllamaProvider
from app.schemas import ChatRequest, ChatResponse, ChatStatusResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])

SYSTEM_PROMPT = """Sos el asistente de TOTA AAC, una plataforma de Comunicación Aumentativa y Alternativa.

Ayudás a familias, terapeutas, cuidadores y usuarios con:
- Uso del tablero AAC y armado de frases
- Editor de tableros, botones e imágenes pictográficas
- Perfil, voz y accesibilidad
- Entorno inteligente y domótica
- Administración de usuarios (para terapeutas/admin)

Respondé siempre en español rioplatense, claro, breve y empático.
Usá listas cortas cuando ayude. Si no sabés algo del sistema, decilo con honestidad.
No inventes funciones que TOTA AAC no tenga."""


@router.get("/status", response_model=ChatStatusResponse)
async def chat_status(_: User = Depends(get_current_user)):
    settings = get_settings()
    provider = settings.ai_provider
    available = provider != "mock"
    model = None
    ollama_url = None

    if provider == "ollama":
        ollama_url = settings.ollama_base_url
        model = settings.ollama_model
        ai = get_ai_provider()
        if isinstance(ai, OllamaProvider):
            available = await ai.is_available()

    return ChatStatusResponse(
        provider=provider,
        available=available,
        model=model,
        ollama_url=ollama_url,
    )


@router.post("", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    _: User = Depends(get_current_user),
):
    ai = get_ai_provider()
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages.extend({"role": m.role, "content": m.content} for m in body.messages)

    response = await ai.chat(messages)

    if not response.text:
        if response.source.endswith("_error"):
            raise HTTPException(
                status_code=503,
                detail="No se pudo conectar con el servidor de IA. Verificá que Ollama esté activo.",
            )
        raise HTTPException(status_code=502, detail="La IA no devolvió respuesta.")

    logger.info("Chat response source=%s chars=%s", response.source, len(response.text))
    return ChatResponse(reply=response.text, source=response.source)
