import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "リスト" },
  { to: "/kanban", label: "カンバン" },
  { to: "/settings", label: "設定" },
];

export default function Navbar() {
  return (
    <nav className="bg-blue-600 text-white px-6 py-3 flex items-center gap-6 shadow">
      <span className="font-bold text-lg mr-4">タスク管理</span>
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.to === "/"}
          className={({ isActive }) =>
            isActive ? "underline font-semibold" : "hover:underline"
          }
        >
          {l.label}
        </NavLink>
      ))}
    </nav>
  );
}
