import logging

import httpx

from app.providers.automation.base import AutomationProvider, AutomationResult

logger = logging.getLogger(__name__)


class HTTPWebhookProvider(AutomationProvider):
    async def execute(self, action_type: str, config: dict | None = None) -> AutomationResult:
        config = config or {}
        url = config.get("url")
        method = config.get("method", "POST").upper()
        if not url:
            return AutomationResult(
                success=False,
                message="URL de webhook no configurada",
                provider="http_webhook",
            )
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.request(
                    method,
                    url,
                    json=config.get("payload", {"action": action_type}),
                    headers=config.get("headers", {}),
                )
                resp.raise_for_status()
                return AutomationResult(
                    success=True,
                    message=f"Webhook ejecutado: {url}",
                    provider="http_webhook",
                )
        except Exception as exc:
            logger.error("Webhook error: %s", exc)
            return AutomationResult(
                success=False,
                message=str(exc),
                provider="http_webhook",
            )

    async def test_connection(self) -> AutomationResult:
        return AutomationResult(
            success=True,
            message="HTTP Webhook provider preparado",
            provider="http_webhook",
        )
