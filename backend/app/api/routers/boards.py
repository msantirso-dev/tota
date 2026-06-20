from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.models import Board, Button, User, UserRole
from app.schemas import BoardCreate, BoardDetailResponse, BoardResponse, BoardUpdate

router = APIRouter(prefix="/boards", tags=["boards"])


@router.get("", response_model=list[BoardResponse])
def list_boards(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Board)
    if current_user.role not in (UserRole.admin, UserRole.terapeuta):
        query = query.filter(Board.owner_id == current_user.id)
    return query.order_by(Board.is_default.desc(), Board.id).all()


@router.get("/default", response_model=BoardDetailResponse)
def get_default_board(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    board = (
        db.query(Board)
        .options(joinedload(Board.categories), joinedload(Board.buttons).joinedload(Button.actions))
        .filter(Board.owner_id == current_user.id, Board.is_default.is_(True))
        .first()
    )
    if not board:
        board = (
            db.query(Board)
            .options(joinedload(Board.categories), joinedload(Board.buttons).joinedload(Button.actions))
            .filter(Board.owner_id == current_user.id)
            .first()
        )
    if not board:
        raise HTTPException(status_code=404, detail="No hay tableros disponibles")
    return board


@router.get("/{board_id}", response_model=BoardDetailResponse)
def get_board(
    board_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    board = (
        db.query(Board)
        .options(joinedload(Board.categories), joinedload(Board.buttons).joinedload(Button.actions))
        .filter(Board.id == board_id)
        .first()
    )
    if not board:
        raise HTTPException(status_code=404, detail="Tablero no encontrado")
    if (
        current_user.role not in (UserRole.admin, UserRole.terapeuta)
        and board.owner_id != current_user.id
    ):
        raise HTTPException(status_code=403, detail="Permisos insuficientes")
    return board


@router.post("", response_model=BoardResponse, status_code=201)
def create_board(
    body: BoardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.terapeuta, UserRole.familiar)),
):
    if body.is_default:
        db.query(Board).filter(Board.owner_id == current_user.id).update({"is_default": False})
    board = Board(owner_id=current_user.id, **body.model_dump())
    db.add(board)
    db.commit()
    db.refresh(board)
    return board


@router.patch("/{board_id}", response_model=BoardResponse)
def update_board(
    board_id: int,
    body: BoardUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Tablero no encontrado")
    if (
        current_user.role not in (UserRole.admin, UserRole.terapeuta, UserRole.familiar)
        and board.owner_id != current_user.id
    ):
        raise HTTPException(status_code=403, detail="Permisos insuficientes")
    data = body.model_dump(exclude_unset=True)
    if data.get("is_default"):
        db.query(Board).filter(Board.owner_id == board.owner_id).update({"is_default": False})
    for key, value in data.items():
        setattr(board, key, value)
    db.commit()
    db.refresh(board)
    return board


@router.delete("/{board_id}", status_code=204)
def delete_board(
    board_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.terapeuta)),
):
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Tablero no encontrado")
    db.delete(board)
    db.commit()
