import axios from "axios";
import type {
  Task,
  TaskCreateInput,
  TaskUpdateInput,
  TaskStatus,
  Category,
  Reminder,
  ReminderCreateInput,
  UserSettings,
  DependencyType,
} from "../types";

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
  headers: { "Content-Type": "application/json" },
});

export const tasksApi = {
  list: (params?: { status?: TaskStatus; category_id?: string; sort?: string }) =>
    http.get<Task[]>("/tasks", { params }).then((r) => r.data),

  get: (id: string) => http.get<Task>(`/tasks/${id}`).then((r) => r.data),

  create: (data: TaskCreateInput) =>
    http.post<Task>("/tasks", data).then((r) => r.data),

  update: (id: string, data: TaskUpdateInput) =>
    http.put<Task>(`/tasks/${id}`, data).then((r) => r.data),

  delete: (id: string) => http.delete(`/tasks/${id}`),

  updateStatus: (id: string, status: TaskStatus) =>
    http.patch<Task>(`/tasks/${id}/status`, { status }).then((r) => r.data),

  addDependency: (taskId: string, depends_on_task_id: string, dependency_type: DependencyType) =>
    http
      .post(`/tasks/${taskId}/dependencies`, { depends_on_task_id, dependency_type })
      .then((r) => r.data),

  removeDependency: (taskId: string, dependencyId: string) =>
    http.delete(`/tasks/${taskId}/dependencies/${dependencyId}`),
};

export const categoriesApi = {
  list: () => http.get<Category[]>("/categories").then((r) => r.data),
  create: (name: string, color?: string) =>
    http.post<Category>("/categories", { name, color }).then((r) => r.data),
  update: (id: string, data: { name?: string; color?: string }) =>
    http.put<Category>(`/categories/${id}`, data).then((r) => r.data),
  delete: (id: string) => http.delete(`/categories/${id}`),
};

export const remindersApi = {
  list: (taskId: string) =>
    http.get<Reminder[]>(`/tasks/${taskId}/reminders`).then((r) => r.data),
  create: (taskId: string, data: ReminderCreateInput) =>
    http.post<Reminder>(`/tasks/${taskId}/reminders`, data).then((r) => r.data),
  update: (taskId: string, reminderId: string, data: ReminderCreateInput) =>
    http.put<Reminder>(`/tasks/${taskId}/reminders/${reminderId}`, data).then((r) => r.data),
  delete: (taskId: string, reminderId: string) =>
    http.delete(`/tasks/${taskId}/reminders/${reminderId}`),
};

export const settingsApi = {
  get: () => http.get<UserSettings>("/settings").then((r) => r.data),
  update: (notification_email: string | null) =>
    http.put<UserSettings>("/settings", { notification_email }).then((r) => r.data),
};
