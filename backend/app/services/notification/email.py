import logging
import resend
from tenacity import retry, stop_after_attempt, wait_fixed

from app.core.config import settings
from app.services.notification.base import NotificationService, NotificationEvent

logger = logging.getLogger(__name__)

_SUBJECTS: dict[NotificationEvent, str] = {
    NotificationEvent.TASK_CREATED: "タスクを登録しました",
    NotificationEvent.TASK_DELETED: "タスクを削除しました",
    NotificationEvent.TASK_COMPLETED: "タスクが完了しました",
    NotificationEvent.REMINDER: "タスクのリマインド",
}

_BODIES: dict[NotificationEvent, str] = {
    NotificationEvent.TASK_CREATED: "タスク『{title}』を登録しました。{due}",
    NotificationEvent.TASK_DELETED: "タスク『{title}』を削除しました。",
    NotificationEvent.TASK_COMPLETED: "タスク『{title}』が完了しました。",
    NotificationEvent.REMINDER: "タスク『{title}』の期日が近づいています。{due}",
}


class EmailAdapter(NotificationService):
    def send(
        self,
        event: NotificationEvent,
        task_title: str,
        due_date: str | None,
        recipient_email: str,
    ) -> None:
        if not settings.RESEND_API_KEY:
            logger.warning("RESEND_API_KEY 未設定のためメール送信をスキップします")
            return

        due_str = f"（期日：{due_date}）" if due_date else ""
        body = _BODIES[event].format(title=task_title, due=due_str)
        subject = _SUBJECTS[event]

        try:
            self._send_with_retry(subject, body, recipient_email)
        except Exception:
            logger.exception("メール送信失敗（3回リトライ後）: to=%s", recipient_email)
            raise

    @retry(stop=stop_after_attempt(3), wait=wait_fixed(2))
    def _send_with_retry(self, subject: str, body: str, recipient_email: str) -> None:
        resend.api_key = settings.RESEND_API_KEY
        params: resend.Emails.SendParams = {
            "from": "onboarding@resend.dev",
            "to": [recipient_email],
            "subject": subject,
            "text": body,
        }
        resend.Emails.send(params)
        logger.info("メール送信成功: subject=%s to=%s", subject, recipient_email)
