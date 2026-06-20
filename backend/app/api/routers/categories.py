from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.models import Board, Category, User, UserRole
from app.schemas import CategoryCreate, CategoryResponse, CategoryUpdate

router = APIRouter(prefix="/categories", tags=["categories"])


def _check_board_access(board: Board | None, user: User) -> Board:
    if not board:
        raise HTTPException(status_code=404, detail="Tablero no encontrado")
    if user.role not in (UserRole.admin, UserRole.terapeuta, UserRole.familiar) and board.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Permisos insuficientes")
    return board


@router.get("/board/{board_id}", response_model=list[CategoryResponse])
def list_categories(
    board_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    board = _check_board_access(db.query(Board).filter(Board.id == board_id).first(), current_user)
    return (
        db.query(Category)
        .filter(Category.board_id == board.id)
        .order_by(Category.sort_order, Category.id)
        .all()
    )


@router.post("", response_model=CategoryResponse, status_code=201)
def create_category(
    body: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.terapeuta, UserRole.familiar)),
):
    _check_board_access(db.query(Board).filter(Board.id == body.board_id).first(), current_user)
    category = Category(**body.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.patch("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    body: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.terapeuta, UserRole.familiar)),
):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    _check_board_access(db.query(Board).filter(Board.id == category.board_id).first(), current_user)
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(category, key, value)
    db.commit()
    db.refresh(category)
    return category


@router.delete("/{category_id}", status_code=204)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.terapeuta)),
):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    db.delete(category)
    db.commit()
