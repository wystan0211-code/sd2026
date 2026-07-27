import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { canDeleteLog } from "@/lib/permissions";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "請先登入" }, { status: 401 });
  if (!canDeleteLog(session)) {
    return NextResponse.json({ error: "只有管理員可以刪除紀錄" }, { status: 403 });
  }

  const log = await prisma.scoreLog.findUnique({ where: { id: params.id } });
  if (!log) return NextResponse.json({ error: "找不到該筆紀錄" }, { status: 404 });

  // 刪除紀錄只是把這筆「操作紀錄」從列表中移除（軟刪除，仍保留在資料庫供稽核），
  // 不會去反轉已經套用的分數——如果也要把分數改回來，請先用「復原」再刪除。
  await prisma.scoreLog.update({ where: { id: log.id }, data: { isDeleted: true } });
  return NextResponse.json({ ok: true });
}
