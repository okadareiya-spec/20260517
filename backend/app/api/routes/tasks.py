from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.task import (
    TaskCreate,
    TaskUpdate,
    TaskResponse,
    TaskStatusUpdate,
    DependencyCreate,
    DependencyInfo,
)
from app.models.task import TaskDependency
from app.services import task_service

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("", response_model=list[TaskResponse])
def list_tasks(
    status: str | None = Query(None),
    category_id: str | None = Query(None),
    sort: str = Query("created_at"),
    db: Session = Depends(get_db),
) -> list[dict]:
    return task_service.get_tasks(db, status=status, category_id=category_id, sort=sort)


@router.post("", response_model=TaskResponse, status_code=201)
def create_task(data: TaskCreate, db: Session = Depends(get_db)) -> dict:
    return task_service.create_task(db, data)


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: str, db: Session = Depends(get_db)) -> dict:
    return task_service.get_task(db, task_id)


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(task_id: str, data: TaskUpdate, db: Session = Depends(get_db)) -> dict:
    return task_service.update_task(db, task_id, data)


@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: str, db: Session = Depends(get_db)) -> None:
    task_service.delete_task(db, task_id)


@router.patch("/{task_id}/status", response_model=TaskResponse)
def update_status(task_id: str, data: TaskStatusUpdate, db: Session = Depends(get_db)) -> dict:
    return task_service.update_status(db, task_id, data.status)


@router.post("/{task_id}/dependencies", response_model=DependencyInfo, status_code=201)
def add_dependency(
    task_id: str, data: DependencyCreate, db: Session = Depends(get_db)
) -> TaskDependency:
    return task_service.add_dependency(db, task_id, data)


@router.delete("/{task_id}/dependencies/{dependency_id}", status_code=204)
def remove_dependency(
    task_id: str, dependency_id: str, db: Session = Depends(get_db)
) -> None:
    task_service.remove_dependency(db, task_id, dependency_id)
