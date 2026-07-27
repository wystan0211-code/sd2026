"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "登入失敗");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="card p-8 w-full max-w-sm">
        <h1 className="text-2xl font-black text-primary mb-1">登入後台</h1>
        <p className="text-sm text-ink/50 mb-6">營隊計分平台管理系統</p>

        <label className="block text-sm font-bold mb-1">帳號</label>
        <input
          className="w-full rounded-xl border border-ink/10 px-4 py-2 mb-4 outline-none focus:ring-2 focus:ring-primary"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
        />

        <label className="block text-sm font-bold mb-1">密碼</label>
        <input
          type="password"
          className="w-full rounded-xl border border-ink/10 px-4 py-2 mb-4 outline-none focus:ring-2 focus:ring-primary"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "登入中…" : "登入"}
        </button>
      </form>
    </main>
  );
}
