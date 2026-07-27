"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/lib/useSession";

const NAV = [
  { href: "/dashboard", label: "計分操作", icon: "bolt" },
  { href: "/dashboard/logs", label: "加扣分紀錄", icon: "history" },
  { href: "/dashboard/students", label: "學生／小隊", icon: "groups" },
  { href: "/dashboard/accounts", label: "帳號管理", icon: "manage_accounts", adminOnly: true },
  { href: "/dashboard/buttons", label: "按鈕設定", icon: "tune", adminOnly: true },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  if (isLoading) return <div className="p-10 text-ink/40">載入中…</div>;
  if (!session?.authenticated) {
    if (typeof window !== "undefined") router.replace("/login");
    return null;
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 shrink-0 bg-white border-r border-ink/5 p-5 flex flex-col">
        <div className="mb-8">
          <p className="text-lg font-black text-primary">營隊計分平台</p>
          <p className="text-sm text-ink/50 mt-1">{session.name}</p>
        </div>
        <nav className="flex-1 flex flex-col gap-1">
          {NAV.filter((item) => !item.adminOnly || session.roles?.isAdmin).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                "flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition " +
                (pathname === item.href
                  ? "bg-primary text-white"
                  : "text-ink/70 hover:bg-ink/5")
              }
            >
              <span className="msi">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col gap-1">
          <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded-xl text-ink/50 hover:bg-ink/5">
            <span className="msi">public</span>
            查看公開排行榜
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-ink/50 hover:bg-ink/5 text-left"
          >
            <span className="msi">logout</span>
            登出
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-8">{children}</main>
    </div>
  );
}
