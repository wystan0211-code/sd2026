"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
      <div className="w-full max-w-sm">
        <form onSubmit={handleSubmit} className="card p-8">
          <div className="flex justify-end pr-4 mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo/kexuebang.svg" alt="科學榜" className="h-24 w-auto" />
          </div>

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

        <Link
          href="/"
          className="mt-4 w-full btn-outline flex items-center justify-center gap-1"
        >
          <span className="msi">arrow_back</span>
          返回科學榜
        </Link>
      </div>
    </main>
  );
}
