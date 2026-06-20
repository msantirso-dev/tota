from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models import AISuggestion, User
from app.providers.ai.factory import get_ai_provider
from app.schemas import SuggestionRequest, SuggestionResponse
from app.services.suggestions import get_rule_suggestions

router = APIRouter(prefix="/suggestions", tags=["suggestions"])


@router.post("", response_model=SuggestionResponse)
async def get_suggestions(
    body: SuggestionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    suggestions = get_rule_suggestions(body.phrase)
    source = "rules"

    if body.use_ai and not suggestions:
        ai = get_ai_provider()
        ai_suggestions = await ai.suggest_phrases(body.phrase)
        suggestions = ai_suggestions
        source = "ai"

    for suggestion in suggestions:
        db.add(
            AISuggestion(
                user_id=current_user.id,
                input_phrase=body.phrase,
                suggested_phrase=suggestion,
                source=source,
            )
        )
    db.commit()

    return SuggestionResponse(
        input_phrase=body.phrase,
        suggestions=suggestions,
        source=source,
    )
