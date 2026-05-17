from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.user_settings import UserSettings
from app.schemas.settings import SettingsUpdate, SettingsResponse

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
