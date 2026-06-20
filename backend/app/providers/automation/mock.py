import logging

from app.providers.automation.base import AutomationProvider, AutomationResult

logger = logging.getLogger(__name__)


class MockAutomationProvider(AutomationProvider):
    async def execute(self, action_type: str, config: dict | None = None) -> AutomationResult:
        logger.info("Mock automation execute: %s config=%s", action_type, config)
        return AutomationResult(
            success=True,
            message=f"Acción simulada: {action_type}",
            provider="mock",
            requires_confirmation=False,
        )

    async def test_connection(self) -> AutomationResult:
        return AutomationResult(
            success=True,
            message="Mock automation provider activo",
            provider="mock",
        )
