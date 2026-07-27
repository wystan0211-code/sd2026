import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { canUndoLog } from "@/lib/permissions";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "請先登入" }, { status: 401 });

  const log = await prisma.scoreLog.findUnique({ where: { id: params.id } });
  if (!log || log.isDeleted) {
    return NextResponse.json({ error: "找不到該筆紀錄" }, { status: 404 });
  }
  if (log.isUndone) {
    return NextResponse.json({ error: "此紀錄已經被復原過" }, { status: 400 });
  }
  if (!canUndoLog(session, log)) {
    return NextResponse.json({ error: "沒有權限復原此紀錄" }, { status: 403 });
  }

  await prisma.$transaction([
    prisma.scoreLog.update({ where: { id: log.id }, data: { isUndone: true } }),
    prisma.student.update({
      where: { id: log.studentId },
      data: { score: { decrement: log.points } },
    }),
    // 復原操作本身也留紀錄（除了管理員的操作不留他人可見紀錄，
    // 但此處遵照規格：管理員以外的復原動作一律留紀錄）
    ...(session.isAdmin
      ? []
      : [
          prisma.scoreLog.create({
            data: {
              studentId: log.studentId,
              operatorId: session.accountId,
              actingAs: "UNDO",
              points: -log.points,
              mode: "UNDO",
              sourceLabel: `復原紀錄 ${log.id}`,
            },
          }),
        ]),
  ]);

  return NextResponse.json({ ok: true });
}
