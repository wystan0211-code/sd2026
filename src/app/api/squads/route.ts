import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const squads = await prisma.squad.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ squads });
}

// 管理員可調整小隊代表色 / 圖示 key（角色本身固定，僅供之後置換素材用）
export async function PATCH(req: NextRequest) {
  const session = getSession();
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: "只有管理員可以編輯小隊設定" }, { status: 403 });
  }
  const { code, color, iconKey } = await req.json();
  const squad = await prisma.squad.update({
    where: { code },
    data: {
      ...(color ? { color } : {}),
      ...(iconKey ? { iconKey } : {}),
    },
  });
  return NextResponse.json({ squad });
}
