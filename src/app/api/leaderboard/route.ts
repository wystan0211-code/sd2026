import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { maskName } from "@/lib/nameMask";

export const dynamic = "force-dynamic";

// 公開排行榜：不需登入，姓名自動遮蔽。
// 前端用 SWR 每 2~3 秒輪詢一次，達到「即時同步」效果。
export async function GET() {
  const students = await prisma.student.findMany({
    include: { squad: true },
    orderBy: { score: "desc" },
  });

  const ranked = students.map((s: (typeof students)[number], idx: number) => ({
    rank: idx + 1,
    id: s.id,
    displayName: maskName(s.name),
    squadCode: s.squad.code,
    squadColor: s.squad.color,
    iconKey: s.squad.iconKey,
    score: s.score,
  }));

  return NextResponse.json({ leaderboard: ranked, updatedAt: new Date().toISOString() });
}
