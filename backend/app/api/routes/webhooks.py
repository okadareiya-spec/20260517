from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.webhook_log import WebhookLog

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/line", status_code=200)
async def receive_line_webhook(request: Request, db: Session = Depends(get_db)) -> dict:
    payload = await request.json()
    log = WebhookLog(source="line", payload=payload)
    db.add(log)
    db.commit()
    return {"status": "received"}
