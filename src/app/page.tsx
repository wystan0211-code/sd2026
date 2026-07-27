"use client";

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

  return (
    <main className="min-h-screen">
      <header className="flex items-center justify-between px-6 md:px-10 py-5">
        <button
          onClick={() => mutate()}
          className="h-[6.75rem] flex items-center cursor-pointer"
          title="點一下立即重新整理"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/kexuebang.svg" alt="科學榜" className="h-full w-auto" />
        </button>
        <Link href="/login" className="btn-outline flex items-center gap-1">
          <span className="msi">login</span>
          登入
        </Link>
      </header>

      <section className="px-4 md:px-10 pb-16">
        <div className="card overflow-hidden">
          {/* 標題列：名次｜頭像｜姓名（靠左） 組別｜積分（靠右） */}
          <div className="flex items-center px-5 py-3 text-sm font-bold text-ink/60 border-b border-ink/5">
            <div className="w-14 text-center">名次</div>
            <div className="w-14"></div>
            <div className="flex-1">姓名</div>
            <div className="w-20 text-right">組別</div>
            <div className="w-24 text-right">積分</div>
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
                    "w-14 text-center " +
                    (row.rank <= 3 ? "text-3xl font-black" : "text-base font-bold text-ink/70")
                  }
                >
                  {row.rank}
                </div>
                <div className="w-14 flex justify-center">
                  <SquadAvatar iconKey={row.iconKey} color={row.squadColor} size={40} />
                </div>
                <div className="flex-1 font-bold">{row.displayName}</div>
                <div className="w-20 text-right text-sm font-bold text-ink/60">
                  {row.squadCode}
                </div>
                <div className="w-24 text-right text-2xl font-black text-primary">
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
