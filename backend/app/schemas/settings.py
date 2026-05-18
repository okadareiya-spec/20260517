from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


class SettingsUpdate(BaseModel):
    notification_email: Optional[EmailStr] = None


class SettingsResponse(BaseModel):
    id: str
    notification_email: Optional[str] = None
    updated_at: datetime

    model_config = {"from_attributes": True}


class NotificationEmailCreate(BaseModel):
    email: EmailStr


class NotificationEmailResponse(BaseModel):
    id: str
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}
