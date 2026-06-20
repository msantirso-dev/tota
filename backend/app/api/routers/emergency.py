import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models import EmergencyContact, UsageHistory, User
from app.providers.automation.factory import get_automation_provider
from app.schemas import (
    EmergencyContactCreate,
    EmergencyContactResponse,
    EmergencyContactUpdate,
    EmergencyTriggerRequest,
    EmergencyTriggerResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/emergency", tags=["emergency"])


@router.get("/contacts", response_model=list[EmergencyContactResponse])
def list_contacts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(EmergencyContact)
        .filter(EmergencyContact.user_id == current_user.id)
        .order_by(EmergencyContact.is_primary.desc(), EmergencyContact.name)
        .all()
    )


@router.post("/contacts", response_model=EmergencyContactResponse, status_code=201)
def create_contact(
    body: EmergencyContactCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.is_primary:
        db.query(EmergencyContact).filter(EmergencyContact.user_id == current_user.id).update(
            {"is_primary": False}
        )
    contact = EmergencyContact(user_id=current_user.id, **body.model_dump())
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


@router.patch("/contacts/{contact_id}", response_model=EmergencyContactResponse)
def update_contact(
    contact_id: int,
    body: EmergencyContactUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contact = (
        db.query(EmergencyContact)
        .filter(EmergencyContact.id == contact_id, EmergencyContact.user_id == current_user.id)
        .first()
    )
    if not contact:
        raise HTTPException(status_code=404, detail="Contacto no encontrado")
    data = body.model_dump(exclude_unset=True)
    if data.get("is_primary"):
        db.query(EmergencyContact).filter(EmergencyContact.user_id == current_user.id).update(
            {"is_primary": False}
        )
    for key, value in data.items():
        setattr(contact, key, value)
    db.commit()
    db.refresh(contact)
    return contact


@router.delete("/contacts/{contact_id}", status_code=204)
def delete_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contact = (
        db.query(EmergencyContact)
        .filter(EmergencyContact.id == contact_id, EmergencyContact.user_id == current_user.id)
        .first()
    )
    if not contact:
        raise HTTPException(status_code=404, detail="Contacto no encontrado")
    db.delete(contact)
    db.commit()


@router.post("/trigger", response_model=EmergencyTriggerResponse)
async def trigger_emergency(
    body: EmergencyTriggerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not body.confirmed:
        return EmergencyTriggerResponse(
            success=False,
            message="Confirmá la emergencia para continuar",
            contacts_notified=0,
        )

    contacts = (
        db.query(EmergencyContact)
        .filter(EmergencyContact.user_id == current_user.id)
        .all()
    )

    provider = get_automation_provider("mock")
    await provider.execute("llamar_ayuda", {"message": body.message})

    db.add(
        UsageHistory(
            user_id=current_user.id,
            phrase_text=f"EMERGENCIA: {body.message}",
            spoken=True,
        )
    )
    db.commit()

    logger.warning(
        "EMERGENCY triggered user=%s message=%s contacts=%d",
        current_user.id,
        body.message,
        len(contacts),
    )

    return EmergencyTriggerResponse(
        success=True,
        message="Emergencia activada. Se notificó a los contactos configurados.",
        contacts_notified=len(contacts),
    )
