import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.base import Base
from app.db.session import engine, SessionLocal
import app.models  # noqa: F401 - 全モデルをAlembic/SQLAlchemyに登録
from app.api.routes import tasks, categories, reminders, settings as settings_router, webhooks
from app.models.user_settings import UserSettings
from app.services.reminder_service import check_and_send_reminders

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()


def _init_db() -> None:
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        if not db.query(UserSettings).first():
            db.add(UserSettings())
            db.commit()
            logger.info("UserSettingsの初期レコードを作成しました")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    _init_db()
    scheduler.add_job(
        check_and_send_reminders,
        "interval",
        seconds=settings.REMINDER_BATCH_INTERVAL,
        id="reminder_batch",
    )
    scheduler.start()
    logger.info("リマインドスケジューラー起動: interval=%ds", settings.REMINDER_BATCH_INTERVAL)
    yield
    scheduler.shutdown()
    logger.info("リマインドスケジューラー停止")


app = FastAPI(title="タスク管理アプリ API", lifespan=lifespan)

_is_wildcard = settings.FRONTEND_URL == "*"
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if _is_wildcard else [settings.FRONTEND_URL],
    # ワイルドカードと allow_credentials=True の組み合わせはRFC違反のため分岐
    allow_credentials=not _is_wildcard,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tasks.router, prefix="/api")
app.include_router(categories.router, prefix="/api")
app.include_router(reminders.router, prefix="/api")
app.include_router(settings_router.router, prefix="/api")
app.include_router(webhooks.router, prefix="/api")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
