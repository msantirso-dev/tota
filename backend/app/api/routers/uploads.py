import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.models import Board, Button, User, UserRole

router = APIRouter(prefix="/uploads", tags=["uploads"])

UPLOAD_DIR = Path("/app/uploads/images")
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_BYTES = 5 * 1024 * 1024


def _ensure_upload_dir() -> Path:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    return UPLOAD_DIR


def _check_button_access(button: Button | None, user: User, db: Session) -> Button:
    if not button:
        raise HTTPException(status_code=404, detail="Botón no encontrado")
    board = db.query(Board).filter(Board.id == button.board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Tablero no encontrado")
    if user.role not in (UserRole.admin, UserRole.terapeuta, UserRole.familiar) and board.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Permisos insuficientes")
    return button


@router.post("/button/{button_id}")
async def upload_button_image(
    button_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.terapeuta, UserRole.familiar)),
):
    button = _check_button_access(db.query(Button).filter(Button.id == button_id).first(), current_user, db)

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Formato no permitido. Usá JPG, PNG, WEBP o GIF.")

    content = await file.read()
    if len(content) > MAX_BYTES:
        raise HTTPException(status_code=400, detail="La imagen no puede superar 5 MB.")

    ext = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/gif": ".gif",
    }[file.content_type]

    _ensure_upload_dir()
    filename = f"btn-{button_id}-{uuid.uuid4().hex}{ext}"
    filepath = UPLOAD_DIR / filename
    filepath.write_bytes(content)

    button.image_url = f"/api/uploads/images/{filename}"

    db.commit()
    db.refresh(button)

    return {"image_url": button.image_url, "button_id": button.id}


@router.delete("/button/{button_id}/image", status_code=204)
def remove_button_image(
    button_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.terapeuta, UserRole.familiar)),
):
    button = _check_button_access(db.query(Button).filter(Button.id == button_id).first(), current_user, db)
    button.image_url = None
    db.commit()
