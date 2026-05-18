import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.task import Task
from app.models.reminder import Reminder
from app.models.user_settings import UserSettings
from app.models.notification_email import NotificationEmail
from app.schemas.reminder import ReminderCreate
from app.services.notification.base import NotificationEvent
from app.services.notification.email import EmailAdapter
from app.db.session import SessionLocal

logger = logging.getLogger(__name__)
_notifier = EmailAdapter()


def get_reminders(db: Session, task_id: str) -> list[Reminder]:
    return db.query(Reminder).filter(Reminder.task_id == task_id).all()


def create_reminder(db: Session, task_id: str, data: ReminderCreate) -> Reminder:
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="タスクが見つかりません")
    if not task.due_date:
        raise HTTPException(
            status_code=400,
            detail="期日が設定されていないタスクにはリマインドを設定できません",
        )

    scheduled_at = task.due_date - timedelta(
        days=data.notify_before_days, hours=data.notify_before_hours
    )
    reminder = Reminder(
        task_id=task_id,
        notify_before_days=data.notify_before_days,
        notify_before_hours=data.notify_before_hours,
        scheduled_at=scheduled_at,
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return reminder


def update_reminder(db: Session, task_id: str, reminder_id: str, data: ReminderCreate) -> Reminder:
    reminder = (
        db.query(Reminder)
        .filter(Reminder.id == reminder_id, Reminder.task_id == task_id)
        .first()
    )
    if not reminder:
        raise HTTPException(status_code=404, detail="リマインドが見つかりません")

    task = db.query(Task).filter(Task.id == task_id).first()
    if not task or not task.due_date:
        raise HTTPException(status_code=400, detail="タスクの期日が設定されていません")

    reminder.notify_before_days = data.notify_before_days
    reminder.notify_before_hours = data.notify_before_hours
    reminder.scheduled_at = task.due_date - timedelta(
        days=data.notify_before_days, hours=data.notify_before_hours
    )
    reminder.is_sent = False
    db.commit()
    db.refresh(reminder)
    return reminder


def delete_reminder(db: Session, task_id: str, reminder_id: str) -> None:
    reminder = (
        db.query(Reminder)
        .filter(Reminder.id == reminder_id, Reminder.task_id == task_id)
        .first()
    )
    if not reminder:
        raise HTTPException(status_code=404, detail="リマインドが見つかりません")
    db.delete(reminder)
    db.commit()


def check_and_send_reminders() -> None:
    """APSchedulerから定期実行されるリマインド送信バッチ。"""
    db: Session = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        pending = (
            db.query(Reminder)
            .filter(Reminder.scheduled_at <= now, Reminder.is_sent == False)  # noqa: E712
            .all()
        )
        if not pending:
            return

        recipients = [r.email for r in db.query(NotificationEmail).all()]
        if not recipients:
            logger.warning(
                "通知先メールアドレス未設定のため%d件のリマインドをスキップします。設定画面でメールアドレスを登録してください。",
                len(pending),
            )
            return

        for reminder in pending:
            task = db.query(Task).filter(Task.id == reminder.task_id).first()
            if not task:
                reminder.is_sent = True
                continue
            due_str = task.due_date.strftime("%Y/%m/%d %H:%M") if task.due_date else None
            all_sent = True
            for recipient in recipients:
                try:
                    _notifier.send(NotificationEvent.REMINDER, task.title, due_str, recipient)
                except Exception:
                    logger.exception("リマインドメール送信失敗: reminder_id=%s to=%s", reminder.id, recipient)
                    all_sent = False
            if all_sent:
                reminder.is_sent = True

        db.commit()
    finally:
        db.close()
