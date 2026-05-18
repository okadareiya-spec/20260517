from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.user_settings import UserSettings
from app.models.notification_email import NotificationEmail
from app.schemas.settings import (
    SettingsUpdate,
    SettingsResponse,
    NotificationEmailCreate,
    NotificationEmailResponse,
)

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("", response_model=SettingsResponse)
def get_settings(db: Session = Depends(get_db)) -> UserSettings:
    return db.query(UserSettings).first()


@router.put("", response_model=SettingsResponse)
def update_settings(data: SettingsUpdate, db: Session = Depends(get_db)) -> UserSettings:
    settings = db.query(UserSettings).first()
    settings.notification_email = data.notification_email
    db.commit()
    db.refresh(settings)
    return settings


@router.get("/emails", response_model=list[NotificationEmailResponse])
def list_emails(db: Session = Depends(get_db)) -> list[NotificationEmail]:
    return db.query(NotificationEmail).order_by(NotificationEmail.created_at).all()


@router.post("/emails", response_model=NotificationEmailResponse, status_code=201)
def add_email(data: NotificationEmailCreate, db: Session = Depends(get_db)) -> NotificationEmail:
    existing = db.query(NotificationEmail).filter(NotificationEmail.email == data.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="このメールアドレスはすでに登録されています")
    record = NotificationEmail(email=str(data.email))
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.delete("/emails/{email_id}", status_code=204)
def delete_email(email_id: str, db: Session = Depends(get_db)) -> None:
    record = db.query(NotificationEmail).filter(NotificationEmail.id == email_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="見つかりません")
    db.delete(record)
    db.commit()
