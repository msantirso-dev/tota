import logging

import httpx

from app.core.config import get_settings
from app.providers.automation.base import AutomationProvider, AutomationResult

logger = logging.getLogger(__name__)
settings = get_settings()


class ShellyProvider(AutomationProvider):
    async def execute(self, action_type: str, config: dict | None = None) -> AutomationResult:
        config = config or {}
        device_url = config.get("device_url") or settings.shelly_url
        if not device_url:
            return AutomationResult(
                success=False,
                message="Shelly no configurado",
                provider="shelly",
            )
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(
                    f"{device_url.rstrip('/')}/relay/0",
                    params={"turn": config.get("turn", "on" if "on" in action_type else "off")},
                )
                resp.raise_for_status()
                return AutomationResult(
                    success=True,
                    message=f"Shelly: {action_type} ejecutado",
                    provider="shelly",
                )
        except Exception as exc:
            logger.error("Shelly error: %s", exc)
            return AutomationResult(success=False, message=str(exc), provider="shelly")

    async def test_connection(self) -> AutomationResult:
        if not settings.shelly_url:
            return AutomationResult(
                success=False,
                message="SHELLY_URL no configurado",
                provider="shelly",
            )
        return AutomationResult(
            success=True,
            message="Shelly provider preparado",
            provider="shelly",
        )
