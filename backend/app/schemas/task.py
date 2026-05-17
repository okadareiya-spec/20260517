from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.task import TaskStatus, TaskPriority, DependencyType


class CategoryBrief(BaseModel):
    id: str
    name: str
    color: Optional[str] = None

    model_config = {"from_attributes": True}


class DependencyInfo(BaseModel):
    id: str
    depends_on_task_id: str
    dependency_type: DependencyType
    depends_on_task_title: str = ""

    model_config = {"from_attributes": True}


class TaskBase(BaseModel):
    title: str
    memo: Optional[str] = None
    priority: TaskPriority = TaskPriority.MEDIUM
    due_date: Optional[datetime] = None
    category_id: Optional[str] = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    memo: Optional[str] = None
    priority: Optional[TaskPriority] = None
    due_date: Optional[datetime] = None
    category_id: Optional[str] = None


class TaskStatusUpdate(BaseModel):
    status: TaskStatus


class TaskResponse(TaskBase):
    id: str
    status: TaskStatus
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    category: Optional[CategoryBrief] = None
    dependencies: list[DependencyInfo] = []

    model_config = {"from_attributes": True}


class DependencyCreate(BaseModel):
    depends_on_task_id: str
    dependency_type: DependencyType
