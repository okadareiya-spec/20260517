import { useState } from "react";
import type { Task, TaskCreateInput, TaskPriority } from "../types";
import { useCategories } from "../hooks/useCategories";

interface Props {
  initial?: Partial<Task>;
  onSubmit: (data: TaskCreateInput) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function TaskForm({ initial, onSubmit, onCancel, loading }: Props) {
  const { data: categories = [] } = useCategories();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [memo, setMemo] = useState(initial?.memo ?? "");
  const [priority, setPriority] = useState<TaskPriority>(initial?.priority ?? "中");
  const [due_date, setDueDate] = useState(
    initial?.due_date ? initial.due_date.slice(0, 16) : ""
  );
  const [category_id, setCategoryId] = useState(initial?.category_id ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      memo: memo || undefined,
      priority,
      due_date: due_date ? new Date(due_date).toISOString() : undefined,
      category_id: category_id || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">タイトル *</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="タスク名を入力"
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">優先度</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          >
            {(["高", "中", "低"] as TaskPriority[]).map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
          <select
            value={category_id}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="">なし</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">期日</label>
        <input
          type="datetime-local"
          value={due_date}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          placeholder="メモを入力（任意）"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "保存中..." : "保存"}
        </button>
      </div>
    </form>
  );
}
