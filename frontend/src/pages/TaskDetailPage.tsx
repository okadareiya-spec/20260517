import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTask, useUpdateTask, useDeleteTask, useAddDependency, useRemoveDependency, useTasks } from "../hooks/useTasks";
import { useReminders, useCreateReminder, useDeleteReminder } from "../hooks/useReminders";
import TaskForm from "../components/TaskForm";
import type { DependencyType } from "../types";

const PRIORITY_COLOR: Record<string, string> = {
  高: "text-red-600",
  中: "text-yellow-600",
  低: "text-green-600",
};

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: task, isLoading } = useTask(id!);
  const { data: allTasks = [] } = useTasks();
  const { data: reminders = [] } = useReminders(id!);
  const updateTask = useUpdateTask(id!);
  const deleteTask = useDeleteTask();
  const addDep = useAddDependency(id!);
  const removeDep = useRemoveDependency(id!);
  const createReminder = useCreateReminder(id!);
  const deleteReminder = useDeleteReminder(id!);

  const [editing, setEditing] = useState(false);
  const [depTaskId, setDepTaskId] = useState("");
  const [depType, setDepType] = useState<DependencyType>("FS");
  const [remDays, setRemDays] = useState(0);
  const [remHours, setRemHours] = useState(1);

  if (isLoading) return <p className="p-6 text-gray-500">読み込み中...</p>;
  if (!task) return <p className="p-6 text-gray-500">タスクが見つかりません</p>;

  const otherTasks = allTasks.filter((t) => t.id !== id);

  const handleDelete = () => {
    if (!confirm(`「${task.title}」を削除しますか？`)) return;
    deleteTask.mutate(task.id, {
      onSuccess: () => navigate("/"),
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "削除に失敗しました";
        alert(msg);
      },
    });
  };

  const handleAddDep = () => {
    if (!depTaskId) return;
    addDep.mutate(
      { depends_on_task_id: depTaskId, dependency_type: depType },
      {
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "依存関係の追加に失敗しました";
          alert(msg);
        },
      }
    );
  };

  const handleAddReminder = () => {
    if (remDays === 0 && remHours === 0) return alert("0より大きい値を入力してください");
    createReminder.mutate(
      { notify_before_days: remDays, notify_before_hours: remHours },
      {
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "リマインド追加に失敗しました";
          alert(msg);
        },
      }
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <button onClick={() => navigate(-1)} className="text-blue-600 text-sm mb-4 hover:underline">
        ← 戻る
      </button>

      {editing ? (
        <div className="bg-white border rounded-lg p-5 shadow-sm">
          <h2 className="font-semibold mb-4">タスクを編集</h2>
          <TaskForm
            initial={task}
            onSubmit={(data) => updateTask.mutate(data, { onSuccess: () => setEditing(false) })}
            onCancel={() => setEditing(false)}
            loading={updateTask.isPending}
          />
        </div>
      ) : (
        <div className="bg-white border rounded-lg p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <h1 className="text-xl font-bold text-gray-800">{task.title}</h1>
            <div className="flex gap-2 shrink-0 ml-4">
              <button onClick={() => setEditing(true)} className="text-sm text-blue-600 hover:underline">編集</button>
              <button onClick={handleDelete} className="text-sm text-red-500 hover:underline">削除</button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-600">
            <div>ステータス: <span className="font-medium">{task.status}</span></div>
            <div>優先度: <span className={`font-medium ${PRIORITY_COLOR[task.priority]}`}>{task.priority}</span></div>
            <div>カテゴリ: {task.category?.name ?? "なし"}</div>
            <div>期日: {task.due_date ? new Date(task.due_date).toLocaleString("ja-JP") : "なし"}</div>
            {task.completed_at && (
              <div className="col-span-2">完了日時: {new Date(task.completed_at).toLocaleString("ja-JP")}</div>
            )}
          </div>

          {task.memo && (
            <div className="mt-3 text-sm text-gray-600 bg-gray-50 rounded p-3 whitespace-pre-wrap">{task.memo}</div>
          )}
        </div>
      )}

      {/* 依存関係 */}
      <section className="mt-6">
        <h2 className="font-semibold text-gray-700 mb-3">依存関係</h2>
        {task.dependencies.length === 0 ? (
          <p className="text-sm text-gray-400">依存関係なし</p>
        ) : (
          <ul className="space-y-2 mb-3">
            {task.dependencies.map((dep) => (
              <li key={dep.id} className="flex items-center justify-between bg-white border rounded px-3 py-2 text-sm">
                <span>
                  <span className="font-medium text-blue-700">[{dep.dependency_type}]</span>{" "}
                  {dep.depends_on_task_title}
                </span>
                <button
                  onClick={() => removeDep.mutate(dep.id)}
                  className="text-red-400 hover:text-red-600 text-xs"
                >
                  削除
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2 items-center mt-2">
          <select
            value={depTaskId}
            onChange={(e) => setDepTaskId(e.target.value)}
            className="border rounded px-2 py-1 text-sm flex-1"
          >
            <option value="">タスクを選択</option>
            {otherTasks.map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
          <select
            value={depType}
            onChange={(e) => setDepType(e.target.value as DependencyType)}
            className="border rounded px-2 py-1 text-sm w-20"
          >
            <option value="FS">FS</option>
            <option value="FF">FF</option>
          </select>
          <button
            onClick={handleAddDep}
            disabled={!depTaskId || addDep.isPending}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            追加
          </button>
        </div>
      </section>

      {/* リマインド */}
      <section className="mt-6">
        <h2 className="font-semibold text-gray-700 mb-3">リマインド</h2>
        {!task.due_date && (
          <p className="text-xs text-amber-600 mb-2">期日を設定するとリマインドが設定できます</p>
        )}
        {reminders.length === 0 ? (
          <p className="text-sm text-gray-400 mb-3">リマインドなし</p>
        ) : (
          <ul className="space-y-2 mb-3">
            {reminders.map((r) => (
              <li key={r.id} className="flex items-center justify-between bg-white border rounded px-3 py-2 text-sm">
                <span>
                  {r.notify_before_days > 0 && `${r.notify_before_days}日`}
                  {r.notify_before_hours > 0 && `${r.notify_before_hours}時間`}前
                  {" "}
                  <span className="text-gray-400 text-xs">
                    ({new Date(r.scheduled_at).toLocaleString("ja-JP")})
                  </span>
                  {r.is_sent && <span className="ml-2 text-green-600 text-xs">送信済</span>}
                </span>
                <button
                  onClick={() => deleteReminder.mutate(r.id)}
                  className="text-red-400 hover:text-red-600 text-xs"
                >
                  削除
                </button>
              </li>
            ))}
          </ul>
        )}
        {task.due_date && (
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min={0}
              value={remDays}
              onChange={(e) => setRemDays(Number(e.target.value))}
              className="border rounded px-2 py-1 text-sm w-16"
              placeholder="日"
            />
            <span className="text-sm text-gray-600">日</span>
            <input
              type="number"
              min={0}
              value={remHours}
              onChange={(e) => setRemHours(Number(e.target.value))}
              className="border rounded px-2 py-1 text-sm w-16"
              placeholder="時間"
            />
            <span className="text-sm text-gray-600">時間前</span>
            <button
              onClick={handleAddReminder}
              disabled={createReminder.isPending}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              追加
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
