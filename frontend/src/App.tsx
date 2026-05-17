import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import TaskListPage from "./pages/TaskListPage";
import KanbanPage from "./pages/KanbanPage";
import TaskDetailPage from "./pages/TaskDetailPage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<TaskListPage />} />
          <Route path="/kanban" element={<KanbanPage />} />
          <Route path="/tasks/:id" element={<TaskDetailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}
