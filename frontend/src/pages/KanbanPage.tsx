import { useTasks } from "../hooks/useTasks";
import KanbanBoard from "../components/KanbanBoard";

export default function KanbanPage() {
  const { data: tasks = [], isLoading } = useTasks();

  return (
    <div className="px-4 py-6 h-[calc(100vh-56px)]">
      <h1 className="text-2xl font-bold text-gray-800 mb-5">カンバンボード</h1>
      {isLoading ? (
        <p className="text-gray-500 text-sm">読み込み中...</p>
      ) : (
        <KanbanBoard tasks={tasks} />
      )}
    </div>
  );
}
