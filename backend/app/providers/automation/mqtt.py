import logging

from app.core.config import get_settings
from app.providers.automation.base import AutomationProvider, AutomationResult

logger = logging.getLogger(__name__)
settings = get_settings()


class MQTTProvider(AutomationProvider):
    async def execute(self, action_type: str, config: dict | None = None) -> AutomationResult:
        config = config or {}
        topic = config.get("topic", f"tota/{action_type}")
        payload = config.get("payload", action_type)
        logger.info(
            "MQTT publish prepared: host=%s topic=%s payload=%s",
            settings.mqtt_host,
            topic,
            payload,
        )
        return AutomationResult(
            success=True,
            message=f"MQTT preparado: {topic} -> {payload}",
            provider="mqtt",
            data={"topic": topic, "payload": payload},
        )

    async def test_connection(self) -> AutomationResult:
        return AutomationResult(
            success=True,
            message=f"MQTT preparado en {settings.mqtt_host}:{settings.mqtt_port}",
            provider="mqtt",
        )
