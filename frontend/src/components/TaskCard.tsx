import { Link } from "react-router-dom";
import type { Task, TaskStatus } from "../types";
import { useUpdateStatus, useDeleteTask } from "../hooks/useTasks";

const PRIORITY_COLOR: Record<string, string> = {
  高: "bg-red-100 text-red-700",
  中: "bg-yellow-100 text-yellow-700",
  低: "bg-green-100 text-green-700",
};

const STATUS_NEXT: Record<TaskStatus, TaskStatus | null> = {
  未着手: "進行中",
  進行中: "完了",
  完了: null,
};

function isOverdue(task: Task): boolean {
  if (!task.due_date || task.status === "完了") return false;
  return new Date(task.due_date) < new Date();
}

interface Props {
  task: Task;
  compact?: boolean;
}

export default function TaskCard({ task, compact = false }: Props) {
  const updateStatus = useUpdateStatus();
  const deleteTask = useDeleteTask();
  const nextStatus = STATUS_NEXT[task.status];

  const handleAdvance = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!nextStatus) return;
    updateStatus.mutate(
      { id: task.id, status: nextStatus },
      {
        onError: (err: unknown) => {
          const msg =
            (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
            "ステータス変更に失敗しました";
          alert(msg);
        },
      }
    );
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm(`「${task.title}」を削除しますか？`)) return;
    deleteTask.mutate(task.id, {
      onError: (err: unknown) => {
        const msg =
          (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
          "削除に失敗しました";
        alert(msg);
      },
    });
  };

  return (
    <Link
      to={`/tasks/${task.id}`}
      className={`block bg-white border rounded-lg p-4 hover:shadow-md transition-shadow ${
        isOverdue(task) ? "border-red-400" : "border-gray-200"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium text-gray-800 flex-1 leading-snug">{task.title}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLOR[task.priority]}`}>
          {task.priority}
        </span>
      </div>

      {!compact && (
        <>
          {task.category && (
            <div className="mt-1 flex items-center gap-1">
              {task.category.color && (
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: task.category.color }}
                />
              )}
              <span className="text-xs text-gray-500">{task.category.name}</span>
            </div>
          )}
          {task.due_date && (
            <p className={`text-xs mt-1 ${isOverdue(task) ? "text-red-600 font-semibold" : "text-gray-500"}`}>
              期日: {new Date(task.due_date).toLocaleDateString("ja-JP")}
              {isOverdue(task) && " ⚠ 超過"}
            </p>
          )}
          {task.dependencies.length > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              依存: {task.dependencies.map((d) => `${d.depends_on_task_title}(${d.dependency_type})`).join(", ")}
            </p>
          )}
        </>
      )}

      <div className="mt-3 flex items-center gap-2">
        {nextStatus && (
          <button
            onClick={handleAdvance}
            disabled={updateStatus.isPending}
            className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            → {nextStatus}
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={deleteTask.isPending}
          className="text-xs text-red-500 hover:text-red-700 ml-auto disabled:opacity-50"
        >
          削除
        </button>
      </div>
    </Link>
  );
}
