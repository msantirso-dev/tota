from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models import Phrase, User
from app.schemas import PhraseCreate, PhraseResponse, PhraseUpdate

router = APIRouter(prefix="/phrases", tags=["phrases"])


@router.get("", response_model=list[PhraseResponse])
def list_phrases(
    favorites_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Phrase).filter(Phrase.user_id == current_user.id)
    if favorites_only:
        query = query.filter(Phrase.is_favorite.is_(True))
    return query.order_by(Phrase.use_count.desc(), Phrase.updated_at.desc()).all()


@router.get("/frequent", response_model=list[PhraseResponse])
def frequent_phrases(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Phrase)
        .filter(Phrase.user_id == current_user.id)
        .order_by(Phrase.use_count.desc())
        .limit(limit)
        .all()
    )


@router.post("", response_model=PhraseResponse, status_code=201)
def create_phrase(
    body: PhraseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    phrase = Phrase(user_id=current_user.id, **body.model_dump())
    db.add(phrase)
    db.commit()
    db.refresh(phrase)
    return phrase


@router.patch("/{phrase_id}", response_model=PhraseResponse)
def update_phrase(
    phrase_id: int,
    body: PhraseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    phrase = db.query(Phrase).filter(Phrase.id == phrase_id, Phrase.user_id == current_user.id).first()
    if not phrase:
        raise HTTPException(status_code=404, detail="Frase no encontrada")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(phrase, key, value)
    db.commit()
    db.refresh(phrase)
    return phrase


@router.delete("/{phrase_id}", status_code=204)
def delete_phrase(
    phrase_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    phrase = db.query(Phrase).filter(Phrase.id == phrase_id, Phrase.user_id == current_user.id).first()
    if not phrase:
        raise HTTPException(status_code=404, detail="Frase no encontrada")
    db.delete(phrase)
    db.commit()
