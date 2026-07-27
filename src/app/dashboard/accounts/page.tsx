"use client";

import { useRef, useState } from "react";
import useSWR from "swr";
import { useSession } from "@/lib/useSession";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const ROLE_FIELDS = [
  { key: "isAdmin", label: "管理員" },
  { key: "isTeacher", label: "老師" },
  { key: "isAssistant", label: "實驗助理／隊輔" },
  { key: "isOfficer", label: "值星官" },
  { key: "isChiefOfficer", label: "總值星" },
];

export default function AccountsPage() {
  const { session } = useSession();
  const { data, mutate } = useSWR(session?.roles?.isAdmin ? "/api/accounts" : null, fetcher);
  const accounts = data?.accounts ?? [];

  const [form, setForm] = useState<any>({ name: "", username: "", password: "" });
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);

  if (!session?.roles?.isAdmin) {
    return <p className="text-ink/50">只有管理員可以查看此頁面</p>;
  }

  function toggleRole(key: string) {
    setForm((f: any) => ({ ...f, [key]: !f[key] }));
  }

  async function createAccount() {
    if (!form.name || !form.username || !form.password) {
      alert("姓名、帳號、密碼為必填");
      return;
    }
    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ name: "", username: "", password: "" });
      mutate();
    } else {
      const d = await res.json();
      alert(d.error);
    }
  }

  async function toggleAccountRole(id: string, key: string, value: boolean) {
    await fetch(`/api/accounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
    mutate();
  }

  async function toggleSuspend(id: string, suspended: boolean) {
    await fetch(`/api/accounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suspended }),
    });
    mutate();
  }

  async function removeAccount(id: string) {
    if (!confirm("確定要刪除此帳號嗎？")) return;
    await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    mutate();
  }

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/accounts/upload", { method: "POST", body: formData });
    const d = await res.json();
    setUploadResult(d);
    mutate();
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div>
      <h1 className="text-2xl font-black mb-4">帳號管理</h1>

      <div className="card p-5 mb-6">
        <h2 className="font-black mb-3">
          批次上傳 Excel（欄位：姓名、帳號、密碼，各身分欄位填 1 或 0：管理員／老師／實驗助理／隊輔／值星官／總值星）
        </h2>
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
      </div>

      <div className="card p-5 mb-6">
        <h2 className="font-black mb-3">手動新增帳號（勾選多重身分）</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          <input
            className="rounded-xl border border-ink/10 px-3 py-2"
            placeholder="姓名"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className="rounded-xl border border-ink/10 px-3 py-2"
            placeholder="帳號"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
          <input
            className="rounded-xl border border-ink/10 px-3 py-2"
            placeholder="密碼"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <div className="flex flex-wrap gap-4 mb-3">
          {ROLE_FIELDS.map((r) => (
            <label key={r.key} className="flex items-center gap-1 text-sm font-bold">
              <input type="checkbox" checked={!!form[r.key]} onChange={() => toggleRole(r.key)} />
              {r.label}
            </label>
          ))}
        </div>
        <button className="btn-primary" onClick={createAccount}>
          新增帳號
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-ink/5 text-ink/50">
              <th className="p-3">姓名</th>
              <th className="p-3">帳號</th>
              {ROLE_FIELDS.map((r) => (
                <th key={r.key} className="p-3">
                  {r.label}
                </th>
              ))}
              <th className="p-3">停權</th>
              <th className="p-3">刪除</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a: any) => (
              <tr key={a.id} className="border-b border-ink/5 last:border-b-0">
                <td className="p-3 font-bold">{a.name}</td>
                <td className="p-3 text-ink/50">{a.username}</td>
                {ROLE_FIELDS.map((r) => (
                  <td key={r.key} className="p-3">
                    <input
                      type="checkbox"
                      checked={!!a[r.key]}
                      onChange={(e) => toggleAccountRole(a.id, r.key, e.target.checked)}
                    />
                  </td>
                ))}
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={a.suspended}
                    onChange={(e) => toggleSuspend(a.id, e.target.checked)}
                  />
                </td>
                <td className="p-3">
                  <button className="msi text-red-500" onClick={() => removeAccount(a.id)}>
                    delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
