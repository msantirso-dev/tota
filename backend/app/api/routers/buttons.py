from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.models import Board, Button, ButtonAction, User, UserRole
from app.schemas import ButtonCreate, ButtonReorderRequest, ButtonResponse, ButtonUpdate

router = APIRouter(prefix="/buttons", tags=["buttons"])


def _check_board_access(board: Board | None, user: User) -> Board:
    if not board:
        raise HTTPException(status_code=404, detail="Tablero no encontrado")
    if user.role not in (UserRole.admin, UserRole.terapeuta, UserRole.familiar) and board.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Permisos insuficientes")
    return board


@router.get("/board/{board_id}", response_model=list[ButtonResponse])
def list_buttons(
    board_id: int,
    category_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _check_board_access(db.query(Board).filter(Board.id == board_id).first(), current_user)
    query = (
        db.query(Button)
        .options(joinedload(Button.actions))
        .filter(Button.board_id == board_id)
    )
    if category_id is not None:
        query = query.filter(Button.category_id == category_id)
    return query.order_by(Button.sort_order, Button.id).all()


@router.post("", response_model=ButtonResponse, status_code=201)
def create_button(
    body: ButtonCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.terapeuta, UserRole.familiar)),
):
    _check_board_access(db.query(Board).filter(Board.id == body.board_id).first(), current_user)
    data = body.model_dump(exclude={"actions"})
    button = Button(**data)
    db.add(button)
    db.flush()
    for action_data in body.actions:
        db.add(ButtonAction(button_id=button.id, **action_data.model_dump()))
    db.commit()
    db.refresh(button)
    return db.query(Button).options(joinedload(Button.actions)).filter(Button.id == button.id).first()


@router.patch("/{button_id}", response_model=ButtonResponse)
def update_button(
    button_id: int,
    body: ButtonUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.terapeuta, UserRole.familiar)),
):
    button = db.query(Button).filter(Button.id == button_id).first()
    if not button:
        raise HTTPException(status_code=404, detail="Botón no encontrado")
    _check_board_access(db.query(Board).filter(Board.id == button.board_id).first(), current_user)
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(button, key, value)
    db.commit()
    return db.query(Button).options(joinedload(Button.actions)).filter(Button.id == button.id).first()


@router.post("/reorder", status_code=204)
def reorder_buttons(
    body: ButtonReorderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.terapeuta, UserRole.familiar)),
):
    _check_board_access(db.query(Board).filter(Board.id == body.board_id).first(), current_user)
    buttons = (
        db.query(Button)
        .filter(Button.board_id == body.board_id)
        .order_by(Button.sort_order, Button.id)
        .all()
    )
    button_map = {b.id: b for b in buttons}
    seen: set[int] = set()
    order = 0
    for button_id in body.button_ids:
        if button_id in button_map and button_id not in seen:
            button_map[button_id].sort_order = order
            order += 1
            seen.add(button_id)
    for button in buttons:
        if button.id not in seen:
            button.sort_order = order
            order += 1
    db.commit()


@router.delete("/{button_id}", status_code=204)
def delete_button(
    button_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.terapeuta, UserRole.familiar)),
):
    button = db.query(Button).filter(Button.id == button_id).first()
    if not button:
        raise HTTPException(status_code=404, detail="Botón no encontrado")
    _check_board_access(db.query(Board).filter(Board.id == button.board_id).first(), current_user)
    db.delete(button)
    db.commit()
