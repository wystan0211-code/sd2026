"use client";

import useSWR from "swr";
import { useSession } from "@/lib/useSession";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "管理員",
  TEACHER: "老師",
  ASSISTANT: "實驗助理／隊輔",
  OFFICER: "值星官",
  CHIEF_OFFICER: "總值星",
  UNDO: "復原操作",
};

export default function LogsPage() {
  const { session } = useSession();
  const { data, mutate } = useSWR("/api/score", fetcher, { refreshInterval: 4000 });
  const logs = data?.logs ?? [];
  const isAdmin = !!session?.roles?.isAdmin;

  async function undo(id: string) {
    const res = await fetch(`/api/score/${id}/undo`, { method: "POST" });
    if (!res.ok) {
      const d = await res.json();
      alert(d.error);
      return;
    }
    mutate();
  }

  async function remove(id: string) {
    if (!confirm("確定要刪除這筆紀錄嗎？（此動作不可復原）")) return;
    const res = await fetch(`/api/score/${id}/delete`, { method: "POST" });
    if (!res.ok) {
      const d = await res.json();
      alert(d.error);
      return;
    }
    mutate();
  }

  return (
    <div>
      <h1 className="text-2xl font-black mb-1">加扣分紀錄</h1>
      <p className="text-sm text-ink/50 mb-4">
        淡色小方塊標示本次操作所使用的執行身分；復原／刪除權限依身分不同而有差異
      </p>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-ink/5 text-ink/50">
              <th className="p-3">時間</th>
              <th className="p-3">學生</th>
              <th className="p-3">分數</th>
              <th className="p-3">模式／按鈕</th>
              <th className="p-3">操作人（身分）</th>
              <th className="p-3">狀態</th>
              <th className="p-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l: any) => (
              <tr key={l.id} className="border-b border-ink/5 last:border-b-0">
                <td className="p-3 text-ink/40 text-xs">
                  {new Date(l.createdAt).toLocaleString("zh-TW")}
                </td>
                <td className="p-3 font-bold">{l.studentName}</td>
                <td className={"p-3 font-black " + (l.points >= 0 ? "text-primary" : "text-red-600")}>
                  {l.points >= 0 ? "+" : ""}
                  {l.points}
                </td>
                <td className="p-3 text-ink/60">{l.sourceLabel ?? l.mode}</td>
                <td className="p-3">
                  <span className="text-xs bg-ink/5 px-2 py-1 rounded-lg">
                    {l.operatorName} · 以{ROLE_LABEL[l.actingAs] ?? l.actingAs}身分
                  </span>
                </td>
                <td className="p-3 text-xs text-ink/40">{l.isUndone ? "已復原" : "正常"}</td>
                <td className="p-3 flex gap-2">
                  {!l.isUndone && (
                    <button className="msi text-ink/60" title="復原" onClick={() => undo(l.id)}>
                      undo
                    </button>
                  )}
                  {isAdmin && (
                    <button className="msi text-red-500" title="刪除" onClick={() => remove(l.id)}>
                      delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-ink/40">
                  尚無紀錄
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
