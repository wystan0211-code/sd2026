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

  // 若尚未復原，刪除紀錄時也要把分數扣回，保持總分正確
  const ops = [];
  if (!log.isUndone) {
    ops.push(
      prisma.student.update({
        where: { id: log.studentId },
        data: { score: { decrement: log.points } },
      })
    );
  }
  ops.push(prisma.scoreLog.update({ where: { id: log.id }, data: { isDeleted: true } }));

  await prisma.$transaction(ops);
  return NextResponse.json({ ok: true });
}
