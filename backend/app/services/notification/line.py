import logging
from app.services.notification.base import NotificationService, NotificationEvent

logger = logging.getLogger(__name__)


class LineAdapter(NotificationService):
    """LINE Bot通知アダプター（将来実装用スタブ）。"""

    def send(
        self,
        event: NotificationEvent,
        task_title: str,
        due_date: str | None,
        recipient_email: str,
    ) -> None:
        logger.info("LINE通知（未実装スタブ）: event=%s task=%s", event, task_title)
