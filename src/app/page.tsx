"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import SquadAvatar from "@/components/SquadAvatar";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Row = {
  rank: number;
  id: string;
  displayName: string;
  squadCode: string;
  squadColor: string;
  iconKey: string;
  score: number;
};

export default function PublicLeaderboardPage() {
  // 每 2.5 秒輪詢一次，達到「即時同步」效果（有加扣分時所有人都會看到變化）
  const { data, mutate } = useSWR<{ leaderboard: Row[] }>("/api/leaderboard", fetcher, {
    refreshInterval: 2500,
  });

  const rows = data?.leaderboard ?? [];

  // 只有內容真的往上滑、跟標題列交疊時才顯示陰影，平常在頂端不顯示
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 4);
    }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className="min-h-screen">
      <header
        className={
          "sticky top-0 z-20 bg-bg flex items-center justify-between px-6 md:px-10 py-5 transition-shadow duration-200 " +
          (scrolled ? "shadow-[0_4px_10px_-2px_rgba(3,3,13,0.12)]" : "")
        }
      >
        <button
          onClick={() => mutate()}
          className="h-16 md:h-[6.75rem] flex items-center cursor-pointer"
          title="點一下立即重新整理"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/kexuebang.svg" alt="科學榜" className="h-full w-auto" />
        </button>
        <Link href="/login" className="btn-outline flex items-center gap-1 shrink-0">
          <span className="msi">login</span>
          登入
        </Link>
      </header>

      <section className="px-4 md:px-10 pb-16 pt-4">
        <div className="card overflow-hidden">
          {/* 標題列：名次｜頭像｜姓名（靠左） 組別｜積分（靠右） */}
          <div className="flex items-center px-5 py-3 text-sm font-bold text-ink/60 border-b border-ink/5">
            <div className="w-10 md:w-14 text-center shrink-0">名次</div>
            <div className="w-14 shrink-0"></div>
            <div className="flex-1 min-w-0">姓名</div>
            <div className="w-16 md:w-20 text-right shrink-0">組別</div>
            <div className="w-20 md:w-24 text-right shrink-0">積分</div>
          </div>

          <ul>
            {rows.map((row) => (
              <li
                key={row.id}
                className="flex items-center px-5 py-3 border-b border-ink/5 last:border-b-0 transition-all duration-500"
                style={
                  row.rank <= 3
                    ? { background: `${row.squadColor}22` }
                    : undefined
                }
              >
                <div
                  className={
                    "w-10 md:w-14 text-center shrink-0 " +
                    (row.rank <= 3
                      ? "text-xl md:text-3xl font-black"
                      : "text-sm md:text-base font-bold text-ink/70")
                  }
                >
                  {row.rank}
                </div>
                <div className="w-14 shrink-0 flex justify-center">
                  <SquadAvatar iconKey={row.iconKey} color={row.squadColor} size={40} />
                </div>
                <div className="flex-1 min-w-0 font-bold whitespace-nowrap overflow-hidden text-ellipsis">
                  {row.displayName}
                </div>
                <div className="w-16 md:w-20 text-right text-sm font-bold text-ink/60 shrink-0">
                  {row.squadCode}
                </div>
                <div className="w-20 md:w-24 text-right text-lg md:text-2xl font-black text-primary shrink-0">
                  {row.score}
                </div>
              </li>
            ))}
            {rows.length === 0 && (
              <li className="px-5 py-10 text-center text-ink/40">尚無學生資料</li>
            )}
          </ul>
        </div>
      </section>
    </main>
  );
}
