"use client";

import { useState } from "react";
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
  const [collapsed, setCollapsed] = useState(false);

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
      <aside
        className={
          "shrink-0 bg-white border-r border-ink/5 p-4 flex flex-col transition-all duration-200 " +
          (collapsed ? "w-20 items-center" : "w-64")
        }
      >
        <div className={"mb-8 " + (collapsed ? "flex justify-center" : "")}>
          {collapsed ? (
            <button
              onClick={() => setCollapsed(false)}
              title="展開側欄"
              className="cursor-pointer"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo/icon.svg" alt="展開" className="w-10 h-10" />
            </button>
          ) : (
            <button
              onClick={() => setCollapsed(true)}
              title="收合側欄"
              className="cursor-pointer"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo/kexuebang.svg" alt="科學榜" className="h-10 w-auto" />
            </button>
          )}
          {!collapsed && <p className="text-sm text-ink/50 mt-2">{session.name}</p>}
        </div>

        <nav className="flex-1 flex flex-col gap-1 w-full">
          {NAV.filter((item) => !item.adminOnly || session.roles?.isAdmin).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={
                "flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition " +
                (collapsed ? "justify-center" : "") +
                " " +
                (pathname === item.href
                  ? "bg-primary text-white"
                  : "text-ink/70 hover:bg-ink/5")
              }
            >
              <span className="msi">{item.icon}</span>
              {!collapsed && item.label}
            </Link>
          ))}
        </nav>

        <div className={"flex flex-col gap-1 w-full " + (collapsed ? "items-center" : "")}>
          <Link
            href="/"
            title="查看公開排行榜"
            className={
              "flex items-center gap-2 px-3 py-2 rounded-xl text-ink/50 hover:bg-ink/5 " +
              (collapsed ? "justify-center" : "")
            }
          >
            <span className="msi">density_medium</span>
            {!collapsed && "查看公開排行榜"}
          </Link>
          <button
            onClick={handleLogout}
            title="登出"
            className={
              "flex items-center gap-2 px-3 py-2 rounded-xl text-ink/50 hover:bg-ink/5 text-left " +
              (collapsed ? "justify-center" : "")
            }
          >
            <span className="msi">logout</span>
            {!collapsed && "登出"}
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-8">{children}</main>
    </div>
  );
}
