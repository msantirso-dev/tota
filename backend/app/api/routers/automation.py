import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models import AutomationAction, User
from app.providers.automation.factory import get_automation_provider
from app.schemas import (
    AutomationActionCreate,
    AutomationActionResponse,
    AutomationActionUpdate,
    AutomationExecuteRequest,
    AutomationExecuteResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/automation", tags=["automation"])


@router.get("/actions", response_model=list[AutomationActionResponse])
def list_actions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(AutomationAction)
        .filter(AutomationAction.user_id == current_user.id, AutomationAction.is_active.is_(True))
        .order_by(AutomationAction.name)
        .all()
    )


@router.post("/actions", response_model=AutomationActionResponse, status_code=201)
def create_action(
    body: AutomationActionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    action = AutomationAction(user_id=current_user.id, **body.model_dump())
    db.add(action)
    db.commit()
    db.refresh(action)
    return action


@router.patch("/actions/{action_id}", response_model=AutomationActionResponse)
def update_action(
    action_id: int,
    body: AutomationActionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    action = (
        db.query(AutomationAction)
        .filter(AutomationAction.id == action_id, AutomationAction.user_id == current_user.id)
        .first()
    )
    if not action:
        raise HTTPException(status_code=404, detail="Acción no encontrada")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(action, key, value)
    db.commit()
    db.refresh(action)
    return action


@router.delete("/actions/{action_id}", status_code=204)
def delete_action(
    action_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    action = (
        db.query(AutomationAction)
        .filter(AutomationAction.id == action_id, AutomationAction.user_id == current_user.id)
        .first()
    )
    if not action:
        raise HTTPException(status_code=404, detail="Acción no encontrada")
    db.delete(action)
    db.commit()


@router.post("/execute", response_model=AutomationExecuteResponse)
async def execute_action(
    body: AutomationExecuteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    action = (
        db.query(AutomationAction)
        .filter(AutomationAction.id == body.action_id, AutomationAction.user_id == current_user.id)
        .first()
    )
    if not action:
        raise HTTPException(status_code=404, detail="Acción no encontrada")

    if action.requires_confirmation and not body.confirmed:
        return AutomationExecuteResponse(
            success=False,
            message="Esta acción requiere confirmación humana",
            provider=action.provider,
            requires_confirmation=True,
        )

    provider = get_automation_provider(action.provider)
    result = await provider.execute(action.action_type, action.config)
    logger.info(
        "Automation executed user=%s action=%s provider=%s success=%s",
        current_user.id,
        action.action_type,
        action.provider,
        result.success,
    )
    return AutomationExecuteResponse(
        success=result.success,
        message=result.message,
        provider=result.provider,
        requires_confirmation=False,
    )


@router.get("/test/{provider_name}")
async def test_provider(provider_name: str, _: User = Depends(get_current_user)):
    provider = get_automation_provider(provider_name)
    result = await provider.test_connection()
    return {"success": result.success, "message": result.message, "provider": result.provider}
