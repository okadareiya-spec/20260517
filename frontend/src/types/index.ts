export type TaskStatus = "未着手" | "進行中" | "完了";
export type TaskPriority = "高" | "中" | "低";
export type DependencyType = "FS" | "FF";

export interface Category {
  id: string;
  name: string;
  color: string | null;
  created_at: string;
}

export interface DependencyInfo {
  id: string;
  depends_on_task_id: string;
  dependency_type: DependencyType;
  depends_on_task_title: string;
}

export interface Task {
  id: string;
  title: string;
  memo: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  completed_at: string | null;
  category_id: string | null;
  created_at: string;
  updated_at: string;
  category: Category | null;
  dependencies: DependencyInfo[];
}

export interface Reminder {
  id: string;
  task_id: string;
  notify_before_days: number;
  notify_before_hours: number;
  scheduled_at: string;
  is_sent: boolean;
}

export interface UserSettings {
  id: string;
  notification_email: string | null;
  updated_at: string;
}

export interface TaskCreateInput {
  title: string;
  memo?: string;
  priority: TaskPriority;
  due_date?: string;
  category_id?: string;
}

export interface TaskUpdateInput {
  title?: string;
  memo?: string;
  priority?: TaskPriority;
  due_date?: string;
  category_id?: string;
}

export interface ReminderCreateInput {
  notify_before_days: number;
  notify_before_hours: number;
}
