import type { Task, TaskStatus } from "../types";
import TaskCard from "./TaskCard";

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: "未着手", label: "未着手", color: "bg-gray-100" },
  { status: "進行中", label: "進行中", color: "bg-blue-50" },
  { status: "完了", label: "完了", color: "bg-green-50" },
];

interface Props {
  tasks: Task[];
}

export default function KanbanBoard({ tasks }: Props) {
  const grouped = (status: TaskStatus) => tasks.filter((t) => t.status === status);

  return (
    <div className="grid grid-cols-3 gap-4 h-full">
      {COLUMNS.map((col) => (
        <div key={col.status} className={`${col.color} rounded-lg p-3`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-700">{col.label}</h3>
            <span className="text-xs bg-white rounded-full px-2 py-0.5 text-gray-500">
              {grouped(col.status).length}
            </span>
          </div>
          <div className="space-y-2">
            {grouped(col.status).map((task) => (
              <TaskCard key={task.id} task={task} compact />
            ))}
            {grouped(col.status).length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">タスクなし</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
