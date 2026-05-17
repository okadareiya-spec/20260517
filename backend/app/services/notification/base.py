from abc import ABC, abstractmethod
from enum import Enum


class NotificationEvent(str, Enum):
    TASK_CREATED = "TASK_CREATED"
    TASK_DELETED = "TASK_DELETED"
    TASK_COMPLETED = "TASK_COMPLETED"
    REMINDER = "REMINDER"


class NotificationService(ABC):
    @abstractmethod
    def send(
        self,
        event: NotificationEvent,
        task_title: str,
        due_date: str | None,
        recipient_email: str,
    ) -> None:
        """通知を送信する。"""
