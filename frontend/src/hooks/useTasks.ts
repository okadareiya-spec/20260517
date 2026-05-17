import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "../api/client";
import type { TaskStatus, TaskCreateInput, TaskUpdateInput, DependencyType } from "../types";

export const TASKS_KEY = "tasks";

export function useTasks(params?: { status?: TaskStatus; category_id?: string; sort?: string }) {
  return useQuery({
    queryKey: [TASKS_KEY, params],
    queryFn: () => tasksApi.list(params),
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: [TASKS_KEY, id],
    queryFn: () => tasksApi.get(id),
    enabled: !!id,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TaskCreateInput) => tasksApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [TASKS_KEY] }),
  });
}

export function useUpdateTask(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TaskUpdateInput) => tasksApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [TASKS_KEY] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [TASKS_KEY] }),
  });
}

export function useUpdateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      tasksApi.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: [TASKS_KEY] }),
  });
}

export function useAddDependency(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      depends_on_task_id,
      dependency_type,
    }: {
      depends_on_task_id: string;
      dependency_type: DependencyType;
    }) => tasksApi.addDependency(taskId, depends_on_task_id, dependency_type),
    onSuccess: () => qc.invalidateQueries({ queryKey: [TASKS_KEY] }),
  });
}

export function useRemoveDependency(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dependencyId: string) => tasksApi.removeDependency(taskId, dependencyId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [TASKS_KEY] }),
  });
}
