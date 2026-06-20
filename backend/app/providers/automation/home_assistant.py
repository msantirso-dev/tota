import logging

import httpx

from app.core.config import get_settings
from app.providers.automation.base import AutomationProvider, AutomationResult

logger = logging.getLogger(__name__)
settings = get_settings()


class HomeAssistantProvider(AutomationProvider):
    async def execute(self, action_type: str, config: dict | None = None) -> AutomationResult:
        if not settings.home_assistant_url or not settings.home_assistant_token:
            return AutomationResult(
                success=False,
                message="Home Assistant no configurado",
                provider="home_assistant",
            )
        config = config or {}
        entity_id = config.get("entity_id", "")
        service = config.get("service", action_type)
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                domain = service.split(".")[0] if "." in service else "homeassistant"
                service_name = service.split(".")[1] if "." in service else service
                resp = await client.post(
                    f"{settings.home_assistant_url.rstrip('/')}/api/services/{domain}/{service_name}",
                    headers={"Authorization": f"Bearer {settings.home_assistant_token}"},
                    json={"entity_id": entity_id, **config.get("payload", {})},
                )
                resp.raise_for_status()
                return AutomationResult(
                    success=True,
                    message=f"Home Assistant: {service} ejecutado",
                    provider="home_assistant",
                )
        except Exception as exc:
            logger.error("Home Assistant error: %s", exc)
            return AutomationResult(
                success=False,
                message=str(exc),
                provider="home_assistant",
            )

    async def test_connection(self) -> AutomationResult:
        if not settings.home_assistant_url:
            return AutomationResult(
                success=False,
                message="HOME_ASSISTANT_URL no configurado",
                provider="home_assistant",
            )
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"{settings.home_assistant_url.rstrip('/')}/api/",
                    headers={"Authorization": f"Bearer {settings.home_assistant_token}"},
                )
                resp.raise_for_status()
                return AutomationResult(
                    success=True,
                    message="Conexión a Home Assistant OK",
                    provider="home_assistant",
                )
        except Exception as exc:
            return AutomationResult(
                success=False,
                message=str(exc),
                provider="home_assistant",
            )
