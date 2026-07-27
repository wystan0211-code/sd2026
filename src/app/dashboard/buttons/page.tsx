"use client";

import { useState } from "react";
import useSWR from "swr";
import { useSession } from "@/lib/useSession";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ButtonsPage() {
  const { session } = useSession();
  const { data, mutate } = useSWR(session?.roles?.isAdmin ? "/api/buttons" : null, fetcher);
  const buttons = data?.buttons ?? [];

  const [label, setLabel] = useState("");
  const [points, setPoints] = useState("");

  if (!session?.roles?.isAdmin) {
    return <p className="text-ink/50">只有管理員可以查看此頁面</p>;
  }

  async function addButton() {
    if (!label || !points) return;
    await fetch("/api/buttons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, points: Number(points), sortOrder: buttons.length + 1 }),
    });
    setLabel("");
    setPoints("");
    mutate();
  }

  async function updateButton(id: string, data: any) {
    await fetch(`/api/buttons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    mutate();
  }

  async function removeButton(id: string) {
    if (!confirm("確定要刪除這個按鈕嗎？")) return;
    await fetch(`/api/buttons/${id}`, { method: "DELETE" });
    mutate();
  }

  return (
    <div>
      <h1 className="text-2xl font-black mb-1">加扣分按鈕設定</h1>
      <p className="text-sm text-ink/50 mb-4">
        此處設定的按鈕，會同步套用給所有身分（老師／實驗助理／隊輔／值星官等）
      </p>

      <div className="card p-5 mb-6">
        <h2 className="font-black mb-3">新增按鈕</h2>
        <div className="flex gap-2">
          <input
            className="rounded-xl border border-ink/10 px-3 py-2"
            placeholder="按鈕文字"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <input
            className="rounded-xl border border-ink/10 px-3 py-2 w-28"
            placeholder="分數（可負數）"
            type="number"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
          />
          <button className="btn-primary" onClick={addButton}>
            新增
          </button>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-black mb-3">目前按鈕列表</h2>
        <div className="flex flex-col gap-2">
          {buttons.map((b: any) => (
            <div key={b.id} className="flex items-center gap-2">
              <input
                defaultValue={b.label}
                onBlur={(e) => updateButton(b.id, { label: e.target.value })}
                className="rounded-xl border border-ink/10 px-3 py-2 flex-1"
              />
              <input
                defaultValue={b.points}
                type="number"
                onBlur={(e) => updateButton(b.id, { points: Number(e.target.value) })}
                className="rounded-xl border border-ink/10 px-3 py-2 w-24"
              />
              <button className="msi text-red-500" onClick={() => removeButton(b.id)}>
                delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
