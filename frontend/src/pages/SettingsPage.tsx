import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationEmailsApi } from "../api/client";
import { useCreateCategory, useDeleteCategory, useCategories } from "../hooks/useCategories";

export default function SettingsPage() {
  const qc = useQueryClient();

  const { data: emails = [] } = useQuery({
    queryKey: ["notification-emails"],
    queryFn: notificationEmailsApi.list,
  });

  const addEmail = useMutation({
    mutationFn: (email: string) => notificationEmailsApi.add(email),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notification-emails"] });
      setNewEmail("");
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      alert(err.response?.data?.detail ?? "追加に失敗しました");
    },
  });

  const deleteEmail = useMutation({
    mutationFn: (id: string) => notificationEmailsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notification-emails"] });
    },
  });

  const [newEmail, setNewEmail] = useState("");

  const { data: categories = [] } = useCategories();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const [catName, setCatName] = useState("");
  const [catColor, setCatColor] = useState("#3B82F6");

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">設定</h1>

      {/* メール通知設定 */}
      <section className="bg-white border rounded-lg p-5 shadow-sm">
        <h2 className="font-semibold text-gray-700 mb-1">通知先メールアドレス</h2>
        <p className="text-xs text-gray-400 mb-4">
          タスク追加・削除・完了・リマインド発火時に登録アドレスへ通知が届きます
        </p>

        {/* 一覧 */}
        <ul className="space-y-2 mb-4">
          {emails.map((e) => (
            <li key={e.id} className="flex items-center justify-between text-sm bg-gray-50 rounded px-3 py-2">
              <span className="text-gray-700">{e.email}</span>
              <button
                onClick={() => {
                  if (!confirm(`「${e.email}」を削除しますか？`)) return;
                  deleteEmail.mutate(e.id);
                }}
                className="text-red-400 hover:text-red-600 text-xs ml-4"
              >
                削除
              </button>
            </li>
          ))}
          {emails.length === 0 && (
            <li className="text-sm text-gray-400">登録なし</li>
          )}
        </ul>

        {/* 追加フォーム */}
        <div className="flex gap-3">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newEmail.trim()) addEmail.mutate(newEmail.trim());
            }}
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="example@email.com"
          />
          <button
            onClick={() => { if (newEmail.trim()) addEmail.mutate(newEmail.trim()); }}
            disabled={addEmail.isPending || !newEmail.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            追加
          </button>
        </div>
      </section>

      {/* カテゴリ管理 */}
      <section className="bg-white border rounded-lg p-5 shadow-sm">
        <h2 className="font-semibold text-gray-700 mb-4">カテゴリ管理</h2>
        <ul className="space-y-2 mb-4">
          {categories.map((cat) => (
            <li key={cat.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {cat.color && (
                  <span
                    className="inline-block w-3 h-3 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                )}
                <span>{cat.name}</span>
              </div>
              <button
                onClick={() => {
                  if (!confirm(`「${cat.name}」を削除しますか？`)) return;
                  deleteCategory.mutate(cat.id);
                }}
                className="text-red-400 hover:text-red-600 text-xs"
              >
                削除
              </button>
            </li>
          ))}
          {categories.length === 0 && (
            <li className="text-sm text-gray-400">カテゴリなし</li>
          )}
        </ul>
        <div className="flex gap-2 items-center">
          <input
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
            placeholder="カテゴリ名"
            className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm"
          />
          <input
            type="color"
            value={catColor}
            onChange={(e) => setCatColor(e.target.value)}
            className="w-10 h-9 border rounded cursor-pointer"
            title="カラー"
          />
          <button
            onClick={() => {
              if (!catName.trim()) return;
              createCategory.mutate(
                { name: catName.trim(), color: catColor },
                { onSuccess: () => setCatName("") }
              );
            }}
            disabled={createCategory.isPending || !catName.trim()}
            className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            追加
          </button>
        </div>
      </section>
    </div>
  );
}
