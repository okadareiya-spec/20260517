from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.reminder import ReminderCreate, ReminderResponse
from app.models.reminder import Reminder
from app.services import reminder_service

router = APIRouter(prefix="/tasks/{task_id}/reminders", tags=["reminders"])


@router.get("", response_model=list[ReminderResponse])
def list_reminders(task_id: str, db: Session = Depends(get_db)) -> list[Reminder]:
    return reminder_service.get_reminders(db, task_id)


@router.post("", response_model=ReminderResponse, status_code=201)
def create_reminder(
    task_id: str, data: ReminderCreate, db: Session = Depends(get_db)
) -> Reminder:
    return reminder_service.create_reminder(db, task_id, data)


@router.put("/{reminder_id}", response_model=ReminderResponse)
def update_reminder(
    task_id: str, reminder_id: str, data: ReminderCreate, db: Session = Depends(get_db)
) -> Reminder:
    return reminder_service.update_reminder(db, task_id, reminder_id, data)


@router.delete("/{reminder_id}", status_code=204)
def delete_reminder(
    task_id: str, reminder_id: str, db: Session = Depends(get_db)
) -> None:
    reminder_service.delete_reminder(db, task_id, reminder_id)
