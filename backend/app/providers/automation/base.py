from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class AutomationResult:
    success: bool
    message: str
    provider: str
    requires_confirmation: bool = False
    data: dict | None = None


class AutomationProvider(ABC):
    @abstractmethod
    async def execute(self, action_type: str, config: dict | None = None) -> AutomationResult:
        pass

    @abstractmethod
    async def test_connection(self) -> AutomationResult:
        pass
