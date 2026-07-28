"use client";

import { useEffect, useState } from "react";
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

  // 手機（窄螢幕）預設用窄版圖示側欄，桌面預設展開；使用者仍可自行切換
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setCollapsed(true);
    }
  }, []);

  if (isLoading) return <div className="p-10 text-ink/40">載入中…</div>;
  if (!session?.authenticated) {
    if (typeof window !== "undefined") router.replace("/login");
    return null;
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const ROLE_LABELS: { key: string; label: string }[] = [
    { key: "isAdmin", label: "管理員" },
    { key: "isTeacher", label: "老師" },
    { key: "isAssistant", label: "實驗助理" },
    { key: "isCounselor", label: "隊輔" },
    { key: "isOfficer", label: "值星官" },
    { key: "isChiefOfficer", label: "總值星" },
    { key: "isDeputyChiefOfficer", label: "副總值星" },
  ];
  const roleText = ROLE_LABELS.filter((r) => (session.roles as any)?.[r.key])
    .map((r) => r.label)
    .join("、");

  return (
    <div className="h-screen overflow-hidden flex">
      {/* 手機上一律用 fixed 定位：收合時是窄版圖示列，展開時延伸為全螢幕；
          桌面（md 以上）則還原成一般並排的側欄，寬度在 w-20 / w-64 間切換 */}
      <aside
        className={
          "fixed left-0 top-0 h-screen z-50 bg-white border-r border-ink/5 p-4 flex flex-col " +
          "transition-all duration-300 ease-in-out overflow-hidden " +
          "md:static md:z-auto " +
          (collapsed ? "w-20 items-center md:items-center" : "w-full md:w-72 items-center md:items-stretch")
        }
      >
        <div className={"mb-8 shrink-0 " + (collapsed ? "flex justify-center" : "flex items-center justify-between")}>
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
            <>
              <button
                onClick={() => setCollapsed(true)}
                title="收合側欄"
                className="cursor-pointer shrink-0"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo/kexuebang.svg" alt="科學榜" className="h-[5.625rem] w-auto" />
              </button>
              <div className="h-[5.625rem] flex flex-col justify-center items-end text-right ml-2 min-w-0">
                {/* 桌面：恢復成單行「姓名｜職位」 */}
                <p className="hidden md:block text-sm font-bold text-ink/70 truncate w-full">
                  {session.name}
                  {roleText && <>｜{roleText}</>}
                </p>
                {/* 手機：兩行顯示，不使用｜分隔 */}
                <p className="md:hidden text-sm font-bold text-ink/70 truncate w-full">
                  {session.name}
                </p>
                <p className="md:hidden text-xs text-ink/50 truncate w-full">{roleText}</p>
              </div>
            </>
          )}
        </div>

        <nav className="flex-1 flex flex-col gap-1 w-full overflow-y-auto">
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

        <div className={"flex flex-col gap-1 w-full shrink-0 " + (collapsed ? "items-center" : "")}>
          <Link
            href="/"
            title="查看科學榜"
            className={
              "flex items-center gap-2 px-3 py-2 rounded-xl text-ink/50 hover:bg-ink/5 " +
              (collapsed ? "justify-center" : "")
            }
          >
            <span className="msi">density_medium</span>
            {!collapsed && "查看科學榜"}
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

      {/* 手機上側欄用 fixed 定位不占版面空間，這裡用固定左邊界留出窄版圖示列的寬度 */}
      <main className="flex-1 h-screen overflow-y-auto ml-20 md:ml-0 p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
