import logging

import httpx

from app.core.config import get_settings
from app.providers.automation.base import AutomationProvider, AutomationResult

logger = logging.getLogger(__name__)
settings = get_settings()


class FibaroHC3Provider(AutomationProvider):
    async def execute(self, action_type: str, config: dict | None = None) -> AutomationResult:
        if not settings.fibaro_url:
            return AutomationResult(
                success=False,
                message="Fibaro HC3 no configurado",
                provider="fibaro",
            )
        config = config or {}
        device_id = config.get("device_id")
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(
                    f"{settings.fibaro_url.rstrip('/')}/api/devices/{device_id}/action/{action_type}",
                    auth=(settings.fibaro_user, settings.fibaro_password),
                    json=config.get("payload", {}),
                )
                resp.raise_for_status()
                return AutomationResult(
                    success=True,
                    message=f"Fibaro: {action_type} ejecutado",
                    provider="fibaro",
                )
        except Exception as exc:
            logger.error("Fibaro error: %s", exc)
            return AutomationResult(success=False, message=str(exc), provider="fibaro")

    async def test_connection(self) -> AutomationResult:
        if not settings.fibaro_url:
            return AutomationResult(
                success=False,
                message="FIBARO_URL no configurado",
                provider="fibaro",
            )
        return AutomationResult(
            success=True,
            message="Fibaro HC3 provider preparado",
            provider="fibaro",
        )
