import logging

from sqlalchemy import inspect, text

from app.core.database import engine

logger = logging.getLogger(__name__)


def ensure_schema_updates() -> None:
    """Aplica cambios de esquema idempotentes (create_all no altera tablas existentes)."""
    inspector = inspect(engine)
    if not inspector.has_table("buttons"):
        return

    columns = {col["name"] for col in inspector.get_columns("buttons")}
    if "image_url" not in columns:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE buttons ADD COLUMN image_url VARCHAR(512)"))
        logger.info("Columna buttons.image_url agregada")
