from app.core.config import get_settings
from app.providers.automation.akubela import AkubelaProvider
from app.providers.automation.base import AutomationProvider
from app.providers.automation.fibaro import FibaroHC3Provider
from app.providers.automation.home_assistant import HomeAssistantProvider
from app.providers.automation.http_webhook import HTTPWebhookProvider
from app.providers.automation.mock import MockAutomationProvider
from app.providers.automation.mqtt import MQTTProvider
from app.providers.automation.shelly import ShellyProvider


def get_automation_provider(name: str | None = None) -> AutomationProvider:
    settings = get_settings()
    provider_name = name or settings.automation_provider
    providers = {
        "mock": MockAutomationProvider,
        "home_assistant": HomeAssistantProvider,
        "mqtt": MQTTProvider,
        "fibaro": FibaroHC3Provider,
        "akubela": AkubelaProvider,
        "shelly": ShellyProvider,
        "http_webhook": HTTPWebhookProvider,
    }
    provider_cls = providers.get(provider_name, MockAutomationProvider)
    return provider_cls()
