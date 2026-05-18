import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class NotificationEmail(Base):
    __tablename__ = "notification_emails"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
