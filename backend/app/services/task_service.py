import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session, selectinload
from fastapi import HTTPException

from app.models.task import Task, TaskDependency, TaskStatus, DependencyType
from app.models.user_settings import UserSettings
from app.schemas.task import TaskCreate, TaskUpdate, DependencyCreate, TaskResponse, DependencyInfo
from app.services.notification.base import NotificationEvent
from app.services.notification.email import EmailAdapter

logger = logging.getLogger(__name__)
_notifier = EmailAdapter()

_STATUS_ORDER = [TaskStatus.NOT_STARTED, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED]


def _load_task(db: Session, task_id: str) -> Task:
    task = (
        db.query(Task)
        .options(
            selectinload(Task.category),
            selectinload(Task.dependencies).selectinload(TaskDependency.depends_on_task),
        )
        .filter(Task.id == task_id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="タスクが見つかりません")
    return task


def _to_response(task: Task) -> dict:
    return {
        "id": task.id,
        "title": task.title,
        "memo": task.memo,
        "status": task.status,
        "priority": task.priority,
        "due_date": task.due_date,
        "completed_at": task.completed_at,
        "category_id": task.category_id,
        "created_at": task.created_at,
        "updated_at": task.updated_at,
        "category": task.category,
        "dependencies": [
            DependencyInfo(
                id=dep.id,
                depends_on_task_id=dep.depends_on_task_id,
                dependency_type=dep.dependency_type,
                depends_on_task_title=dep.depends_on_task.title if dep.depends_on_task else "",
            )
            for dep in task.dependencies
        ],
    }


def _notify(db: Session, event: NotificationEvent, task: Task) -> None:
    settings = db.query(UserSettings).first()
    if not settings or not settings.notification_email:
        logger.warning("通知先メールアドレス未設定のためスキップ: event=%s", event)
        return
    due_str = task.due_date.strftime("%Y/%m/%d %H:%M") if task.due_date else None
    try:
        _notifier.send(event, task.title, due_str, settings.notification_email)
    except Exception:
        logger.exception("通知送信失敗: task_id=%s event=%s", task.id, event)


def get_tasks(
    db: Session,
    status: str | None = None,
    category_id: str | None = None,
    sort: str = "created_at",
) -> list[dict]:
    q = db.query(Task).options(
        selectinload(Task.category),
        selectinload(Task.dependencies).selectinload(TaskDependency.depends_on_task),
    )
    if status:
        q = q.filter(Task.status == status)
    if category_id:
        q = q.filter(Task.category_id == category_id)
    if sort == "due_date":
        q = q.order_by(Task.due_date.asc().nullslast())
    else:
        q = q.order_by(Task.created_at.desc())
    return [_to_response(t) for t in q.all()]


def get_task(db: Session, task_id: str) -> dict:
    return _to_response(_load_task(db, task_id))


def create_task(db: Session, data: TaskCreate) -> dict:
    task = Task(**data.model_dump())
    db.add(task)
    db.commit()
    task = _load_task(db, task.id)
    _notify(db, NotificationEvent.TASK_CREATED, task)
    return _to_response(task)


def update_task(db: Session, task_id: str, data: TaskUpdate) -> dict:
    task = _load_task(db, task_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(task, field, value)
    task.updated_at = datetime.now(timezone.utc)
    db.commit()
    return _to_response(_load_task(db, task_id))


def delete_task(db: Session, task_id: str) -> None:
    task = _load_task(db, task_id)
    dependent_count = (
        db.query(TaskDependency)
        .filter(TaskDependency.depends_on_task_id == task_id)
        .count()
    )
    if dependent_count > 0:
        raise HTTPException(
            status_code=400,
            detail="このタスクは他のタスクから依存されているため削除できません。先に依存関係を解除してください。",
        )
    _notify(db, NotificationEvent.TASK_DELETED, task)
    db.delete(task)
    db.commit()


def update_status(db: Session, task_id: str, new_status: TaskStatus) -> dict:
    task = _load_task(db, task_id)
    _validate_status_transition(task, new_status)
    _validate_dependency_constraints(db, task, new_status)

    task.status = new_status
    if new_status == TaskStatus.COMPLETED:
        task.completed_at = datetime.now(timezone.utc)
    else:
        task.completed_at = None
    task.updated_at = datetime.now(timezone.utc)
    db.commit()

    task = _load_task(db, task_id)
    if new_status == TaskStatus.COMPLETED:
        _notify(db, NotificationEvent.TASK_COMPLETED, task)
    return _to_response(task)


def _validate_status_transition(task: Task, new_status: TaskStatus) -> None:
    if _STATUS_ORDER.index(new_status) <= _STATUS_ORDER.index(task.status):
        raise HTTPException(
            status_code=400,
            detail=f"ステータスを「{task.status.value}」から「{new_status.value}」には変更できません（差し戻し不可）",
        )


def _validate_dependency_constraints(db: Session, task: Task, new_status: TaskStatus) -> None:
    deps = db.query(TaskDependency).filter(TaskDependency.task_id == task.id).all()
    for dep in deps:
        prereq = db.query(Task).filter(Task.id == dep.depends_on_task_id).first()
        if not prereq:
            continue
        if (
            dep.dependency_type == DependencyType.FS
            and new_status == TaskStatus.IN_PROGRESS
            and prereq.status != TaskStatus.COMPLETED
        ):
            raise HTTPException(
                status_code=400,
                detail=f"FS依存: タスク『{prereq.title}』が完了するまで「進行中」にできません",
            )
        if (
            dep.dependency_type == DependencyType.FF
            and new_status == TaskStatus.COMPLETED
            and prereq.status != TaskStatus.COMPLETED
        ):
            raise HTTPException(
                status_code=400,
                detail=f"FF依存: タスク『{prereq.title}』が完了するまで「完了」にできません",
            )


def add_dependency(db: Session, task_id: str, data: DependencyCreate) -> TaskDependency:
    _load_task(db, task_id)
    _load_task(db, data.depends_on_task_id)

    if task_id == data.depends_on_task_id:
        raise HTTPException(status_code=400, detail="自分自身への依存関係は設定できません")

    existing = (
        db.query(TaskDependency)
        .filter(
            TaskDependency.task_id == task_id,
            TaskDependency.depends_on_task_id == data.depends_on_task_id,
            TaskDependency.dependency_type == data.dependency_type,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="同じ依存関係がすでに存在します")

    dep = TaskDependency(task_id=task_id, **data.model_dump())
    db.add(dep)
    db.commit()
    db.refresh(dep)
    return dep


def remove_dependency(db: Session, task_id: str, dependency_id: str) -> None:
    dep = (
        db.query(TaskDependency)
        .filter(TaskDependency.id == dependency_id, TaskDependency.task_id == task_id)
        .first()
    )
    if not dep:
        raise HTTPException(status_code=404, detail="依存関係が見つかりません")
    db.delete(dep)
    db.commit()
