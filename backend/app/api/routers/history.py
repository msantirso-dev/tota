from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models import Phrase, UsageHistory, User
from app.schemas import HistoryCreate, HistoryResponse

router = APIRouter(prefix="/history", tags=["history"])


@router.get("", response_model=list[HistoryResponse])
def list_history(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(UsageHistory)
        .filter(UsageHistory.user_id == current_user.id)
        .order_by(UsageHistory.created_at.desc())
        .limit(limit)
        .all()
    )


@router.post("", response_model=HistoryResponse, status_code=201)
def record_history(
    body: HistoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = UsageHistory(
        user_id=current_user.id,
        phrase_text=body.phrase_text,
        button_ids=body.button_ids,
        spoken=body.spoken,
    )
    db.add(entry)

    existing = (
        db.query(Phrase)
        .filter(Phrase.user_id == current_user.id, Phrase.text == body.phrase_text)
        .first()
    )
    if existing:
        existing.use_count += 1
        existing.spoken_text = body.phrase_text
    else:
        db.add(
            Phrase(
                user_id=current_user.id,
                text=body.phrase_text,
                spoken_text=body.phrase_text,
            )
        )

    db.commit()
    db.refresh(entry)
    return entry
