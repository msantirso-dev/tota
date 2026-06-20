from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models import Setting, User
from app.schemas import SettingResponse, SettingUpdate

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("", response_model=list[SettingResponse])
def list_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Setting)
        .filter((Setting.user_id == current_user.id) | (Setting.user_id.is_(None)))
        .order_by(Setting.key)
        .all()
    )


@router.get("/{key}", response_model=SettingResponse)
def get_setting(
    key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    setting = (
        db.query(Setting)
        .filter(Setting.key == key, Setting.user_id == current_user.id)
        .first()
    )
    if not setting:
        setting = db.query(Setting).filter(Setting.key == key, Setting.user_id.is_(None)).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Configuración no encontrada")
    return setting


@router.put("/{key}", response_model=SettingResponse)
def upsert_setting(
    key: str,
    body: SettingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    setting = (
        db.query(Setting)
        .filter(Setting.key == key, Setting.user_id == current_user.id)
        .first()
    )
    if setting:
        setting.value = body.value
    else:
        setting = Setting(user_id=current_user.id, key=key, value=body.value)
        db.add(setting)
    db.commit()
    db.refresh(setting)
    return setting
