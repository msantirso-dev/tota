import logging
import sys

from sqlalchemy.orm import Session

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models import (
    AutomationAction,
    Board,
    Button,
    Category,
    EmergencyContact,
    Profile,
    Setting,
    User,
    UserRole,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)

INITIAL_CATEGORIES = [
    ("Necesidades", "#818cf8", "heart"),
    ("Personas", "#f472b6", "users"),
    ("Comida", "#fb923c", "utensils"),
    ("Bebidas", "#38bdf8", "cup"),
    ("Lugares", "#34d399", "map-pin"),
    ("Acciones", "#a78bfa", "zap"),
    ("Emociones", "#fbbf24", "smile"),
    ("Preguntas", "#60a5fa", "help-circle"),
    ("Rutinas", "#94a3b8", "clock"),
    ("Frases rápidas", "#c084fc", "message-circle"),
    ("Entorno", "#4ade80", "home"),
    ("Salud", "#f87171", "activity"),
    ("Emergencia", "#ef4444", "alert-triangle"),
]

INITIAL_BUTTONS = [
    ("yo", "yo", "Necesidades", "#dbeafe", "user"),
    ("quiero", "quiero", "Acciones", "#ede9fe", "hand"),
    ("no", "no", "Frases rápidas", "#fee2e2", "x"),
    ("sí", "sí", "Frases rápidas", "#dcfce7", "check"),
    ("más", "más", "Frases rápidas", "#fef3c7", "plus"),
    ("ayuda", "ayuda", "Necesidades", "#fecaca", "life-buoy"),
    ("dolor", "dolor", "Salud", "#fca5a5", "heart-pulse"),
    ("comer", "comer", "Comida", "#fed7aa", "utensils"),
    ("tomar", "tomar", "Bebidas", "#bae6fd", "cup"),
    ("ir", "ir", "Acciones", "#ddd6fe", "navigation"),
    ("baño", "baño", "Lugares", "#a7f3d0", "bath"),
    ("casa", "casa", "Lugares", "#bbf7d0", "home"),
    ("mamá", "mamá", "Personas", "#fbcfe8", "user"),
    ("papá", "papá", "Personas", "#bfdbfe", "user"),
    ("frío", "frío", "Emociones", "#bae6fd", "thermometer"),
    ("calor", "calor", "Emociones", "#fdba74", "sun"),
    ("cansado", "cansado", "Emociones", "#e2e8f0", "moon"),
    ("feliz", "feliz", "Emociones", "#fde68a", "smile"),
    ("triste", "triste", "Emociones", "#cbd5e1", "frown"),
    ("miedo", "miedo", "Emociones", "#ddd6fe", "alert-circle"),
    ("jugar", "jugar", "Acciones", "#c4b5fd", "gamepad"),
    ("dormir", "dormir", "Rutinas", "#e0e7ff", "bed"),
    ("parar", "parar", "Acciones", "#fecdd3", "stop-circle"),
    ("gracias", "gracias", "Frases rápidas", "#d1fae5", "thumbs-up"),
    ("por favor", "por favor", "Frases rápidas", "#e0f2fe", "heart"),
    ("tengo hambre", "tengo hambre", "Comida", "#fdba74", "utensils"),
    ("tengo sed", "tengo sed", "Bebidas", "#7dd3fc", "cup"),
    ("me duele", "me duele", "Salud", "#fca5a5", "heart-pulse"),
    ("necesito ayuda", "necesito ayuda", "Necesidades", "#f87171", "life-buoy"),
]

AUTOMATION_ACTIONS = [
    ("Prender luz", "light_on", "home", "mock"),
    ("Apagar luz", "light_off", "home", "mock"),
    ("Subir persiana", "blind_up", "arrow-up", "mock"),
    ("Bajar persiana", "blind_down", "arrow-down", "mock"),
    ("Encender TV", "tv_on", "tv", "mock"),
    ("Apagar TV", "tv_off", "tv-off", "mock"),
    ("Llamar ayuda", "llamar_ayuda", "phone", "mock"),
    ("Activar escena", "scene", "sparkles", "mock"),
    ("Cambiar temperatura", "temperature", "thermometer", "mock"),
]


def _create_default_board(db: Session, owner_id: int, automation_user_id: int) -> Board:
    board = Board(
        owner_id=owner_id,
        name="Tablero principal",
        description="Tablero AAC inicial de TOTA",
        is_default=True,
        grid_columns=4,
    )
    db.add(board)
    db.flush()

    category_map: dict[str, Category] = {}
    for idx, (name, color, icon) in enumerate(INITIAL_CATEGORIES):
        cat = Category(board_id=board.id, name=name, color=color, icon=icon, sort_order=idx)
        db.add(cat)
        category_map[name] = cat
    db.flush()

    for idx, (label, spoken, category_name, color, icon) in enumerate(INITIAL_BUTTONS):
        is_emergency = category_name == "Emergencia" or label == "necesito ayuda"
        db.add(
            Button(
                board_id=board.id,
                category_id=category_map[category_name].id,
                label=label,
                spoken_text=spoken,
                color=color,
                icon=icon,
                sort_order=idx,
                is_emergency=is_emergency,
            )
        )

    db.add(
        Button(
            board_id=board.id,
            category_id=category_map["Emergencia"].id,
            label="EMERGENCIA",
            spoken_text="Necesito ayuda urgente",
            color="#ef4444",
            icon="alert-triangle",
            sort_order=999,
            is_emergency=True,
        )
    )

    for name, action_type, icon, provider in AUTOMATION_ACTIONS:
        db.add(
            AutomationAction(
                user_id=automation_user_id,
                name=name,
                action_type=action_type,
                provider=provider,
                icon=icon,
                requires_confirmation=True,
            )
        )

    return board


def seed_database(db: Session) -> None:
    if db.query(User).filter(User.email == "admin@tota.pit.com.ar").first():
        logger.info("Database already seeded, skipping")
        return

    admin = User(
        email="admin@tota.pit.com.ar",
        full_name="Administrador TOTA",
        role=UserRole.admin,
        hashed_password=get_password_hash("admin123"),
    )
    demo = User(
        email="usuario@tota.pit.com.ar",
        full_name="Usuario Demo",
        role=UserRole.usuario,
        hashed_password=get_password_hash("usuario123"),
    )
    db.add_all([admin, demo])
    db.flush()

    db.add_all(
        [
            Profile(user_id=admin.id, display_name="Administrador TOTA"),
            Profile(user_id=demo.id, display_name="Usuario Demo", high_contrast=False),
        ]
    )

    _create_default_board(db, demo.id, demo.id)

    db.add(
        EmergencyContact(
            user_id=demo.id,
            name="Contacto de emergencia",
            phone="+5491100000000",
            relationship_type="familiar",
            is_primary=True,
        )
    )

    db.add(
        Setting(
            user_id=None,
            key="app_name",
            value={"name": "TOTA AAC", "version": "0.1.0"},
        )
    )

    db.commit()
    logger.info("Database seeded successfully")


def run_seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
