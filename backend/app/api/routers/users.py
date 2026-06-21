from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.core.security import get_password_hash
from app.models import Profile, User, UserRole
from app.schemas import UserCreate, UserResponse, UserUpdate
from app.seed import _create_default_board

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.admin, UserRole.terapeuta)),
):
    return db.query(User).order_by(User.id).all()


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in (UserRole.admin, UserRole.terapeuta) and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Permisos insuficientes")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user


@router.post("", response_model=UserResponse, status_code=201)
def create_user(
    body: UserCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.admin, UserRole.terapeuta)),
):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="El email ya existe")
    user = User(
        email=body.email,
        full_name=body.full_name,
        role=body.role,
        hashed_password=get_password_hash(body.password),
    )
    db.add(user)
    db.flush()
    db.add(Profile(user_id=user.id, display_name=body.full_name))
    if body.role == UserRole.usuario:
        _create_default_board(db, user.id, user.id)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    body: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in (UserRole.admin, UserRole.terapeuta) and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Permisos insuficientes")
    if current_user.role == UserRole.terapeuta and body.role == UserRole.admin:
        raise HTTPException(status_code=403, detail="No podés asignar rol admin")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    data = body.model_dump(exclude_unset=True)
    if "password" in data:
        user.hashed_password = get_password_hash(data.pop("password"))
    for key, value in data.items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user
