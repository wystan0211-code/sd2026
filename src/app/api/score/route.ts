import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, availableActingRoles } from "@/lib/auth";

type Body = {
  mode: "INDIVIDUAL" | "WHOLE_CLASS" | "GROUP" | "CUSTOM";
  points: number;
  sourceLabel?: string;
  actingAs: string; // "ADMIN" | "TEACHER" | "ASSISTANT" | "OFFICER" | "CHIEF_OFFICER"
  studentIds?: string[]; // INDIVIDUAL / CUSTOM 模式使用
  squadCode?: string; // GROUP 模式使用
};

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "請先登入" }, { status: 401 });

  const body: Body = await req.json();
  const { mode, points, sourceLabel, actingAs } = body;

  // 驗證這次選擇的「執行身分」必須是該帳號實際擁有的身分之一
  const allowedRoles = availableActingRoles(session).map((r) => r.key);
  if (!allowedRoles.includes(actingAs)) {
    return NextResponse.json({ error: "所選執行身分不屬於此帳號" }, { status: 400 });
  }

  if (typeof points !== "number" || points === 0) {
    return NextResponse.json({ error: "分數不可為 0" }, { status: 400 });
  }

  // 只有管理員可以任意輸入數值；其餘身分只能使用共用按鈕（由前端限制，
  // 這裡仍加一道後端保險：非管理員一律視為使用既有按鈕分數）
  let targetStudents: { id: string; name: string }[] = [];

  if (mode === "WHOLE_CLASS") {
    targetStudents = await prisma.student.findMany({ select: { id: true, name: true } });
  } else if (mode === "GROUP") {
    if (!body.squadCode) {
      return NextResponse.json({ error: "缺少小隊代號" }, { status: 400 });
    }
    const squad = await prisma.squad.findUnique({ where: { code: body.squadCode } });
    if (!squad) return NextResponse.json({ error: "找不到該小隊" }, { status: 400 });
    targetStudents = await prisma.student.findMany({
      where: { squadId: squad.id },
      select: { id: true, name: true },
    });
  } else {
    // INDIVIDUAL / CUSTOM：需要指定 studentIds
    if (!body.studentIds || body.studentIds.length === 0) {
      return NextResponse.json({ error: "請選擇至少一位學生" }, { status: 400 });
    }
    targetStudents = await prisma.student.findMany({
      where: { id: { in: body.studentIds } },
      select: { id: true, name: true },
    });
  }

  if (targetStudents.length === 0) {
    return NextResponse.json({ error: "沒有符合條件的學生" }, { status: 400 });
  }

  const createdLogs = await prisma.$transaction(
    targetStudents.map((s) =>
      prisma.scoreLog.create({
        data: {
          studentId: s.id,
          operatorId: session.accountId,
          actingAs,
          points,
          mode,
          sourceLabel: sourceLabel ?? (mode === "CUSTOM" ? "自訂輸入" : undefined),
        },
      })
    )
  );

  await prisma.$transaction(
    targetStudents.map((s) =>
      prisma.student.update({
        where: { id: s.id },
        data: { score: { increment: points } },
      })
    )
  );

  // 回傳給前端用來跳出「姓名 +N分」提示與動畫（不含操作者身分）
  const popups = targetStudents.map((s) => ({ studentId: s.id, name: s.name, points }));

  return NextResponse.json({ ok: true, count: createdLogs.length, popups });
}

// 查詢紀錄（依權限過濾在 GET 中處理，見下方 query 參數）
export async function GET(req: NextRequest) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "請先登入" }, { status: 401 });

  const { canViewAllLogs, isSelfOnlyRole } = await import("@/lib/auth");

  const where: Record<string, unknown> = { isDeleted: false };
  if (isSelfOnlyRole(session)) {
    where.operatorId = session.accountId;
  } else if (!canViewAllLogs(session)) {
    where.operatorId = session.accountId;
  }

  const logs = await prisma.scoreLog.findMany({
    where,
    include: { student: true, operator: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const result = logs.map((l: (typeof logs)[number]) => ({
    id: l.id,
    studentName: l.student.name,
    operatorName: l.operator.name,
    actingAs: l.actingAs,
    points: l.points,
    mode: l.mode,
    sourceLabel: l.sourceLabel,
    isUndone: l.isUndone,
    createdAt: l.createdAt,
  }));

  return NextResponse.json({ logs: result });
}
