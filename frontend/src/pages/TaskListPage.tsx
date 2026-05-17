import { useState } from "react";
import type { TaskStatus } from "../types";
import { useTasks, useCreateTask } from "../hooks/useTasks";
import { useCategories } from "../hooks/useCategories";
import TaskCard from "../components/TaskCard";
import TaskForm from "../components/TaskForm";

const STATUS_OPTIONS: { value: TaskStatus | ""; label: string }[] = [
  { value: "", label: "すべて" },
  { value: "未着手", label: "未着手" },
  { value: "進行中", label: "進行中" },
  { value: "完了", label: "完了" },
];

export default function TaskListPage() {
  const [status, setStatus] = useState<TaskStatus | "">("");
  const [categoryId, setCategoryId] = useState("");
  const [sort, setSort] = useState("created_at");
  const [showForm, setShowForm] = useState(false);

  const { data: tasks = [], isLoading } = useTasks({
    status: status || undefined,
    category_id: categoryId || undefined,
    sort,
  });
  const { data: categories = [] } = useCategories();
  const createTask = useCreateTask();

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">タスク一覧</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
        >
          ＋ 新規作成
        </button>
      </div>

      {showForm && (
        <div className="bg-white border rounded-lg p-5 mb-6 shadow-sm">
          <h2 className="font-semibold mb-4 text-gray-700">新しいタスク</h2>
          <TaskForm
            onSubmit={(data) => {
              createTask.mutate(data, { onSuccess: () => setShowForm(false) });
            }}
            onCancel={() => setShowForm(false)}
            loading={createTask.isPending}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-5">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as TaskStatus | "")}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm"
        >
          <option value="">カテゴリ: すべて</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm"
        >
          <option value="created_at">作成日順</option>
          <option value="due_date">期日順</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-gray-500 text-sm">読み込み中...</p>
      ) : tasks.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-16">タスクがありません</p>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
