import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";

export async function GET() {
  try {
    await requireSession(); // 後台內部一律顯示完整全名
  } catch {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }
  const students = await prisma.student.findMany({
    include: { squad: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ students });
}

export async function POST(req: NextRequest) {
  const session = await requireSessionOrError();
  if (session instanceof NextResponse) return session;
  if (!session.isAdmin) {
    return NextResponse.json({ error: "只有管理員可以新增學生" }, { status: 403 });
  }

  const { name, squadCode } = await req.json();
  if (!name || !squadCode) {
    return NextResponse.json({ error: "姓名與小隊代號為必填" }, { status: 400 });
  }
  const squad = await prisma.squad.findUnique({ where: { code: squadCode } });
  if (!squad) {
    return NextResponse.json({ error: `找不到小隊代號 ${squadCode}` }, { status: 400 });
  }
  const student = await prisma.student.create({
    data: { name, squadId: squad.id },
  });
  return NextResponse.json({ student });
}

async function requireSessionOrError() {
  try {
    return await requireSession();
  } catch {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }
}
