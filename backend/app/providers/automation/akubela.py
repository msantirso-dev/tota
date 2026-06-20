import logging

import httpx

from app.core.config import get_settings
from app.providers.automation.base import AutomationProvider, AutomationResult

logger = logging.getLogger(__name__)
settings = get_settings()


class AkubelaProvider(AutomationProvider):
    async def execute(self, action_type: str, config: dict | None = None) -> AutomationResult:
        if not settings.akubela_url:
            return AutomationResult(
                success=False,
                message="Akubela no configurado",
                provider="akubela",
            )
        config = config or {}
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(
                    f"{settings.akubela_url.rstrip('/')}/api/actions",
                    headers={"Authorization": f"Bearer {settings.akubela_token}"},
                    json={"action": action_type, **config},
                )
                resp.raise_for_status()
                return AutomationResult(
                    success=True,
                    message=f"Akubela: {action_type} ejecutado",
                    provider="akubela",
                )
        except Exception as exc:
            logger.error("Akubela error: %s", exc)
            return AutomationResult(success=False, message=str(exc), provider="akubela")

    async def test_connection(self) -> AutomationResult:
        if not settings.akubela_url:
            return AutomationResult(
                success=False,
                message="AKUBELA_URL no configurado",
                provider="akubela",
            )
        return AutomationResult(
            success=True,
            message="Akubela provider preparado",
            provider="akubela",
        )
