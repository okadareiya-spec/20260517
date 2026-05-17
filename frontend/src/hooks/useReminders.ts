import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { remindersApi } from "../api/client";
import type { ReminderCreateInput } from "../types";

export const REMINDERS_KEY = "reminders";

export function useReminders(taskId: string) {
  return useQuery({
    queryKey: [REMINDERS_KEY, taskId],
    queryFn: () => remindersApi.list(taskId),
    enabled: !!taskId,
  });
}

export function useCreateReminder(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ReminderCreateInput) => remindersApi.create(taskId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [REMINDERS_KEY, taskId] }),
  });
}

export function useDeleteReminder(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reminderId: string) => remindersApi.delete(taskId, reminderId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [REMINDERS_KEY, taskId] }),
  });
}
