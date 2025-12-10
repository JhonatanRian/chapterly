from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, Optional


@dataclass
class NotificationContext:
    recipient: Any
    notification_type: str
    message: str
    idea: Optional[Any] = None
    comment: Optional[Any] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


class AbstractNotificationService(ABC):
    @abstractmethod
    def send(self, context: NotificationContext) -> bool:
        pass

    @abstractmethod
    def can_send(self, context: NotificationContext) -> bool:
        pass
