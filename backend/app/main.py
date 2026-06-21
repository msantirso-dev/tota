import logging
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.api.routers import (
    auth,
    automation,
    boards,
    buttons,
    categories,
    emergency,
    history,
    phrases,
    profiles,
    settings as settings_router,
    suggestions,
    tts,
    uploads,
    users,
)
from app.core.config import get_settings
from app.core.database import Base, SessionLocal, engine
from app.core.redis_client import get_redis
from app.db_schema import ensure_schema_updates
from app.seed import ensure_button_pictograms, ensure_extra_users, seed_database

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)

app_settings = get_settings()

app = FastAPI(
    title="TOTA AAC API",
    description="Plataforma de Comunicación Aumentativa y Alternativa",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[app_settings.frontend_url, f"https://{app_settings.domain}"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_PREFIX = "/api"

app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(users.router, prefix=API_PREFIX)
app.include_router(profiles.router, prefix=API_PREFIX)
app.include_router(boards.router, prefix=API_PREFIX)
app.include_router(categories.router, prefix=API_PREFIX)
app.include_router(buttons.router, prefix=API_PREFIX)
app.include_router(phrases.router, prefix=API_PREFIX)
app.include_router(history.router, prefix=API_PREFIX)
app.include_router(suggestions.router, prefix=API_PREFIX)
app.include_router(automation.router, prefix=API_PREFIX)
app.include_router(emergency.router, prefix=API_PREFIX)
app.include_router(settings_router.router, prefix=API_PREFIX)
app.include_router(tts.router, prefix=API_PREFIX)
app.include_router(uploads.router, prefix=API_PREFIX)


def _configure_uploads() -> None:
    uploads_path = Path("/app/uploads/images")
    try:
        uploads_path.mkdir(parents=True, exist_ok=True)
        app.mount(
            f"{API_PREFIX}/uploads/images",
            StaticFiles(directory=str(uploads_path)),
            name="uploads",
        )
    except OSError as exc:
        logger.warning("Almacenamiento de uploads no disponible: %s", exc)


@app.on_event("startup")
def on_startup():
    _configure_uploads()
    try:
        Base.metadata.create_all(bind=engine)
        ensure_schema_updates()
        db = SessionLocal()
        try:
            seed_database(db)
            ensure_extra_users(db)
            ensure_button_pictograms(db)
        finally:
            db.close()
    except Exception:
        logger.exception("Error en inicialización de base de datos")
    logger.info("TOTA AAC API started")


@app.get("/health")
def health():
    redis_ok = False
    try:
        client = get_redis()
        redis_ok = client is not None and client.ping()
    except Exception:
        redis_ok = False

    return {
        "status": "ok",
        "service": "tota-aac-backend",
        "redis": redis_ok,
    }


@app.get("/api/health")
def api_health():
    return health()
