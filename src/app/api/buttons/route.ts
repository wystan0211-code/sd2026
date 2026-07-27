import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// 所有已登入身分共用同一套按鈕設定；只有管理員能新增/調整。
export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "請先登入" }, { status: 401 });
  const buttons = await prisma.scoreButton.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ buttons });
}

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: "只有管理員可以新增按鈕" }, { status: 403 });
  }
  const { label, points, sortOrder } = await req.json();
  if (!label || typeof points !== "number") {
    return NextResponse.json({ error: "文字與分數為必填" }, { status: 400 });
  }
  const button = await prisma.scoreButton.create({
    data: { label, points, sortOrder: sortOrder ?? 0 },
  });
  return NextResponse.json({ button });
}
