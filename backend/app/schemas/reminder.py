from datetime import datetime
from pydantic import BaseModel, model_validator


class ReminderCreate(BaseModel):
    notify_before_days: int = 0
    notify_before_hours: int = 0

    @model_validator(mode="after")
    def check_at_least_one_positive(self) -> "ReminderCreate":
        if self.notify_before_days == 0 and self.notify_before_hours == 0:
            raise ValueError("notify_before_days または notify_before_hours のどちらか一方は1以上にしてください")
        if self.notify_before_days < 0 or self.notify_before_hours < 0:
            raise ValueError("通知タイミングは0以上の値を指定してください")
        return self


class ReminderResponse(BaseModel):
    id: str
    task_id: str
    notify_before_days: int
    notify_before_hours: int
    scheduled_at: datetime
    is_sent: bool

    model_config = {"from_attributes": True}
