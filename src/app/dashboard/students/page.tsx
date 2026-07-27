"use client";

import { useRef, useState } from "react";
import useSWR from "swr";
import { useSession } from "@/lib/useSession";
import SquadAvatar from "@/components/SquadAvatar";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function StudentsPage() {
  const { session } = useSession();
  const { data, mutate } = useSWR("/api/students", fetcher);
  const { data: squadsData } = useSWR("/api/squads", fetcher);
  const students = data?.students ?? [];
  const squads = squadsData?.squads ?? [];

  const [name, setName] = useState("");
  const [squadCode, setSquadCode] = useState("A1");
  const [uploadResult, setUploadResult] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const isAdmin = !!session?.roles?.isAdmin;

  async function addStudent() {
    if (!name.trim()) return;
    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, squadCode }),
    });
    if (res.ok) {
      setName("");
      mutate();
    } else {
      const d = await res.json();
      alert(d.error);
    }
  }

  async function changeSquad(id: string, code: string) {
    await fetch(`/api/students/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ squadCode: code }),
    });
    mutate();
  }

  async function removeStudent(id: string) {
    if (!confirm("確定要刪除這位學生嗎？")) return;
    await fetch(`/api/students/${id}`, { method: "DELETE" });
    mutate();
  }

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/students/upload", { method: "POST", body: formData });
    const d = await res.json();
    setUploadResult(d);
    mutate();
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div>
      <h1 className="text-2xl font-black mb-4">學生／小隊管理</h1>

      {isAdmin && (
        <div className="card p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black">批次上傳 Excel（欄位：姓名、小隊代號）</h2>
            <a href="/api/students/template" className="btn-outline whitespace-nowrap text-sm">
              下載範本
            </a>
          </div>
          <div className="flex items-center gap-3">
            <input ref={fileRef} type="file" accept=".xlsx,.xls" />
            <button className="btn-primary" onClick={handleUpload}>
              上傳
            </button>
          </div>
          {uploadResult && (
            <p className="text-sm mt-3">
              成功新增 {uploadResult.createdCount} 筆
              {uploadResult.errorCount > 0 && (
                <span className="text-red-600">
                  ，{uploadResult.errorCount} 筆有誤：{uploadResult.errors.join("；")}
                </span>
              )}
            </p>
          )}

          <div className="border-t border-ink/5 mt-5 pt-5">
            <h2 className="font-black mb-3">手動新增單一學生</h2>
            <div className="flex gap-2 items-center">
              <input
                className="rounded-xl border border-ink/10 px-3 py-2"
                placeholder="姓名"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <select
                className="rounded-xl border border-ink/10 px-3 py-2"
                value={squadCode}
                onChange={(e) => setSquadCode(e.target.value)}
              >
                {squads.map((s: any) => (
                  <option key={s.code} value={s.code}>
                    {s.code}
                  </option>
                ))}
              </select>
              <button className="btn-primary" onClick={addStudent}>
                新增
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-ink/5 text-ink/50">
              <th className="p-3">頭像</th>
              <th className="p-3">姓名</th>
              <th className="p-3">小隊</th>
              <th className="p-3">積分</th>
              {isAdmin && <th className="p-3">操作</th>}
            </tr>
          </thead>
          <tbody>
            {students.map((s: any) => (
              <tr key={s.id} className="border-b border-ink/5 last:border-b-0">
                <td className="p-3">
                  <SquadAvatar iconKey={s.squad.iconKey} color={s.squad.color} size={32} />
                </td>
                <td className="p-3 font-bold">{s.name}</td>
                <td className="p-3">
                  {isAdmin ? (
                    <select
                      value={s.squad.code}
                      onChange={(e) => changeSquad(s.id, e.target.value)}
                      className="rounded-lg border border-ink/10 px-2 py-1"
                    >
                      {squads.map((sq: any) => (
                        <option key={sq.code} value={sq.code}>
                          {sq.code}
                        </option>
                      ))}
                    </select>
                  ) : (
                    s.squad.code
                  )}
                </td>
                <td className="p-3 font-black text-primary">{s.score}</td>
                {isAdmin && (
                  <td className="p-3">
                    <button
                      onClick={() => removeStudent(s.id)}
                      className="msi text-red-500"
                      title="刪除"
                    >
                      delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
