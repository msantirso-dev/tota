from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    domain: str = "tota.pit.com.ar"
    frontend_url: str = "http://localhost:5173"
    api_url: str = "http://localhost:8000"

    postgres_db: str = "tota"
    postgres_user: str = "tota"
    postgres_password: str = "change_me"
    database_url: str = "postgresql://tota:change_me@postgres:5432/tota"

    redis_url: str = "redis://redis:6379/0"

    jwt_secret: str = "change_me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7

    ai_provider: str = "mock"
    ollama_base_url: str = "http://192.168.2.252:11434"
    ollama_model: str = "llama3"
    openai_compatible_base_url: str = ""
    openai_compatible_api_key: str = ""

    tts_provider: str = "browser"
    piper_base_url: str = "http://192.168.2.252:5000"

    stt_provider: str = "mock"
    whisper_base_url: str = "http://whisper:9000"

    automation_provider: str = "mock"
    home_assistant_url: str = ""
    home_assistant_token: str = ""
    mqtt_host: str = "mqtt"
    mqtt_port: int = 1883
    fibaro_url: str = ""
    fibaro_user: str = ""
    fibaro_password: str = ""
    akubela_url: str = ""
    akubela_token: str = ""
    shelly_url: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()
